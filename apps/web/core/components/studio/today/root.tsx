/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { PriorityIcon, StateGroupIcon } from "@plane/propel/icons";
import { generateWorkItemLink } from "@plane/utils";
import { StudioService } from "@/services/studio";
import type { IStudioPortfolioProject } from "@/services/studio";
import {
  StudioEmptyState,
  StudioErrorState,
  StudioHealthBadge,
  StudioPageLoader,
  StudioSection,
  StudioStatusBadge,
  studioEnumLabel,
  useStudioDateFormatter,
  useStudioHealthReasonText,
  useStudioRelativeTimeFormatter,
} from "../shared";

const studioService = new StudioService();

function ProjectRow({ item, workspaceSlug }: { item: IStudioPortfolioProject; workspaceSlug: string }) {
  const { t } = useTranslation();
  const getReasonText = useStudioHealthReasonText();
  const href = `/${workspaceSlug}/projects/${item.project.id}/overview`;
  const signal = item.attention ?? item.health;

  return (
    <Link
      href={href}
      className="group flex min-w-0 items-start justify-between gap-3 border-b border-subtle px-2 py-3 last:border-b-0 hover:bg-layer-transparent-hover"
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono shrink-0 text-11 text-placeholder">{item.project.identifier}</span>
          <span className="truncate text-13 font-medium text-primary group-hover:text-accent-primary">
            {item.project.name}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-12 text-tertiary">
          {item.profile?.focus_statement || getReasonText(signal) || t("studio.common.profile_not_configured")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {item.profile && <span className="hidden text-11 text-placeholder sm:inline">{item.profile.priority}</span>}
        {signal ? (
          <StudioHealthBadge status={signal.status} />
        ) : (
          <span className="text-11 text-placeholder">{t("studio.common.not_configured")}</span>
        )}
      </div>
    </Link>
  );
}

export function StudioTodayView() {
  const { workspaceSlug: workspaceSlugParam } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  const formatRelativeTime = useStudioRelativeTimeFormatter();
  const workspaceSlug = workspaceSlugParam?.toString() ?? "";
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `STUDIO_TODAY_${workspaceSlug}` : null,
    workspaceSlug ? () => studioService.getToday(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading || !workspaceSlug) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-page-x pb-8">
      <div className="flex flex-col gap-3 border-b border-subtle py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-24 font-semibold tracking-tight text-primary">{t("studio.today.title")}</h1>
          <p className="mt-1 text-13 text-tertiary">{t("studio.today.subtitle")}</p>
        </div>
        <Button variant="secondary" size="lg" onClick={() => router.push(`/${workspaceSlug}/studio/portfolio`)}>
          {t("studio.today.open_portfolio")}
        </Button>
      </div>

      {data.focus_warning && (
        <div className="border-b border-warning-subtle bg-warning-subtle px-3 py-2 text-12 text-warning-primary">
          {data.focus_warning_code
            ? t(`studio.today.warning.${data.focus_warning_code}`, data.focus_warning_params ?? undefined)
            : data.focus_warning}
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-x-8 xl:grid-cols-2">
        <div className="contents">
          <StudioSection
            title={t("studio.today.focus_projects_title")}
            description={t("studio.today.focus_projects_description")}
            count={data.focus_projects.length}
            className="xl:col-start-1 xl:row-start-1"
          >
            {data.focus_projects.length > 0 ? (
              <div className="border-y border-subtle">
                {data.focus_projects.map((item) => (
                  <ProjectRow key={item.project.id} item={item} workspaceSlug={workspaceSlug} />
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.today.focus_projects_empty_title")}
                description={t("studio.today.focus_projects_empty_description")}
                action={
                  <Button
                    variant="secondary"
                    size="base"
                    onClick={() => router.push(`/${workspaceSlug}/studio/portfolio`)}
                  >
                    {t("studio.today.review_portfolio")}
                  </Button>
                }
              />
            )}
          </StudioSection>

          <StudioSection
            title={t("studio.today.cross_project_title")}
            description={t("studio.today.cross_project_description")}
            count={data.cross_project_work.length}
            className="order-5 xl:order-none xl:col-start-1 xl:row-span-3 xl:row-start-2"
          >
            {data.cross_project_work.length > 0 ? (
              <div className="border-y border-subtle">
                {data.cross_project_work.map((workItem) => {
                  const href = generateWorkItemLink({
                    workspaceSlug,
                    projectId: workItem.project_id,
                    issueId: workItem.id,
                    projectIdentifier: workItem.project_identifier,
                    sequenceId: workItem.sequence_id,
                  });
                  return (
                    <Link
                      key={workItem.id}
                      href={href}
                      className="group flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0 hover:bg-layer-transparent-hover"
                    >
                      <span className="font-mono w-20 shrink-0 truncate text-11 text-placeholder">
                        {workItem.project_identifier}-{workItem.sequence_id}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-13 text-primary group-hover:text-accent-primary">
                        {workItem.name}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        {workItem.state && (
                          <StateGroupIcon
                            stateGroup={workItem.state.group}
                            color={workItem.state.color}
                            className="size-4"
                          />
                        )}
                        <PriorityIcon priority={workItem.priority} size={12} />
                        <span className="hidden text-11 text-placeholder md:inline">
                          {formatRelativeTime(workItem.updated_at)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.today.cross_project_empty_title")}
                description={t("studio.today.cross_project_empty_description")}
              />
            )}
          </StudioSection>
        </div>

        <div className="contents">
          <StudioSection
            title={t("studio.today.needs_attention_title")}
            description={t("studio.today.needs_attention_description")}
            count={data.needs_attention.length}
            className="xl:col-start-2 xl:row-start-1"
          >
            {data.needs_attention.length > 0 ? (
              <div className="border-y border-subtle">
                {data.needs_attention.map((item) => (
                  <ProjectRow key={item.project.id} item={item} workspaceSlug={workspaceSlug} />
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.today.needs_attention_empty_title")}
                description={t("studio.today.needs_attention_empty_description")}
              />
            )}
          </StudioSection>

          <StudioSection
            title={t("studio.today.upcoming_releases_title")}
            description={t("studio.today.upcoming_releases_description")}
            count={data.upcoming_releases.length}
            className="xl:col-start-2 xl:row-start-2"
          >
            {data.upcoming_releases.length > 0 ? (
              <div className="border-y border-subtle">
                {data.upcoming_releases.map((release) => (
                  <Link
                    key={release.id}
                    href={`/${workspaceSlug}/projects/${release.project_id}/overview`}
                    className="flex min-w-0 items-center justify-between gap-3 border-b border-subtle px-2 py-3 last:border-b-0 hover:bg-layer-transparent-hover"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-13 font-medium text-primary">{release.name}</p>
                      <p className="mt-0.5 truncate text-11 text-placeholder">
                        {[
                          release.project?.name,
                          release.version,
                          studioEnumLabel(t, "release_channel", release.channel),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-11 text-tertiary">
                        {formatDate(release.target_at, { month: "short", day: "numeric" })}
                      </span>
                      <StudioStatusBadge status={release.status} domain="release_status" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.today.upcoming_releases_empty_title")}
                description={t("studio.today.upcoming_releases_empty_description")}
              />
            )}
          </StudioSection>

          <StudioSection
            title={t("studio.today.pending_decisions_title")}
            description={t("studio.today.pending_decisions_description")}
            count={data.pending_decisions.length}
            className="xl:col-start-2 xl:row-start-3"
          >
            {data.pending_decisions.length > 0 ? (
              <div className="border-y border-subtle">
                {data.pending_decisions.map((decision) => (
                  <Link
                    key={decision.id}
                    href={
                      decision.project_id
                        ? `/${workspaceSlug}/projects/${decision.project_id}/overview`
                        : `/${workspaceSlug}`
                    }
                    className="flex min-w-0 items-center justify-between gap-3 border-b border-subtle px-2 py-3 last:border-b-0 hover:bg-layer-transparent-hover"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-13 font-medium text-primary">{decision.title}</p>
                      <p className="mt-0.5 truncate text-11 text-placeholder">
                        {[decision.project?.name, decision.question || decision.context].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {decision.due_at && (
                        <span className="hidden text-11 text-tertiary sm:inline">
                          {formatDate(decision.due_at, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      <StudioStatusBadge status={decision.status} domain="decision_status" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <StudioEmptyState
                title={t("studio.today.pending_decisions_empty_title")}
                description={t("studio.today.pending_decisions_empty_description")}
              />
            )}
          </StudioSection>
        </div>
      </div>
    </div>
  );
}
