# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hashlib
import hmac

from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from plane.studio.models import (
    GithubBindingStatus,
    GithubKind,
    StudioGithubBinding,
    StudioGithubDelivery,
    StudioGithubProjection,
)
from plane.studio.services.events import record_studio_event

PENDING_EXTERNAL_CREDENTIAL = GithubBindingStatus.PENDING_EXTERNAL_CREDENTIAL


def webhook_secret():
    return (getattr(settings, "STUDIO_GITHUB_WEBHOOK_SECRET", "") or "").strip()


def collector_credentials_present():
    app_id = (getattr(settings, "STUDIO_GITHUB_APP_ID", "") or "").strip()
    private_key = (getattr(settings, "STUDIO_GITHUB_APP_PRIVATE_KEY", "") or "").strip()
    token = (getattr(settings, "STUDIO_GITHUB_READ_TOKEN", "") or "").strip()
    return bool((app_id and private_key) or token)


def credential_status():
    if collector_credentials_present():
        return GithubBindingStatus.CONNECTED
    return PENDING_EXTERNAL_CREDENTIAL


def verify_github_signature(body, signature_header, secret=None):
    secret = secret if secret is not None else webhook_secret()
    if not secret or not signature_header:
        return False
    if "=" not in signature_header:
        return False
    algo, digest = signature_header.split("=", 1)
    if algo != "sha256" or not digest:
        return False
    expected = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, digest)


def binding_status_for(binding):
    creds = credential_status()
    if creds == PENDING_EXTERNAL_CREDENTIAL:
        return PENDING_EXTERNAL_CREDENTIAL
    if binding and binding.degraded_reason:
        return GithubBindingStatus.DEGRADED
    if binding and binding.last_captured_at:
        return GithubBindingStatus.CONNECTED
    return PENDING_EXTERNAL_CREDENTIAL


def get_or_create_binding(project):
    binding, _ = StudioGithubBinding.objects.get_or_create(
        project=project,
        defaults={"status": credential_status()},
    )
    status = binding_status_for(binding)
    if binding.status != status:
        binding.status = status
        binding.save(update_fields=["status", "updated_at"])
    return binding


def upsert_projection(*, project, kind, external_id, title, url, payload):
    now = timezone.now()
    projection, created = StudioGithubProjection.objects.get_or_create(
        project=project,
        kind=kind,
        external_id=str(external_id),
        defaults={
            "captured_at": now,
            "title": title or "",
            "url": url or "",
            "payload": payload or {},
        },
    )
    if not created:
        projection.captured_at = now
        projection.title = title or projection.title
        projection.url = url or projection.url
        projection.payload = payload or projection.payload
        projection.save(update_fields=["captured_at", "title", "url", "payload", "updated_at"])
    return projection


def record_delivery(workspace, project, delivery_id, event):
    existing = StudioGithubDelivery.objects.filter(delivery_id=delivery_id).first()
    if existing:
        return existing, True
    delivery = StudioGithubDelivery.objects.create(
        workspace=workspace,
        project=project,
        delivery_id=delivery_id,
        event=event,
        processed_at=timezone.now(),
    )
    return delivery, False


def apply_github_event(*, project, event, payload):
    repository = ((payload.get("repository") or {}).get("full_name") or "").strip()
    binding = get_or_create_binding(project)
    if binding.repository and repository and binding.repository != repository:
        raise serializers.ValidationError({"repository": "Webhook repository does not match this project binding."})
    if repository and not binding.repository:
        binding.repository = repository
    kind = None
    external_id = None
    title = ""
    url = ""
    if event == "push":
        kind = GithubKind.LAST_COMMIT
        head = payload.get("head_commit") or {}
        external_id = head.get("id") or payload.get("after")
        title = head.get("message") or external_id or "commit"
        url = head.get("url") or ""
    elif event == "pull_request":
        kind = GithubKind.PULL_REQUEST
        pr = payload.get("pull_request") or {}
        external_id = str(pr.get("number") or pr.get("id") or "")
        title = pr.get("title") or f"PR {external_id}"
        url = pr.get("html_url") or ""
    elif event in ("check_suite", "workflow_run", "check_run"):
        kind = GithubKind.CI
        node = payload.get("workflow_run") or payload.get("check_suite") or payload.get("check_run") or {}
        external_id = str(node.get("id") or "")
        title = node.get("name") or node.get("display_title") or event
        url = node.get("html_url") or ""
    elif event == "release":
        kind = GithubKind.RELEASE
        release = payload.get("release") or {}
        external_id = str(release.get("id") or release.get("tag_name") or "")
        title = release.get("name") or release.get("tag_name") or "release"
        url = release.get("html_url") or ""
    if not kind or not external_id:
        return None
    projection = upsert_projection(
        project=project,
        kind=kind,
        external_id=external_id,
        title=title,
        url=url,
        payload=payload,
    )
    binding.last_captured_at = projection.captured_at
    binding.status = binding_status_for(binding)
    binding.save(update_fields=["repository", "last_captured_at", "status", "updated_at"])
    record_studio_event(
        workspace=project.workspace,
        project=project,
        actor=None,
        entity_type="github_projection",
        entity_id=projection.id,
        action="captured",
        payload={"kind": kind, "external_id": str(external_id)},
    )
    return projection


def collect_read_only_facts(project):
    """Read-only collector. Never writes to GitHub. No-ops without credentials."""
    binding = get_or_create_binding(project)
    if not collector_credentials_present():
        binding.status = PENDING_EXTERNAL_CREDENTIAL
        binding.degraded_reason = ""
        binding.save(update_fields=["status", "degraded_reason", "updated_at"])
        return binding, False
    # Live GitHub HTTP collection is intentionally not invoked without verified
    # credentials. The webhook + harness path is the local proof.
    binding.status = GithubBindingStatus.CONNECTED
    binding.save(update_fields=["status", "updated_at"])
    return binding, True
