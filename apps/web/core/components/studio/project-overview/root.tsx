/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import useSWR from "swr";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { EditIcon, PlusIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore } from "@plane/ui";
import { StudioService } from "@/services/studio";
import { useUser } from "@/hooks/store/user";
import type {
  IStudioDecision,
  IStudioMilestone,
  IStudioRelease,
  IStudioRisk,
  TStudioDecisionInput,
  TStudioMilestoneInput,
  TStudioProjectProfileInput,
  TStudioReleaseInput,
  TStudioRiskInput,
} from "@/services/studio";
import {
  StudioEmptyState,
  StudioErrorState,
  StudioHealthBadge,
  StudioPageLoader,
  StudioSection,
  StudioStatusBadge,
  getStudioErrorMessage,
  studioEnumLabel,
  useStudioDateFormatter,
  useStudioHealthReasonText,
} from "../shared";
import { DecisionModal, MilestoneModal, ProjectProfileModal, ReleaseModal, RiskModal } from "./forms";

const studioService = new StudioService();

type TEditState<T> = T | null | undefined;
type TDeleteTarget =
  | { kind: "release"; id: string; name: string }
  | { kind: "decision"; id: string; name: string }
  | { kind: "risk"; id: string; name: string }
  | { kind: "milestone"; id: string; name: string };

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" size="base" prependIcon={<PlusIcon className="size-3.5" />} onClick={onClick}>
      {label}
    </Button>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
      <IconButton variant="ghost" size="sm" icon={EditIcon} aria-label={t("studio.common.edit")} onClick={onEdit} />
      <IconButton
        variant="ghost"
        size="sm"
        icon={TrashIcon}
        aria-label={t("studio.common.delete")}
        onClick={onDelete}
      />
    </div>
  );
}

export function StudioProjectOverviewView({ workspaceSlug, projectId }: { workspaceSlug: string; projectId: string }) {
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  const getReasonText = useStudioHealthReasonText();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [releaseModal, setReleaseModal] = useState<TEditState<IStudioRelease>>(undefined);
  const [decisionModal, setDecisionModal] = useState<TEditState<IStudioDecision>>(undefined);
  const [riskModal, setRiskModal] = useState<TEditState<IStudioRisk>>(undefined);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const { data: currentUser } = useUser();
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && projectId ? `STUDIO_PROJECT_OVERVIEW_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => studioService.getProjectOverview(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  const canWrite = data.permissions.can_write_project;

  const saveProfile = async (payload: TStudioProjectProfileInput) => {
    await studioService.updateProjectProfile(workspaceSlug, projectId, payload);
    await mutate();
  };

  const saveRelease = async (payload: TStudioReleaseInput) => {
    if (releaseModal) await studioService.updateRelease(workspaceSlug, projectId, releaseModal.id, payload);
    else await studioService.createRelease(workspaceSlug, projectId, payload);
    await mutate();
  };

  const saveDecision = async (payload: TStudioDecisionInput) => {
    if (decisionModal) await studioService.updateDecision(workspaceSlug, decisionModal.id, payload);
    else await studioService.createDecision(workspaceSlug, payload);
    await mutate();
  };

  const saveRisk = async (payload: TStudioRiskInput) => {
    if (riskModal) await studioService.updateRisk(workspaceSlug, projectId, riskModal.id, payload);
    else await studioService.createRisk(workspaceSlug, projectId, payload);
    await mutate();
  };

  const saveMilestone = async (payload: TStudioMilestoneInput) => {
    await studioService.createMilestone(workspaceSlug, projectId, payload);
    await mutate();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const kindLabel = t(`studio.common.term_${deleteTarget.kind}`);
    setIsDeleting(true);
    try {
      if (deleteTarget.kind === "release") await studioService.deleteRelease(workspaceSlug, projectId, deleteTarget.id);
      if (deleteTarget.kind === "decision") await studioService.deleteDecision(workspaceSlug, deleteTarget.id);
      if (deleteTarget.kind === "risk") await studioService.deleteRisk(workspaceSlug, projectId, deleteTarget.id);
      if (deleteTarget.kind === "milestone")
        await studioService.deleteMilestone(workspaceSlug, projectId, deleteTarget.id);
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.overview.delete_success_title", { kind: kindLabel }),
        message: t("studio.overview.delete_success_message"),
      });
      setDeleteTarget(null);
    } catch (deleteError) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.overview.delete_failed_title"),
        message: getStudioErrorMessage(deleteError, t("studio.error.request_failed"), t),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {isProfileModalOpen && (
        <ProjectProfileModal profile={data.profile} onClose={() => setIsProfileModalOpen(false)} onSave={saveProfile} />
      )}
      {releaseModal !== undefined && (
        <ReleaseModal release={releaseModal} onClose={() => setReleaseModal(undefined)} onSave={saveRelease} />
      )}
      {decisionModal !== undefined && (
        <DecisionModal
          decision={decisionModal}
          projectId={projectId}
          onClose={() => setDecisionModal(undefined)}
          onSave={saveDecision}
        />
      )}
      {riskModal !== undefined && (
        <RiskModal risk={riskModal} onClose={() => setRiskModal(undefined)} onSave={saveRisk} />
      )}
      {isMilestoneModalOpen && <MilestoneModal onClose={() => setIsMilestoneModalOpen(false)} onSave={saveMilestone} />}
      <AlertModalCore
        isOpen={deleteTarget !== null}
        isSubmitting={isDeleting}
        title={t("studio.overview.delete_title", {
          kind: deleteTarget ? t(`studio.common.term_${deleteTarget.kind}`) : t("studio.common.record"),
        })}
        content={deleteTarget ? t("studio.overview.delete_confirm", { name: deleteTarget.name }) : ""}
        primaryButtonText={{ loading: t("studio.common.deleting"), default: t("studio.common.delete") }}
        secondaryButtonText={t("studio.common.cancel")}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void confirmDelete()}
      />

      <div className="mx-auto w-full max-w-[1200px] px-page-x pb-8">
        <div className="flex flex-col gap-4 border-b border-subtle py-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <span className="font-mono shrink-0 text-12 text-placeholder">{data.project.identifier}</span>
              <h1 className="truncate text-20 font-semibold text-primary">{data.project.name}</h1>
              {data.health ? (
                <StudioHealthBadge status={data.health.status} />
              ) : (
                <span className="text-11 text-placeholder">{t("studio.common.not_configured")}</span>
              )}
            </div>
            <p className="mt-2 max-w-3xl text-13 text-secondary">
              {data.health ? getReasonText(data.health) || data.health.reason : t("studio.overview.health_fallback")}
            </p>
            {data.health?.is_manual && (
              <p className="mt-1 text-11 text-placeholder">
                {t("studio.overview.manual_override_note", {
                  status: studioEnumLabel(t, "health", data.health.computed_status),
                })}
              </p>
            )}
          </div>
          {canWrite && (
            <Button variant="secondary" size="lg" onClick={() => setIsProfileModalOpen(true)}>
              {data.profile ? t("studio.overview.edit_profile") : t("studio.overview.configure_profile")}
            </Button>
          )}
        </div>

        {!data.profile && (
          <div className="pt-5">
            <StudioEmptyState
              title={t("studio.overview.profile_empty_title")}
              description={t("studio.overview.profile_empty_description")}
              action={
                canWrite ? (
                  <Button variant="secondary" size="base" onClick={() => setIsProfileModalOpen(true)}>
                    {t("studio.overview.configure_profile")}
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}

        {data.profile && (
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-subtle py-5 sm:grid-cols-4 lg:grid-cols-6">
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_portfolio")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">
                {studioEnumLabel(t, "bucket", data.profile.portfolio_bucket)}
              </p>
            </div>
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_lifecycle")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">
                {studioEnumLabel(t, "lifecycle", data.profile.lifecycle_stage)}
              </p>
            </div>
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_priority")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">{data.profile.priority}</p>
            </div>
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_cadence")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">
                {t("studio.overview.cadence_days", { count: data.profile.expected_update_interval_days })}
              </p>
            </div>
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_expected_to_advance")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">
                {data.health?.expected_to_advance ? t("studio.common.yes") : t("studio.common.no")}
              </p>
            </div>
            <div>
              <p className="text-11 text-placeholder">{t("studio.overview.field_last_activity")}</p>
              <p className="mt-1 text-12 font-medium text-secondary">
                {formatDate(data.health?.last_meaningful_activity_at ?? null, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-4 lg:col-span-6">
              <p className="text-11 text-placeholder">{t("studio.overview.field_current_focus")}</p>
              <p className="mt-1 text-13 text-secondary">
                {data.profile.focus_statement || t("studio.common.no_active_focus")}
              </p>
            </div>
          </div>
        )}

        <StudioSection
          title={t("studio.overview.plane_execution_title")}
          description={t("studio.overview.plane_execution_description")}
        >
          <div className="grid grid-cols-2 divide-x divide-y divide-subtle border-y border-subtle sm:grid-cols-4 sm:divide-y-0">
            <div className="p-3">
              <p className="text-11 text-placeholder">{t("studio.overview.work_items")}</p>
              <p className="mt-1 text-18 font-semibold text-primary">{data.work_summary.work_items.total}</p>
              <p className="text-11 text-tertiary">
                {t("studio.overview.work_items_started", { count: data.work_summary.work_items.started })}
              </p>
            </div>
            <div className="p-3">
              <p className="text-11 text-placeholder">{t("studio.overview.completed")}</p>
              <p className="mt-1 text-18 font-semibold text-primary">{data.work_summary.work_items.completed}</p>
              <p className="text-11 text-tertiary">{t("studio.overview.completed_native")}</p>
            </div>
            <div className="p-3">
              <p className="text-11 text-placeholder">{t("studio.overview.cycles")}</p>
              <p className="mt-1 text-18 font-semibold text-primary">{data.work_summary.cycles.total}</p>
              <p className="text-11 text-tertiary">
                {t("studio.overview.cycles_active", { count: data.work_summary.cycles.active })}
              </p>
            </div>
            <div className="p-3">
              <p className="text-11 text-placeholder">{t("studio.overview.modules")}</p>
              <p className="mt-1 text-18 font-semibold text-primary">{data.work_summary.modules.total}</p>
              <p className="text-11 text-tertiary">
                {t("studio.overview.modules_active", { count: data.work_summary.modules.active })}
              </p>
            </div>
          </div>
        </StudioSection>

        <div className="grid min-w-0 grid-cols-1 gap-x-8 xl:grid-cols-2">
          <StudioSection
            title={t("studio.overview.releases_title")}
            description={t("studio.overview.releases_description")}
            count={data.releases.length}
            action={
              canWrite ? (
                <AddButton label={t("studio.overview.add_release")} onClick={() => setReleaseModal(null)} />
              ) : undefined
            }
          >
            {data.releases.length > 0 ? (
              <div className="border-y border-subtle">
                {data.releases.map((release) => (
                  <div
                    key={release.id}
                    className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-13 font-medium text-primary">{release.name}</p>
                        <StudioStatusBadge status={release.status} domain="release_status" />
                      </div>
                      <p className="mt-1 truncate text-11 text-placeholder">
                        {[
                          release.version,
                          studioEnumLabel(t, "release_channel", release.channel),
                          formatDate(release.target_at),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {release.checklist_items && release.checklist_items.length > 0 && (
                        <p className="mt-1 text-11 text-placeholder">
                          {t("studio.overview.checklist_title")}{" "}
                          {release.checklist_items.filter((item) => item.is_done).length}/
                          {release.checklist_items.length}
                        </p>
                      )}
                    </div>
                    {canWrite && (
                      <RowActions
                        onEdit={() => setReleaseModal(release)}
                        onDelete={() => setDeleteTarget({ kind: "release", id: release.id, name: release.name })}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.overview.releases_empty_title")}
                description={t("studio.overview.releases_empty_description")}
                action={
                  canWrite ? (
                    <AddButton label={t("studio.overview.add_release")} onClick={() => setReleaseModal(null)} />
                  ) : undefined
                }
              />
            )}
          </StudioSection>

          <StudioSection
            title={t("studio.overview.risks_title")}
            description={t("studio.overview.risks_description")}
            count={data.risks.length}
            action={
              canWrite ? (
                <AddButton label={t("studio.overview.add_risk")} onClick={() => setRiskModal(null)} />
              ) : undefined
            }
          >
            {data.risks.length > 0 ? (
              <div className="border-y border-subtle">
                {data.risks.map((risk) => (
                  <div
                    key={risk.id}
                    className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="truncate text-13 font-medium text-primary">{risk.title}</p>
                        <StudioStatusBadge status={risk.status} domain="risk_status" />
                      </div>
                      <p className="mt-1 truncate text-11 text-placeholder">
                        {[
                          studioEnumLabel(t, "risk_type", risk.type),
                          t("studio.overview.risk_meta", { score: risk.score }),
                          ...(risk.is_blocker ? [t("studio.overview.risk_blocker_suffix")] : []),
                        ].join(" · ")}
                      </p>
                    </div>
                    {canWrite && (
                      <RowActions
                        onEdit={() => setRiskModal(risk)}
                        onDelete={() => setDeleteTarget({ kind: "risk", id: risk.id, name: risk.title })}
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.overview.risks_empty_title")}
                description={t("studio.overview.risks_empty_description")}
                action={
                  canWrite ? (
                    <AddButton label={t("studio.overview.add_risk")} onClick={() => setRiskModal(null)} />
                  ) : undefined
                }
              />
            )}
          </StudioSection>
        </div>

        <StudioSection
          title={t("studio.overview.decisions_title")}
          description={t("studio.overview.decisions_description")}
          count={data.decisions.length}
          action={
            canWrite ? (
              <AddButton label={t("studio.overview.add_decision")} onClick={() => setDecisionModal(null)} />
            ) : undefined
          }
        >
          {data.decisions.length > 0 ? (
            <div className="border-y border-subtle">
              {data.decisions.map((decision) => (
                <div
                  key={decision.id}
                  className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-13 font-medium text-primary">{decision.title}</p>
                      <StudioStatusBadge status={decision.status} domain="decision_status" />
                    </div>
                    <p className="mt-1 truncate text-12 text-tertiary">{decision.question || decision.context}</p>
                    {decision.due_at && (
                      <p className="mt-1 text-11 text-placeholder">
                        {t("studio.overview.due_date", { date: formatDate(decision.due_at) })}
                      </p>
                    )}
                    {decision.acknowledgements && decision.acknowledgements.length > 0 && (
                      <p className="mt-1 text-11 text-placeholder">
                        {studioEnumLabel(t, "decision_mode", decision.decision_mode)} ·{" "}
                        {decision.acknowledgements.filter((ack) => ack.state === "APPROVED").length}/
                        {decision.acknowledgements.length}
                      </p>
                    )}
                  </div>
                  {canWrite && (
                    <div className="flex items-center gap-1">
                      {decision.acknowledgements?.some(
                        (ack) => ack.user_id === currentUser?.id && ack.state === "PENDING"
                      ) && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              void studioService
                                .acknowledgeDecision(workspaceSlug, decision.id, { state: "APPROVED" })
                                .then(() => mutate())
                            }
                          >
                            {t("studio.overview.acknowledge")}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              void studioService
                                .acknowledgeDecision(workspaceSlug, decision.id, { state: "OBJECTED" })
                                .then(() => mutate())
                            }
                          >
                            {t("studio.overview.object")}
                          </Button>
                        </>
                      )}
                      <RowActions
                        onEdit={() => setDecisionModal(decision)}
                        onDelete={() => setDeleteTarget({ kind: "decision", id: decision.id, name: decision.title })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <StudioEmptyState
              title={t("studio.overview.decisions_empty_title")}
              description={t("studio.overview.decisions_empty_description")}
              action={
                canWrite ? (
                  <AddButton label={t("studio.overview.add_decision")} onClick={() => setDecisionModal(null)} />
                ) : undefined
              }
            />
          )}
        </StudioSection>

        <StudioSection
          title={t("studio.overview.milestones_title")}
          description={t("studio.overview.milestones_description")}
          count={(data.milestones ?? []).length}
          action={
            canWrite ? (
              <AddButton label={t("studio.overview.add_milestone")} onClick={() => setIsMilestoneModalOpen(true)} />
            ) : undefined
          }
        >
          {(data.milestones ?? []).length > 0 ? (
            <div className="border-y border-subtle">
              {(data.milestones ?? []).map((milestone: IStudioMilestone) => (
                <div
                  key={milestone.id}
                  className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-13 font-medium text-primary">{milestone.title}</p>
                      <StudioStatusBadge status={milestone.status} domain="milestone_status" />
                    </div>
                    <p className="mt-1 text-11 text-placeholder">
                      {[studioEnumLabel(t, "milestone_type", milestone.type), formatDate(milestone.target_at)]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {canWrite && (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      icon={TrashIcon}
                      aria-label={t("studio.common.delete")}
                      onClick={() => setDeleteTarget({ kind: "milestone", id: milestone.id, name: milestone.title })}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <StudioEmptyState
              title={t("studio.overview.milestones_empty_title")}
              description={t("studio.overview.milestones_empty_description")}
              action={
                canWrite ? (
                  <AddButton label={t("studio.overview.add_milestone")} onClick={() => setIsMilestoneModalOpen(true)} />
                ) : undefined
              }
            />
          )}
        </StudioSection>

        <StudioSection
          title={t("studio.overview.events_title")}
          description={t("studio.overview.events_description")}
          count={(data.events ?? []).length}
        >
          {(data.events ?? []).length > 0 ? (
            <div className="border-y border-subtle">
              {(data.events ?? []).map((event) => (
                <div
                  key={event.id}
                  className="flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
                >
                  <p className="truncate text-13 text-primary">
                    {event.entity_type} · {event.action}
                  </p>
                  <p className="ml-auto shrink-0 text-11 text-placeholder">{formatDate(event.created_at)}</p>
                </div>
              ))}
            </div>
          ) : (
            <StudioEmptyState
              title={t("studio.overview.events_empty_title")}
              description={t("studio.overview.events_empty_description")}
            />
          )}
        </StudioSection>
      </div>
    </>
  );
}
