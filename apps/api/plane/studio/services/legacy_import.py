# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from rest_framework import serializers

from plane.db.models import Issue, Project, Workspace
from plane.studio.models import (
    StudioContentItem,
    StudioExperiment,
    StudioFeedback,
    StudioImportMap,
    StudioRoutine,
)
from plane.studio.services.events import record_studio_event

REFUSE_PLANE_REWRITE = "Refusing to rewrite Plane Project or Issue rows."


def _resolve_project(workspace, identifier):
    if not identifier:
        return None
    return Project.objects.filter(workspace=workspace, identifier=identifier).first()


def _already_imported(workspace, source_table, source_id):
    return StudioImportMap.objects.filter(
        workspace=workspace, source_table=source_table, source_id=str(source_id)
    ).first()


def import_legacy_payload(*, workspace_slug, payload, apply, rewrite_plane=False):
    if rewrite_plane:
        raise serializers.ValidationError({"plane": REFUSE_PLANE_REWRITE})
    workspace = Workspace.objects.filter(slug=workspace_slug).first()
    if workspace is None:
        raise serializers.ValidationError({"workspace": f"Workspace {workspace_slug} was not found."})

    report = {
        "dry_run": not apply,
        "created": {"feedback": 0, "experiments": 0, "content_items": 0, "routines": 0},
        "skipped": {"feedback": 0, "experiments": 0, "content_items": 0, "routines": 0},
        "missing_projects": [],
        "refused_plane_rewrites": 0,
        "plane_project_count_before": Project.objects.filter(workspace=workspace).count(),
        "plane_issue_count_before": Issue.objects.filter(workspace=workspace).count(),
    }
    if payload.get("plane_projects") or payload.get("plane_issues"):
        report["refused_plane_rewrites"] = len(payload.get("plane_projects") or []) + len(
            payload.get("plane_issues") or []
        )

    def import_row(kind, source_table, model, rows, build_kwargs):
        for row in rows:
            source_id = str(row.get("source_id") or row.get("id") or "")
            if not source_id:
                continue
            if _already_imported(workspace, source_table, source_id):
                report["skipped"][kind] += 1
                continue
            identifier = row.get("project_identifier")
            project = _resolve_project(workspace, identifier)
            if identifier and project is None:
                if identifier not in report["missing_projects"]:
                    report["missing_projects"].append(identifier)
                report["skipped"][kind] += 1
                continue
            if project is None:
                report["skipped"][kind] += 1
                continue
            if not apply:
                report["created"][kind] += 1
                continue
            with transaction.atomic():
                instance = model.objects.create(project=project, **build_kwargs(row))
                StudioImportMap.objects.create(
                    workspace=workspace,
                    project=project,
                    source_table=source_table,
                    source_id=source_id,
                    entity_type=kind,
                    entity_id=instance.id,
                )
                record_studio_event(
                    workspace=workspace,
                    project=project,
                    actor=None,
                    entity_type="import",
                    entity_id=instance.id,
                    action="imported",
                    payload={"source_table": source_table, "source_id": source_id},
                )
                report["created"][kind] += 1

    import_row(
        "feedback",
        "feedback",
        StudioFeedback,
        payload.get("feedback") or [],
        lambda row: {
            "title": (row.get("title") or "Imported feedback")[:160],
            "body": row.get("body") or "",
            "source": row.get("source") or "OTHER",
            "sentiment": row.get("sentiment") or "UNKNOWN",
            "priority": row.get("priority") or "P2",
            "status": row.get("status") or "INBOX",
        },
    )
    import_row(
        "experiments",
        "experiments",
        StudioExperiment,
        payload.get("experiments") or [],
        lambda row: {
            "title": (row.get("title") or "Imported experiment")[:160],
            "hypothesis": row.get("hypothesis") or "",
            "status": row.get("status") or "DRAFT",
            "result": row.get("result") or "",
            "conclusion": row.get("conclusion") or "",
        },
    )
    import_row(
        "content_items",
        "content_items",
        StudioContentItem,
        payload.get("content_items") or [],
        lambda row: {
            "title": (row.get("title") or "Imported content")[:160],
            "brief": row.get("brief") or "",
            "channel": row.get("channel") or "OTHER",
            "status": row.get("status") or "IDEA",
        },
    )
    import_row(
        "routines",
        "routines",
        StudioRoutine,
        payload.get("routines") or [],
        lambda row: {
            "name": (row.get("name") or "Imported routine")[:160],
            "cadence": "WEEKLY" if "WEEKLY" in str(row.get("cadence") or "").upper() else "AD_HOC",
            "is_active": bool(row.get("active", True)),
            "notes": row.get("notes") or "",
        },
    )
    report["plane_project_count_after"] = Project.objects.filter(workspace=workspace).count()
    report["plane_issue_count_after"] = Issue.objects.filter(workspace=workspace).count()
    return report
