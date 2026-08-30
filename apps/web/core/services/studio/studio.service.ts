/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isAxiosError } from "axios";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  IStudioContentItem,
  IStudioDecision,
  IStudioExperiment,
  IStudioFeedback,
  IStudioMetricDefinition,
  IStudioOperations,
  IStudioPortfolio,
  IStudioProjectOverview,
  IStudioProjectProfile,
  IStudioRelease,
  IStudioRisk,
  IStudioRoutine,
  IStudioTimeline,
  IStudioToday,
  IStudioWeeklyReview,
  TStudioContentInput,
  TStudioDecisionInput,
  TStudioExperimentInput,
  TStudioFeedbackInput,
  TStudioMetricInput,
  TStudioWeeklyReviewInput,
  TStudioProjectProfileInput,
  TStudioMilestoneInput,
  TStudioReleaseInput,
  TStudioRiskInput,
  TStudioRoutineInput,
} from "./types";

const studioWorkspaceUrl = (workspaceSlug: string) => `/api/studio/workspaces/${workspaceSlug}`;
const studioProjectUrl = (workspaceSlug: string, projectId: string) =>
  `${studioWorkspaceUrl(workspaceSlug)}/projects/${projectId}`;

const throwResponseError = (error: unknown): never => {
  if (isAxiosError(error)) throw error.response?.data ?? error;
  throw error;
};

export class StudioService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getToday(workspaceSlug: string): Promise<IStudioToday> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/today/`)
      .then((response) => response.data as IStudioToday)
      .catch(throwResponseError);
  }

  async getPortfolio(workspaceSlug: string): Promise<IStudioPortfolio> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/portfolio/`)
      .then((response) => response.data as IStudioPortfolio)
      .catch(throwResponseError);
  }

  async getProjectOverview(workspaceSlug: string, projectId: string): Promise<IStudioProjectOverview> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/overview/`)
      .then((response) => response.data as IStudioProjectOverview)
      .catch(throwResponseError);
  }

  async getProjectProfile(workspaceSlug: string, projectId: string): Promise<IStudioProjectProfile | null> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/profile/`)
      .then((response) => response.data as IStudioProjectProfile)
      .catch((error: unknown) => {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        return throwResponseError(error);
      });
  }

  async updateProjectProfile(
    workspaceSlug: string,
    projectId: string,
    payload: TStudioProjectProfileInput
  ): Promise<IStudioProjectProfile> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/profile/`, payload)
      .then((response) => response.data as IStudioProjectProfile)
      .catch(throwResponseError);
  }

  async getReleases(workspaceSlug: string, projectId: string): Promise<IStudioRelease[]> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/releases/`)
      .then((response) => response.data as IStudioRelease[])
      .catch(throwResponseError);
  }

  async createRelease(workspaceSlug: string, projectId: string, payload: TStudioReleaseInput): Promise<IStudioRelease> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/releases/`, payload)
      .then((response) => response.data as IStudioRelease)
      .catch(throwResponseError);
  }

  async updateRelease(
    workspaceSlug: string,
    projectId: string,
    releaseId: string,
    payload: TStudioReleaseInput
  ): Promise<IStudioRelease> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/releases/${releaseId}/`, payload)
      .then((response) => response.data as IStudioRelease)
      .catch(throwResponseError);
  }

  async deleteRelease(workspaceSlug: string, projectId: string, releaseId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/releases/${releaseId}/`).catch(throwResponseError);
  }

  async getDecisions(workspaceSlug: string, projectId?: string): Promise<IStudioDecision[]> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/decisions/`, {
      params: projectId ? { project_id: projectId } : undefined,
    })
      .then((response) => response.data as IStudioDecision[])
      .catch(throwResponseError);
  }

  async createDecision(workspaceSlug: string, payload: TStudioDecisionInput): Promise<IStudioDecision> {
    return this.post(`${studioWorkspaceUrl(workspaceSlug)}/decisions/`, payload)
      .then((response) => response.data as IStudioDecision)
      .catch(throwResponseError);
  }

  async updateDecision(
    workspaceSlug: string,
    decisionId: string,
    payload: TStudioDecisionInput
  ): Promise<IStudioDecision> {
    return this.patch(`${studioWorkspaceUrl(workspaceSlug)}/decisions/${decisionId}/`, payload)
      .then((response) => response.data as IStudioDecision)
      .catch(throwResponseError);
  }

  async deleteDecision(workspaceSlug: string, decisionId: string): Promise<void> {
    await this.delete(`${studioWorkspaceUrl(workspaceSlug)}/decisions/${decisionId}/`).catch(throwResponseError);
  }

  async getRisks(workspaceSlug: string, projectId: string): Promise<IStudioRisk[]> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/risks/`)
      .then((response) => response.data as IStudioRisk[])
      .catch(throwResponseError);
  }

  async createRisk(workspaceSlug: string, projectId: string, payload: TStudioRiskInput): Promise<IStudioRisk> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/risks/`, payload)
      .then((response) => response.data as IStudioRisk)
      .catch(throwResponseError);
  }

  async updateRisk(
    workspaceSlug: string,
    projectId: string,
    riskId: string,
    payload: TStudioRiskInput
  ): Promise<IStudioRisk> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/risks/${riskId}/`, payload)
      .then((response) => response.data as IStudioRisk)
      .catch(throwResponseError);
  }

  async deleteRisk(workspaceSlug: string, projectId: string, riskId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/risks/${riskId}/`).catch(throwResponseError);
  }

  async createDecisionOption(
    workspaceSlug: string,
    decisionId: string,
    payload: { title: string; description?: string; sort_order?: number }
  ) {
    return this.post(`${studioWorkspaceUrl(workspaceSlug)}/decisions/${decisionId}/options/`, payload)
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async requestDecisionAcknowledgement(workspaceSlug: string, decisionId: string, userId: string) {
    return this.post(`${studioWorkspaceUrl(workspaceSlug)}/decisions/${decisionId}/acknowledgements/`, {
      user_id: userId,
    })
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async acknowledgeDecision(
    workspaceSlug: string,
    decisionId: string,
    payload: { state: "APPROVED" | "OBJECTED"; note?: string }
  ) {
    return this.patch(`${studioWorkspaceUrl(workspaceSlug)}/decisions/${decisionId}/acknowledgements/me/`, payload)
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async createMilestone(workspaceSlug: string, projectId: string, payload: TStudioMilestoneInput) {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/milestones/`, payload)
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async updateMilestone(workspaceSlug: string, projectId: string, milestoneId: string, payload: TStudioMilestoneInput) {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/milestones/${milestoneId}/`, payload)
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async deleteMilestone(workspaceSlug: string, projectId: string, milestoneId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/milestones/${milestoneId}/`).catch(
      throwResponseError
    );
  }

  async updateChecklistItem(
    workspaceSlug: string,
    projectId: string,
    releaseId: string,
    itemId: string,
    isDone: boolean
  ) {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/releases/${releaseId}/checklist/${itemId}/`, {
      is_done: isDone,
    })
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async getOperations(workspaceSlug: string): Promise<IStudioOperations> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/operations/`)
      .then((response) => response.data as IStudioOperations)
      .catch(throwResponseError);
  }

  async getFeedback(workspaceSlug: string, projectId: string): Promise<IStudioFeedback[]> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/feedback/`)
      .then((response) => response.data as IStudioFeedback[])
      .catch(throwResponseError);
  }

  async createFeedback(
    workspaceSlug: string,
    projectId: string,
    payload: TStudioFeedbackInput
  ): Promise<IStudioFeedback> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/feedback/`, payload)
      .then((response) => response.data as IStudioFeedback)
      .catch(throwResponseError);
  }

  async updateFeedback(
    workspaceSlug: string,
    projectId: string,
    feedbackId: string,
    payload: TStudioFeedbackInput
  ): Promise<IStudioFeedback> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/feedback/${feedbackId}/`, payload)
      .then((response) => response.data as IStudioFeedback)
      .catch(throwResponseError);
  }

  async deleteFeedback(workspaceSlug: string, projectId: string, feedbackId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/feedback/${feedbackId}/`).catch(
      throwResponseError
    );
  }

  async convertFeedback(workspaceSlug: string, projectId: string, feedbackId: string): Promise<IStudioFeedback> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/feedback/${feedbackId}/convert/`, {})
      .then((response) => response.data as IStudioFeedback)
      .catch(throwResponseError);
  }

  async createContentItem(
    workspaceSlug: string,
    projectId: string,
    payload: TStudioContentInput
  ): Promise<IStudioContentItem> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/content/`, payload)
      .then((response) => response.data as IStudioContentItem)
      .catch(throwResponseError);
  }

  async updateContentItem(
    workspaceSlug: string,
    projectId: string,
    contentId: string,
    payload: TStudioContentInput
  ): Promise<IStudioContentItem> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/content/${contentId}/`, payload)
      .then((response) => response.data as IStudioContentItem)
      .catch(throwResponseError);
  }

  async deleteContentItem(workspaceSlug: string, projectId: string, contentId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/content/${contentId}/`).catch(throwResponseError);
  }

  async convertContentItem(workspaceSlug: string, projectId: string, contentId: string): Promise<IStudioContentItem> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/content/${contentId}/convert/`, {})
      .then((response) => response.data as IStudioContentItem)
      .catch(throwResponseError);
  }

  async createRoutine(workspaceSlug: string, projectId: string, payload: TStudioRoutineInput): Promise<IStudioRoutine> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/routines/`, payload)
      .then((response) => response.data as IStudioRoutine)
      .catch(throwResponseError);
  }

  async updateRoutine(
    workspaceSlug: string,
    projectId: string,
    routineId: string,
    payload: TStudioRoutineInput
  ): Promise<IStudioRoutine> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/routines/${routineId}/`, payload)
      .then((response) => response.data as IStudioRoutine)
      .catch(throwResponseError);
  }

  async deleteRoutine(workspaceSlug: string, projectId: string, routineId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/routines/${routineId}/`).catch(throwResponseError);
  }

  async convertRoutine(workspaceSlug: string, projectId: string, routineId: string): Promise<IStudioRoutine> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/routines/${routineId}/convert/`, {})
      .then((response) => response.data as IStudioRoutine)
      .catch(throwResponseError);
  }

  async createExperiment(
    workspaceSlug: string,
    projectId: string,
    payload: TStudioExperimentInput
  ): Promise<IStudioExperiment> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/experiments/`, payload)
      .then((response) => response.data as IStudioExperiment)
      .catch(throwResponseError);
  }

  async updateExperiment(
    workspaceSlug: string,
    projectId: string,
    experimentId: string,
    payload: TStudioExperimentInput
  ): Promise<IStudioExperiment> {
    return this.patch(`${studioProjectUrl(workspaceSlug, projectId)}/experiments/${experimentId}/`, payload)
      .then((response) => response.data as IStudioExperiment)
      .catch(throwResponseError);
  }

  async deleteExperiment(workspaceSlug: string, projectId: string, experimentId: string): Promise<void> {
    await this.delete(`${studioProjectUrl(workspaceSlug, projectId)}/experiments/${experimentId}/`).catch(
      throwResponseError
    );
  }

  async convertExperiment(workspaceSlug: string, projectId: string, experimentId: string): Promise<IStudioExperiment> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/experiments/${experimentId}/convert/`, {})
      .then((response) => response.data as IStudioExperiment)
      .catch(throwResponseError);
  }

  async getMetrics(workspaceSlug: string, projectId: string): Promise<IStudioMetricDefinition[]> {
    return this.get(`${studioProjectUrl(workspaceSlug, projectId)}/metrics/`)
      .then((response) => response.data as IStudioMetricDefinition[])
      .catch(throwResponseError);
  }

  async createMetric(
    workspaceSlug: string,
    projectId: string,
    payload: TStudioMetricInput
  ): Promise<IStudioMetricDefinition> {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/metrics/`, payload)
      .then((response) => response.data as IStudioMetricDefinition)
      .catch(throwResponseError);
  }

  async createMetricSnapshot(
    workspaceSlug: string,
    projectId: string,
    metricId: string,
    payload: { numeric_value: number; captured_at?: string; note?: string }
  ) {
    return this.post(`${studioProjectUrl(workspaceSlug, projectId)}/metrics/${metricId}/snapshots/`, payload)
      .then((response) => response.data)
      .catch(throwResponseError);
  }

  async getTimeline(workspaceSlug: string): Promise<IStudioTimeline> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/timeline/`)
      .then((response) => response.data as IStudioTimeline)
      .catch(throwResponseError);
  }

  async getCurrentWeeklyReview(workspaceSlug: string): Promise<IStudioWeeklyReview | null> {
    return this.get(`${studioWorkspaceUrl(workspaceSlug)}/weekly-reviews/current/`)
      .then((response) => (response.data as IStudioWeeklyReview | null) ?? null)
      .catch(throwResponseError);
  }

  async saveWeeklyReview(workspaceSlug: string, payload: TStudioWeeklyReviewInput): Promise<IStudioWeeklyReview> {
    return this.post(`${studioWorkspaceUrl(workspaceSlug)}/weekly-reviews/`, payload)
      .then((response) => response.data as IStudioWeeklyReview)
      .catch(throwResponseError);
  }
}
