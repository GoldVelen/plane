from pathlib import Path

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from plane.db.models import Issue, Project
from plane.studio.models import StudioExperiment, StudioFeedback, StudioImportMap
from plane.studio.services.legacy_import import REFUSE_PLANE_REWRITE

pytestmark = pytest.mark.django_db

FIXTURE = Path(__file__).resolve().parents[1] / "fixtures" / "legacy_studio_export.json"


def test_legacy_import_dry_run_and_apply_do_not_rewrite_plane(studio_context, capsys):
    project_count = Project.objects.count()
    issue_count = Issue.objects.count()
    original_name = studio_context.project.name

    call_command(
        "studio_import_legacy",
        "--workspace",
        studio_context.workspace.slug,
        "--fixture",
        str(FIXTURE),
    )
    dry = capsys.readouterr().out
    assert '"dry_run": true' in dry
    assert StudioFeedback.objects.count() == 0
    assert Project.objects.count() == project_count
    assert Issue.objects.count() == issue_count

    call_command(
        "studio_import_legacy",
        "--workspace",
        studio_context.workspace.slug,
        "--fixture",
        str(FIXTURE),
        "--apply",
    )
    applied = capsys.readouterr().out
    assert '"dry_run": false' in applied
    assert StudioFeedback.objects.filter(title="Legacy store review lag").count() == 1
    assert StudioExperiment.objects.filter(title="Legacy pricing copy").count() == 1
    assert StudioImportMap.objects.filter(source_id="legacy-feedback-1").exists()
    studio_context.project.refresh_from_db()
    assert studio_context.project.name == original_name
    assert Project.objects.count() == project_count
    assert Issue.objects.count() == issue_count
    assert '"refused_plane_rewrites": 1' in applied

    call_command(
        "studio_import_legacy",
        "--workspace",
        studio_context.workspace.slug,
        "--fixture",
        str(FIXTURE),
        "--apply",
    )
    capsys.readouterr()
    assert StudioFeedback.objects.filter(title="Legacy store review lag").count() == 1


def test_legacy_import_refuses_plane_rewrite_flag(studio_context):
    with pytest.raises(CommandError, match=REFUSE_PLANE_REWRITE):
        call_command(
            "studio_import_legacy",
            "--workspace",
            studio_context.workspace.slug,
            "--fixture",
            str(FIXTURE),
            "--apply",
            "--rewrite-plane",
        )
    assert Project.objects.filter(id=studio_context.project.id).exists()
    assert Issue.objects.filter(project=studio_context.project).count() == 0
