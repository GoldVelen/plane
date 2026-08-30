# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.studio.models import (
    DecisionStatus,
    ExperimentStatus,
    FeedbackStatus,
    MilestoneStatus,
    ReleaseStatus,
    RiskStatus,
)

RELEASE_TRANSITIONS = {
    ReleaseStatus.PLANNED: (ReleaseStatus.SCOPING, ReleaseStatus.CANCELLED),
    ReleaseStatus.SCOPING: (ReleaseStatus.PLANNED, ReleaseStatus.BUILDING, ReleaseStatus.CANCELLED),
    ReleaseStatus.BUILDING: (ReleaseStatus.SCOPING, ReleaseStatus.QA, ReleaseStatus.CANCELLED),
    ReleaseStatus.QA: (ReleaseStatus.BUILDING, ReleaseStatus.READY, ReleaseStatus.CANCELLED),
    ReleaseStatus.READY: (ReleaseStatus.QA, ReleaseStatus.SUBMITTED, ReleaseStatus.RELEASED, ReleaseStatus.CANCELLED),
    ReleaseStatus.SUBMITTED: (ReleaseStatus.READY, ReleaseStatus.REVIEW, ReleaseStatus.CANCELLED),
    ReleaseStatus.REVIEW: (ReleaseStatus.READY, ReleaseStatus.RELEASED, ReleaseStatus.CANCELLED),
    ReleaseStatus.RELEASED: (ReleaseStatus.ROLLED_BACK,),
    ReleaseStatus.ROLLED_BACK: (),
    ReleaseStatus.CANCELLED: (),
}

RISK_TRANSITIONS = {
    RiskStatus.OPEN: (RiskStatus.MITIGATING, RiskStatus.MONITORING, RiskStatus.ACCEPTED, RiskStatus.CLOSED),
    RiskStatus.MITIGATING: (RiskStatus.OPEN, RiskStatus.MONITORING, RiskStatus.ACCEPTED, RiskStatus.CLOSED),
    RiskStatus.MONITORING: (RiskStatus.OPEN, RiskStatus.MITIGATING, RiskStatus.ACCEPTED, RiskStatus.CLOSED),
    RiskStatus.ACCEPTED: (RiskStatus.MONITORING, RiskStatus.CLOSED),
    RiskStatus.CLOSED: (RiskStatus.OPEN,),
}

DECISION_TRANSITIONS = {
    DecisionStatus.DRAFT: (DecisionStatus.NEEDS_DECISION, DecisionStatus.CANCELLED),
    DecisionStatus.NEEDS_DECISION: (DecisionStatus.DRAFT, DecisionStatus.DECIDED, DecisionStatus.CANCELLED),
    DecisionStatus.DECIDED: (DecisionStatus.REVISIT, DecisionStatus.REVERSED),
    DecisionStatus.REVISIT: (DecisionStatus.NEEDS_DECISION, DecisionStatus.DECIDED, DecisionStatus.CANCELLED),
    DecisionStatus.REVERSED: (),
    DecisionStatus.CANCELLED: (),
}

FEEDBACK_TRANSITIONS = {
    FeedbackStatus.INBOX: (FeedbackStatus.TRIAGED, FeedbackStatus.WONT_DO, FeedbackStatus.DUPLICATE),
    FeedbackStatus.TRIAGED: (
        FeedbackStatus.INBOX,
        FeedbackStatus.PLANNED,
        FeedbackStatus.WONT_DO,
        FeedbackStatus.DUPLICATE,
    ),
    FeedbackStatus.PLANNED: (
        FeedbackStatus.TRIAGED,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.WONT_DO,
        FeedbackStatus.DUPLICATE,
    ),
    FeedbackStatus.RESOLVED: (FeedbackStatus.TRIAGED,),
    FeedbackStatus.WONT_DO: (FeedbackStatus.TRIAGED,),
    FeedbackStatus.DUPLICATE: (FeedbackStatus.TRIAGED,),
}

EXPERIMENT_TRANSITIONS = {
    ExperimentStatus.DRAFT: (ExperimentStatus.RUNNING, ExperimentStatus.STOPPED),
    ExperimentStatus.RUNNING: (ExperimentStatus.COMPLETED, ExperimentStatus.STOPPED),
    ExperimentStatus.COMPLETED: (),
    ExperimentStatus.STOPPED: (),
}

MILESTONE_TRANSITIONS = {
    MilestoneStatus.PLANNED: (
        MilestoneStatus.IN_PROGRESS,
        MilestoneStatus.DONE,
        MilestoneStatus.MISSED,
        MilestoneStatus.CANCELLED,
    ),
    MilestoneStatus.IN_PROGRESS: (
        MilestoneStatus.PLANNED,
        MilestoneStatus.DONE,
        MilestoneStatus.MISSED,
        MilestoneStatus.CANCELLED,
    ),
    MilestoneStatus.DONE: (MilestoneStatus.IN_PROGRESS,),
    MilestoneStatus.MISSED: (
        MilestoneStatus.PLANNED,
        MilestoneStatus.IN_PROGRESS,
        MilestoneStatus.DONE,
        MilestoneStatus.CANCELLED,
    ),
    MilestoneStatus.CANCELLED: (MilestoneStatus.PLANNED,),
}


def allowed_statuses(kind, current):
    tables = {
        "release": RELEASE_TRANSITIONS,
        "risk": RISK_TRANSITIONS,
        "decision": DECISION_TRANSITIONS,
        "milestone": MILESTONE_TRANSITIONS,
        "feedback": FEEDBACK_TRANSITIONS,
        "experiment": EXPERIMENT_TRANSITIONS,
    }
    return tables[kind][current]


def assert_transition(kind, current, nxt):
    if current == nxt:
        return
    allowed = allowed_statuses(kind, current)
    if nxt not in allowed:
        raise serializers.ValidationError(
            {"status": f"Cannot transition {kind} from {current} to {nxt}."},
        )
