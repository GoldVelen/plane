# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import json
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from plane.studio.services.legacy_import import REFUSE_PLANE_REWRITE, import_legacy_payload


class Command(BaseCommand):
    help = "Import operating records from a legacy Studio OS export. Never rewrites Plane Project or Issue rows."

    def add_arguments(self, parser):
        parser.add_argument("--workspace", required=True)
        parser.add_argument("--fixture", required=True)
        parser.add_argument("--apply", action="store_true", default=False)
        parser.add_argument("--rewrite-plane", action="store_true", default=False)

    def handle(self, *args, **options):
        if options["rewrite_plane"]:
            raise CommandError(REFUSE_PLANE_REWRITE)
        path = Path(options["fixture"])
        if not path.exists():
            raise CommandError(f"Fixture not found: {path}")
        payload = json.loads(path.read_text())
        report = import_legacy_payload(
            workspace_slug=options["workspace"],
            payload=payload,
            apply=options["apply"],
        )
        self.stdout.write(json.dumps(report, indent=2, default=str))
