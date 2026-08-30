# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from plane.studio.models import StudioEvent


def record_studio_event(*, workspace, project, actor, entity_type, entity_id, action, payload=None):
    return StudioEvent.objects.create(
        workspace=workspace,
        project=project,
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        payload=payload or {},
    )
