# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from plane.app.views import BaseAPIView
from plane.db.models import Project
from plane.studio.models import StudioGithubProjection
from plane.studio.permissions import StudioProjectAccessPermission, permission_summary
from plane.studio.services.github import (
    apply_github_event,
    binding_status_for,
    credential_status,
    get_or_create_binding,
    record_delivery,
    verify_github_signature,
    webhook_secret,
)
from plane.studio.views import _project_for_request


class StudioGithubEndpoint(BaseAPIView):
    permission_classes = [StudioProjectAccessPermission]

    def get(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        binding = get_or_create_binding(project)
        projections = StudioGithubProjection.objects.filter(project=project)
        creds = credential_status()
        status_value = binding_status_for(binding)
        return Response(
            {
                "repository": binding.repository,
                "status": status_value,
                "credential_status": creds,
                "connected": status_value == "CONNECTED",
                "last_captured_at": binding.last_captured_at.isoformat() if binding.last_captured_at else None,
                "degraded_reason": binding.degraded_reason or None,
                "projections": [
                    {
                        "id": str(item.id),
                        "kind": item.kind,
                        "external_id": item.external_id,
                        "captured_at": item.captured_at.isoformat(),
                        "title": item.title,
                        "url": item.url,
                    }
                    for item in projections
                ],
                "permissions": permission_summary(request.user, slug, project_id=project.id),
                "generated_at": timezone.now().isoformat(),
            }
        )

    def patch(self, request, slug, project_id):
        project = _project_for_request(request, slug, project_id)
        binding = get_or_create_binding(project)
        repository = (request.data.get("repository") or "").strip()
        if repository:
            binding.repository = repository
            binding.status = binding_status_for(binding)
            binding.save(update_fields=["repository", "status", "updated_at"])
        return self.get(request, slug, project_id)


class StudioGithubWebhookEndpoint(BaseAPIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request, slug, project_id):
        if not webhook_secret():
            return Response(
                {"error": "GitHub webhook secret is not configured.", "status": "PENDING_EXTERNAL_CREDENTIAL"},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        body = request.body
        signature = request.headers.get("X-Hub-Signature-256") or request.META.get("HTTP_X_HUB_SIGNATURE_256")
        if not verify_github_signature(body, signature):
            return Response({"error": "Invalid GitHub webhook signature."}, status=status.HTTP_401_UNAUTHORIZED)
        delivery_id = request.headers.get("X-GitHub-Delivery") or request.META.get("HTTP_X_GITHUB_DELIVERY")
        event = request.headers.get("X-GitHub-Event") or request.META.get("HTTP_X_GITHUB_EVENT") or ""
        if not delivery_id:
            return Response({"error": "Missing X-GitHub-Delivery."}, status=status.HTTP_400_BAD_REQUEST)
        project = get_object_or_404(Project.objects.select_related("workspace"), workspace__slug=slug, id=project_id)
        delivery, duplicate = record_delivery(project.workspace, project, delivery_id, event)
        if duplicate:
            return Response({"duplicate": True, "delivery_id": delivery.delivery_id}, status=status.HTTP_202_ACCEPTED)
        try:
            payload = json.loads(body.decode("utf-8") or "{}")
        except json.JSONDecodeError:
            return Response({"error": "Invalid JSON payload."}, status=status.HTTP_400_BAD_REQUEST)
        apply_github_event(project=project, event=event, payload=payload)
        return Response({"duplicate": False, "delivery_id": delivery.delivery_id}, status=status.HTTP_202_ACCEPTED)
