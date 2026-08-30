# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.studio.views import (
    StudioDecisionDetailEndpoint,
    StudioDecisionListEndpoint,
    StudioPortfolioEndpoint,
    StudioProjectOverviewEndpoint,
    StudioProjectProfileEndpoint,
    StudioReleaseDetailEndpoint,
    StudioReleaseListEndpoint,
    StudioRiskDetailEndpoint,
    StudioRiskListEndpoint,
    StudioTodayEndpoint,
)
from plane.studio.views_governance import (
    StudioDecisionAcknowledgementListEndpoint,
    StudioDecisionAcknowledgementSelfEndpoint,
    StudioDecisionOptionDetailEndpoint,
    StudioDecisionOptionListEndpoint,
    StudioMilestoneDetailEndpoint,
    StudioMilestoneListEndpoint,
    StudioProjectEventListEndpoint,
    StudioReleaseChecklistItemEndpoint,
)

app_name = "studio"

urlpatterns = [
    path("workspaces/<str:slug>/today/", StudioTodayEndpoint.as_view(), name="today"),
    path("workspaces/<str:slug>/portfolio/", StudioPortfolioEndpoint.as_view(), name="portfolio"),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/overview/",
        StudioProjectOverviewEndpoint.as_view(),
        name="project-overview",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/profile/",
        StudioProjectProfileEndpoint.as_view(),
        name="project-profile",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/releases/",
        StudioReleaseListEndpoint.as_view(),
        name="release-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/releases/<uuid:pk>/",
        StudioReleaseDetailEndpoint.as_view(),
        name="release-detail",
    ),
    path(
        "workspaces/<str:slug>/decisions/",
        StudioDecisionListEndpoint.as_view(),
        name="decision-list",
    ),
    path(
        "workspaces/<str:slug>/decisions/<uuid:pk>/",
        StudioDecisionDetailEndpoint.as_view(),
        name="decision-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/risks/",
        StudioRiskListEndpoint.as_view(),
        name="risk-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/risks/<uuid:pk>/",
        StudioRiskDetailEndpoint.as_view(),
        name="risk-detail",
    ),
    path(
        "workspaces/<str:slug>/decisions/<uuid:pk>/options/",
        StudioDecisionOptionListEndpoint.as_view(),
        name="decision-option-list",
    ),
    path(
        "workspaces/<str:slug>/decisions/<uuid:pk>/options/<uuid:option_id>/",
        StudioDecisionOptionDetailEndpoint.as_view(),
        name="decision-option-detail",
    ),
    path(
        "workspaces/<str:slug>/decisions/<uuid:pk>/acknowledgements/",
        StudioDecisionAcknowledgementListEndpoint.as_view(),
        name="decision-acknowledgement-list",
    ),
    path(
        "workspaces/<str:slug>/decisions/<uuid:pk>/acknowledgements/me/",
        StudioDecisionAcknowledgementSelfEndpoint.as_view(),
        name="decision-acknowledgement-self",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/",
        StudioMilestoneListEndpoint.as_view(),
        name="milestone-list",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/milestones/<uuid:pk>/",
        StudioMilestoneDetailEndpoint.as_view(),
        name="milestone-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/releases/<uuid:pk>/checklist/<uuid:item_id>/",
        StudioReleaseChecklistItemEndpoint.as_view(),
        name="release-checklist-item",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/events/",
        StudioProjectEventListEndpoint.as_view(),
        name="project-event-list",
    ),
]
