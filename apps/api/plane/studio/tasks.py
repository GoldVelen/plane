# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from celery import shared_task

from plane.db.models import Project
from plane.studio.services.github import collect_read_only_facts


@shared_task
def collect_studio_github_facts(project_id):
    project = Project.objects.filter(id=project_id).select_related("workspace").first()
    if project is None:
        return False
    _binding, collected = collect_read_only_facts(project)
    return collected
