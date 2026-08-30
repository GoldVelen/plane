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
]
