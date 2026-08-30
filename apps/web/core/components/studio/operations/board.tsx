/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { IconButton } from "@plane/propel/icon-button";
import { EditIcon, PlusIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { AlertModalCore, CustomSelect } from "@plane/ui";
import { generateWorkItemLink } from "@plane/utils";
import { StudioService } from "@/services/studio";
import type {
  IStudioContentItem,
  IStudioExperiment,
  IStudioFeedback,
  IStudioLinkedIssue,
  IStudioRoutine,
  TStudioContentInput,
  TStudioExperimentInput,
  TStudioFeedbackInput,
  TStudioRoutineInput,
} from "@/services/studio";
import {
  StudioEmptyState,
  StudioSection,
  StudioStatusBadge,
  getStudioErrorMessage,
  studioEnumLabel,
  useStudioDateFormatter,
} from "../shared";
import type { TStudioEnumDomain } from "../shared";
import { ContentModal, ExperimentModal, FeedbackModal, RoutineModal } from "./forms";

const studioService = new StudioService();

type TViewKey = "feedback" | "content" | "routines" | "experiments";
type TEditState<T> = T | null | undefined;
type TDeleteTarget = { kind: TViewKey; id: string; name: string; projectId: string };

const VIEWS: TViewKey[] = ["feedback", "content", "routines", "experiments"];

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="secondary" size="base" prependIcon={<PlusIcon className="size-3.5" />} onClick={onClick}>
      {label}
    </Button>
  );
}

function WorkItemLink({ workspaceSlug, issue }: { workspaceSlug: string; issue: IStudioLinkedIssue | null }) {
  const { t } = useTranslation();
  if (!issue) return null;
  const href = generateWorkItemLink({
    workspaceSlug,
    projectId: issue.project_id,
    issueId: issue.id,
    projectIdentifier: issue.project_identifier,
    sequenceId: issue.sequence_id,
  });
  return (
    <Link href={href} className="text-11 text-accent-primary hover:underline">
      {t("studio.operations.linked_work_item", {
        identifier: `${issue.project_identifier}-${issue.sequence_id}`,
      })}
    </Link>
  );
}

export function StudioOperationsBoard({
  workspaceSlug,
  projectId,
  projects,
  canWrite,
  writableProjectIds,
  feedback,
  contentItems,
  routines,
  experiments,
  onMutate,
}: {
  workspaceSlug: string;
  projectId?: string;
  projects: Array<{ id: string; name: string; identifier: string }>;
  canWrite: boolean;
  writableProjectIds: string[];
  feedback: IStudioFeedback[];
  contentItems: IStudioContentItem[];
  routines: IStudioRoutine[];
  experiments: IStudioExperiment[];
  onMutate: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  const [view, setView] = useState<TViewKey>("feedback");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId ?? writableProjectIds[0] ?? projects[0]?.id ?? ""
  );
  const [feedbackModal, setFeedbackModal] = useState<TEditState<IStudioFeedback>>(undefined);
  const [contentModal, setContentModal] = useState<TEditState<IStudioContentItem>>(undefined);
  const [routineModal, setRoutineModal] = useState<TEditState<IStudioRoutine>>(undefined);
  const [experimentModal, setExperimentModal] = useState<TEditState<IStudioExperiment>>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<TDeleteTarget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const targetProjectId = projectId ?? selectedProjectId;
  const canWriteSelected = Boolean(targetProjectId && writableProjectIds.includes(targetProjectId));

  const filterByProject = <T extends { project_id: string }>(items: T[]) =>
    projectId ? items.filter((item) => item.project_id === projectId) : items;

  const convertRecord = async (kind: TViewKey, id: string, itemProjectId: string) => {
    setConvertingId(id);
    try {
      if (kind === "feedback") await studioService.convertFeedback(workspaceSlug, itemProjectId, id);
      if (kind === "content") await studioService.convertContentItem(workspaceSlug, itemProjectId, id);
      if (kind === "routines") await studioService.convertRoutine(workspaceSlug, itemProjectId, id);
      if (kind === "experiments") await studioService.convertExperiment(workspaceSlug, itemProjectId, id);
      await onMutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.operations.convert_success_title"),
        message: t("studio.operations.convert_success_message"),
      });
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.operations.convert_failed_title"),
        message: getStudioErrorMessage(error, t("studio.error.request_failed"), t),
      });
    } finally {
      setConvertingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.kind === "feedback")
        await studioService.deleteFeedback(workspaceSlug, deleteTarget.projectId, deleteTarget.id);
      if (deleteTarget.kind === "content")
        await studioService.deleteContentItem(workspaceSlug, deleteTarget.projectId, deleteTarget.id);
      if (deleteTarget.kind === "routines")
        await studioService.deleteRoutine(workspaceSlug, deleteTarget.projectId, deleteTarget.id);
      if (deleteTarget.kind === "experiments")
        await studioService.deleteExperiment(workspaceSlug, deleteTarget.projectId, deleteTarget.id);
      await onMutate();
      setDeleteTarget(null);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.overview.delete_failed_title"),
        message: getStudioErrorMessage(error, t("studio.error.request_failed"), t),
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const saveFeedback = async (payload: TStudioFeedbackInput) => {
    if (feedbackModal)
      await studioService.updateFeedback(workspaceSlug, feedbackModal.project_id, feedbackModal.id, payload);
    else await studioService.createFeedback(workspaceSlug, targetProjectId, payload);
    await onMutate();
  };
  const saveContent = async (payload: TStudioContentInput) => {
    if (contentModal)
      await studioService.updateContentItem(workspaceSlug, contentModal.project_id, contentModal.id, payload);
    else await studioService.createContentItem(workspaceSlug, targetProjectId, payload);
    await onMutate();
  };
  const saveRoutine = async (payload: TStudioRoutineInput) => {
    if (routineModal)
      await studioService.updateRoutine(workspaceSlug, routineModal.project_id, routineModal.id, payload);
    else await studioService.createRoutine(workspaceSlug, targetProjectId, payload);
    await onMutate();
  };
  const saveExperiment = async (payload: TStudioExperimentInput) => {
    if (experimentModal)
      await studioService.updateExperiment(workspaceSlug, experimentModal.project_id, experimentModal.id, payload);
    else await studioService.createExperiment(workspaceSlug, targetProjectId, payload);
    await onMutate();
  };

  const renderRows = (
    items: Array<{
      id: string;
      project_id: string;
      title: string;
      status?: string;
      domain?: TStudioEnumDomain;
      meta: string;
      linked_issue: IStudioLinkedIssue | null;
    }>,
    kind: TViewKey,
    onEdit: (id: string) => void
  ) =>
    items.length > 0 ? (
      <div className="border-y border-subtle">
        {items.map((item) => (
          <div
            key={item.id}
            className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-13 font-medium text-primary">{item.title}</p>
                {item.status && item.domain && <StudioStatusBadge status={item.status} domain={item.domain} />}
              </div>
              <p className="mt-1 truncate text-11 text-placeholder">{item.meta}</p>
              <WorkItemLink workspaceSlug={workspaceSlug} issue={item.linked_issue} />
            </div>
            {canWrite && writableProjectIds.includes(item.project_id) && (
              <div className="flex shrink-0 items-center gap-0.5 sm:opacity-0 sm:group-hover:opacity-100">
                {!item.linked_issue && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={convertingId === item.id}
                    onClick={() => void convertRecord(kind, item.id, item.project_id)}
                  >
                    {t("studio.common.convert")}
                  </Button>
                )}
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={EditIcon}
                  aria-label={t("studio.common.edit")}
                  onClick={() => onEdit(item.id)}
                />
                <IconButton
                  variant="ghost"
                  size="sm"
                  icon={TrashIcon}
                  aria-label={t("studio.common.delete")}
                  onClick={() => setDeleteTarget({ kind, id: item.id, name: item.title, projectId: item.project_id })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    ) : (
      <StudioEmptyState
        title={t(`studio.operations.${kind}_empty_title`)}
        description={t(`studio.operations.${kind}_empty_description`)}
      />
    );

  const visibleFeedback = filterByProject(feedback);
  const visibleContent = filterByProject(contentItems);
  const visibleRoutines = filterByProject(routines);
  const visibleExperiments = filterByProject(experiments);
  const projectName = (id: string) => projects.find((project) => project.id === id)?.identifier ?? "";

  return (
    <>
      {feedbackModal !== undefined && (
        <FeedbackModal feedback={feedbackModal} onClose={() => setFeedbackModal(undefined)} onSave={saveFeedback} />
      )}
      {contentModal !== undefined && (
        <ContentModal item={contentModal} onClose={() => setContentModal(undefined)} onSave={saveContent} />
      )}
      {routineModal !== undefined && (
        <RoutineModal routine={routineModal} onClose={() => setRoutineModal(undefined)} onSave={saveRoutine} />
      )}
      {experimentModal !== undefined && (
        <ExperimentModal
          experiment={experimentModal}
          onClose={() => setExperimentModal(undefined)}
          onSave={saveExperiment}
        />
      )}
      <AlertModalCore
        isOpen={deleteTarget !== null}
        isSubmitting={isDeleting}
        title={t("studio.overview.delete_title", {
          kind: deleteTarget
            ? t(
                `studio.common.term_${deleteTarget.kind === "routines" ? "routine" : deleteTarget.kind === "content" ? "content" : deleteTarget.kind === "experiments" ? "experiment" : "feedback"}`
              )
            : t("studio.common.record"),
        })}
        content={deleteTarget ? t("studio.overview.delete_confirm", { name: deleteTarget.name }) : ""}
        primaryButtonText={{ loading: t("studio.common.deleting"), default: t("studio.common.delete") }}
        secondaryButtonText={t("studio.common.cancel")}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void confirmDelete()}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-subtle py-3">
        {VIEWS.map((key) => (
          <Button key={key} variant={view === key ? "primary" : "secondary"} size="sm" onClick={() => setView(key)}>
            {t(`studio.operations.views.${key}`)}
          </Button>
        ))}
        {!projectId && projects.length > 0 && (
          <div className="ml-auto min-w-48">
            <CustomSelect
              value={selectedProjectId}
              label={
                projects.find((project) => project.id === selectedProjectId)?.name ??
                t("studio.operations.choose_project")
              }
              onChange={setSelectedProjectId}
              input
              buttonClassName="h-8 w-full"
            >
              {projects.map((project) => (
                <CustomSelect.Option key={project.id} value={project.id}>
                  {project.identifier} · {project.name}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          </div>
        )}
      </div>

      {view === "feedback" && (
        <StudioSection
          title={t("studio.operations.views.feedback")}
          description={t("studio.operations.feedback_description")}
          count={visibleFeedback.length}
          action={
            canWriteSelected ? (
              <AddButton label={t("studio.operations.add_feedback")} onClick={() => setFeedbackModal(null)} />
            ) : undefined
          }
        >
          {renderRows(
            visibleFeedback.map((item) => ({
              id: item.id,
              project_id: item.project_id,
              title: item.title,
              status: item.status,
              domain: "feedback_status" as const,
              meta: [projectName(item.project_id), studioEnumLabel(t, "feedback_source", item.source), item.priority]
                .filter(Boolean)
                .join(" · "),
              linked_issue: item.linked_issue,
            })),
            "feedback",
            (id) => setFeedbackModal(visibleFeedback.find((item) => item.id === id) ?? null)
          )}
        </StudioSection>
      )}

      {view === "content" && (
        <StudioSection
          title={t("studio.operations.views.content")}
          description={t("studio.operations.content_description")}
          count={visibleContent.length}
          action={
            canWriteSelected ? (
              <AddButton label={t("studio.operations.add_content")} onClick={() => setContentModal(null)} />
            ) : undefined
          }
        >
          {renderRows(
            visibleContent.map((item) => ({
              id: item.id,
              project_id: item.project_id,
              title: item.title,
              status: item.status,
              domain: "content_status" as const,
              meta: [
                projectName(item.project_id),
                studioEnumLabel(t, "content_channel", item.channel),
                formatDate(item.planned_at),
              ]
                .filter(Boolean)
                .join(" · "),
              linked_issue: item.linked_issue,
            })),
            "content",
            (id) => setContentModal(visibleContent.find((item) => item.id === id) ?? null)
          )}
        </StudioSection>
      )}

      {view === "routines" && (
        <StudioSection
          title={t("studio.operations.views.routines")}
          description={t("studio.operations.routines_description")}
          count={visibleRoutines.length}
          action={
            canWriteSelected ? (
              <AddButton label={t("studio.operations.add_routine")} onClick={() => setRoutineModal(null)} />
            ) : undefined
          }
        >
          {renderRows(
            visibleRoutines.map((item) => ({
              id: item.id,
              project_id: item.project_id,
              title: item.name,
              meta: [
                projectName(item.project_id),
                studioEnumLabel(t, "routine_cadence", item.cadence),
                item.is_active ? t("studio.operations.routine_active") : t("studio.operations.routine_paused"),
              ]
                .filter(Boolean)
                .join(" · "),
              linked_issue: item.linked_issue,
            })),
            "routines",
            (id) => setRoutineModal(visibleRoutines.find((item) => item.id === id) ?? null)
          )}
        </StudioSection>
      )}

      {view === "experiments" && (
        <StudioSection
          title={t("studio.operations.views.experiments")}
          description={t("studio.operations.experiments_description")}
          count={visibleExperiments.length}
          action={
            canWriteSelected ? (
              <AddButton label={t("studio.operations.add_experiment")} onClick={() => setExperimentModal(null)} />
            ) : undefined
          }
        >
          {renderRows(
            visibleExperiments.map((item) => ({
              id: item.id,
              project_id: item.project_id,
              title: item.title,
              status: item.status,
              domain: "experiment_status" as const,
              meta: [projectName(item.project_id), item.hypothesis].filter(Boolean).join(" · "),
              linked_issue: item.linked_issue,
            })),
            "experiments",
            (id) => setExperimentModal(visibleExperiments.find((item) => item.id === id) ?? null)
          )}
        </StudioSection>
      )}
    </>
  );
}
