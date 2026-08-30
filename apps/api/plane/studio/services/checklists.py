# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.studio.models import ProductType, StudioReleaseChecklistItem

CHECKLIST_TEMPLATES = {
    ProductType.IOS_APP: (
        ("version_build", "Version and build numbers"),
        ("tests_pass", "Automated tests pass"),
        ("crash_check", "Crash and critical log check"),
        ("privacy", "Privacy and permission copy"),
        ("iap", "Subscription / IAP configuration"),
        ("testflight", "TestFlight verification"),
        ("store_assets", "Store screenshots, description, keywords"),
        ("submit", "Submit for review"),
        ("review_status", "Review status"),
        ("rollout", "Rollout strategy"),
        ("monitor", "Post-release monitoring"),
        ("retro", "Retrospective"),
    ),
    ProductType.WECHAT_MINI_PROGRAM: (
        ("version", "Version information"),
        ("trial_verify", "Trial build verification"),
        ("api_domain", "API domains and environments"),
        ("privacy", "Permissions and privacy copy"),
        ("payment", "Payment or virtual-goods path"),
        ("review_assets", "Review assets"),
        ("submit", "Submit for review"),
        ("release", "Release"),
        ("monitor", "Post-release monitoring"),
        ("retro", "Retrospective"),
    ),
    ProductType.WEB_APP: (
        ("migration", "Database migration and rollback"),
        ("backup", "Backup"),
        ("ci", "CI tests"),
        ("preview", "Preview verification"),
        ("env", "Environment variables"),
        ("dns_ssl", "DNS / TLS"),
        ("monitoring", "Monitoring and alerts"),
        ("deploy", "Deploy"),
        ("smoke", "Smoke test"),
        ("rollback", "Rollback verification"),
        ("retro", "Retrospective"),
    ),
}

DEFAULT_CHECKLIST = (
    ("scope", "Scope confirmation"),
    ("qa", "Quality check"),
    ("assets", "Release assets"),
    ("announce", "Announcement"),
    ("monitor", "Post-release monitoring"),
    ("retro", "Retrospective"),
)


def template_for(product_type):
    return CHECKLIST_TEMPLATES.get(product_type, DEFAULT_CHECKLIST)


def instantiate_release_checklist(release, product_type):
    items = template_for(product_type)
    StudioReleaseChecklistItem.objects.bulk_create(
        [
            StudioReleaseChecklistItem(
                project=release.project,
                workspace=release.workspace,
                release=release,
                key=key,
                title=title,
                sort_order=index,
            )
            for index, (key, title) in enumerate(items)
        ]
    )
