# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.db import transaction
from rest_framework import serializers

from plane.db.models import Issue
from plane.studio.services.events import record_studio_event

PRIORITY_TO_PLANE = {
    "P0": "urgent",
    "P1": "high",
    "P2": "medium",
    "P3": "low",
}


def escape_html(value):
    return (
        str(value)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


def _paragraph(label, value):
    if value is None or str(value).strip() == "":
        return ""
    return f"<p><b>{escape_html(label)}</b>: {escape_html(value)}</p>"


def build_convert_description_html(record, entity_type):
    title = getattr(record, "title", None) or getattr(record, "name", "")
    parts = [
        f"<p>{escape_html(getattr(record, 'body', None) or getattr(record, 'hypothesis', None) or getattr(record, 'brief', None) or getattr(record, 'notes', None) or title)}</p>",
        _paragraph("Studio record", entity_type),
        _paragraph("Source", getattr(record, "source", None)),
        _paragraph("Sentiment", getattr(record, "sentiment", None)),
        _paragraph("Priority", getattr(record, "priority", None)),
        _paragraph("Reporter", getattr(record, "reporter_name", None)),
        _paragraph("Original URL", getattr(record, "source_url", None)),
        _paragraph("Channel", getattr(record, "channel", None)),
        _paragraph("Cadence", getattr(record, "cadence", None)),
    ]
    return "".join(part for part in parts if part)


def convert_operating_record_to_issue(*, record, actor, entity_type):
    model = type(record)
    with transaction.atomic():
        locked = model.objects.select_for_update(of=("self",)).select_related("project").get(pk=record.pk)
        if locked.linked_issue_id:
            return model.objects.select_related("linked_issue", "linked_issue__project").get(pk=locked.pk)
        title = getattr(locked, "title", None) or getattr(locked, "name")
        try:
            issue = Issue.objects.create(
                name=str(title)[:255],
                description_html=build_convert_description_html(locked, entity_type),
                priority=PRIORITY_TO_PLANE.get(getattr(locked, "priority", None), "none"),
                project=locked.project,
                created_by=actor,
            )
        except Exception as exc:
            raise serializers.ValidationError(
                {"linked_issue_id": "Could not create a Plane work item from this record."}
            ) from exc
        locked.linked_issue = issue
        locked.save(update_fields=["linked_issue", "updated_at"])
        record_studio_event(
            workspace=locked.workspace,
            project=locked.project,
            actor=actor,
            entity_type=entity_type,
            entity_id=locked.id,
            action="converted",
            payload={"linked_issue_id": str(issue.id), "sequence_id": issue.sequence_id},
        )
        return model.objects.select_related("linked_issue", "linked_issue__project").get(pk=locked.pk)
