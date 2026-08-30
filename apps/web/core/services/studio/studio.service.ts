/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { isAxiosError } from "axios";
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  IStudioDecision,
  IStudioPortfolio,
  IStudioProjectOverview,
  IStudioProjectProfile,
  IStudioRelease,
  IStudioRisk,
  IStudioToday,
  TStudioDecisionInput,
  TStudioProjectProfileInput,
  TStudioMilestoneInput,
  TStudioReleaseInput,
  TStudioRiskInput,
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
}
