import hashlib
import hmac
import json

import pytest
from django.test import override_settings
from rest_framework.test import APIClient

from plane.studio.models import GithubKind, StudioGithubDelivery, StudioGithubProjection
from plane.studio.services.github import PENDING_EXTERNAL_CREDENTIAL

pytestmark = pytest.mark.django_db

SECRET = "studio-github-test-secret"


def project_url(context, suffix):
    return f"/api/studio/workspaces/{context.workspace.slug}/projects/{context.project.id}/{suffix}"


def _sign(body: bytes, secret: str = SECRET) -> str:
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return f"sha256={digest}"


def test_github_status_is_pending_without_credentials(studio_client, studio_context):
    response = studio_client.get(project_url(studio_context, "github/"))
    assert response.status_code == 200
    assert response.data["status"] == PENDING_EXTERNAL_CREDENTIAL
    assert response.data["connected"] is False
    assert response.data["projections"] == []


@override_settings(STUDIO_GITHUB_WEBHOOK_SECRET=SECRET)
def test_unsigned_and_wrong_signature_webhooks_are_rejected(studio_client, studio_context):
    studio_client.get(project_url(studio_context, "github/"))
    payload = {
        "repository": {"full_name": "acme/app"},
        "after": "abc123",
        "head_commit": {"id": "abc123", "message": "fix"},
    }
    body = json.dumps(payload).encode()
    client = APIClient()
    unsigned = client.post(
        project_url(studio_context, "github/webhook/"),
        data=body,
        content_type="application/json",
        HTTP_X_GITHUB_EVENT="push",
        HTTP_X_GITHUB_DELIVERY="delivery-unsigned",
    )
    assert unsigned.status_code == 401

    wrong = client.post(
        project_url(studio_context, "github/webhook/"),
        data=body,
        content_type="application/json",
        HTTP_X_HUB_SIGNATURE_256=_sign(body, "other-secret"),
        HTTP_X_GITHUB_EVENT="push",
        HTTP_X_GITHUB_DELIVERY="delivery-wrong",
    )
    assert wrong.status_code == 401
    assert StudioGithubProjection.objects.count() == 0


@override_settings(STUDIO_GITHUB_WEBHOOK_SECRET=SECRET)
def test_github_webhook_is_deduped_and_projections_include_captured_at(studio_client, studio_context):
    bind = studio_client.patch(
        project_url(studio_context, "github/"),
        {"repository": "acme/app"},
        format="json",
    )
    assert bind.status_code == 200
    payload = {
        "repository": {"full_name": "acme/app"},
        "after": "def456",
        "head_commit": {"id": "def456", "message": "readme"},
    }
    body = json.dumps(payload).encode()
    headers = {
        "HTTP_X_HUB_SIGNATURE_256": _sign(body),
        "HTTP_X_GITHUB_EVENT": "push",
        "HTTP_X_GITHUB_DELIVERY": "delivery-1",
    }
    client = APIClient()
    first = client.post(
        project_url(studio_context, "github/webhook/"),
        data=body,
        content_type="application/json",
        **headers,
    )
    assert first.status_code == 202
    assert first.data["duplicate"] is False
    assert StudioGithubDelivery.objects.filter(delivery_id="delivery-1").count() == 1
    projection = StudioGithubProjection.objects.get(kind=GithubKind.LAST_COMMIT)
    assert projection.captured_at is not None
    assert projection.external_id == "def456"

    second = client.post(
        project_url(studio_context, "github/webhook/"),
        data=body,
        content_type="application/json",
        **headers,
    )
    assert second.status_code == 202
    assert second.data["duplicate"] is True
    assert StudioGithubProjection.objects.filter(kind=GithubKind.LAST_COMMIT).count() == 1

    status = studio_client.get(project_url(studio_context, "github/"))
    assert status.status_code == 200
    assert status.data["projections"][0]["captured_at"]
    assert status.data["connected"] is False
    assert status.data["status"] == PENDING_EXTERNAL_CREDENTIAL
    assert status.data["credential_status"] == PENDING_EXTERNAL_CREDENTIAL
