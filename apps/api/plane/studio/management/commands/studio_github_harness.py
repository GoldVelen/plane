# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import hashlib
import hmac
import json

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.test import Client

from plane.db.models import Project
from plane.studio.services.github import PENDING_EXTERNAL_CREDENTIAL, credential_status


class Command(BaseCommand):
    help = "Local GitHub webhook harness. Signs a read-only push payload. Does not call GitHub."

    def add_arguments(self, parser):
        parser.add_argument("--slug", required=True)
        parser.add_argument("--project-id", required=True)
        parser.add_argument("--repository", default="acme/app")
        parser.add_argument("--delivery-id", default="harness-delivery")
        parser.add_argument("--secret", default="")

    def handle(self, *args, **options):
        secret = options["secret"] or getattr(settings, "STUDIO_GITHUB_WEBHOOK_SECRET", "")
        if not secret:
            self.stdout.write(PENDING_EXTERNAL_CREDENTIAL)
            self.stdout.write("No STUDIO_GITHUB_WEBHOOK_SECRET; harness cannot sign a webhook.")
            self.stdout.write(f"collector_status={credential_status()}")
            return
        project = Project.objects.filter(id=options["project_id"], workspace__slug=options["slug"]).first()
        if project is None:
            raise CommandError("Project not found.")
        payload = {
            "repository": {"full_name": options["repository"]},
            "after": "harness-sha",
            "head_commit": {"id": "harness-sha", "message": "harness last commit"},
        }
        body = json.dumps(payload).encode("utf-8")
        digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
        client = Client()
        response = client.post(
            f"/api/studio/workspaces/{options['slug']}/projects/{options['project_id']}/github/webhook/",
            data=body,
            content_type="application/json",
            HTTP_X_HUB_SIGNATURE_256=f"sha256={digest}",
            HTTP_X_GITHUB_EVENT="push",
            HTTP_X_GITHUB_DELIVERY=options["delivery_id"],
        )
        self.stdout.write(f"status={response.status_code}")
        self.stdout.write(response.content.decode("utf-8"))
        self.stdout.write(f"collector_status={credential_status()}")
