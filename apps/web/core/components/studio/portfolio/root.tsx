/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "@plane/i18n";
import useSWR from "swr";
import { CustomSelect } from "@plane/ui";
import { StudioService } from "@/services/studio";
import type { TStudioHealthStatus, TStudioLifecycleStage, TStudioPortfolioBucket } from "@/services/studio";
import {
  StudioEmptyState,
  StudioErrorState,
  StudioHealthBadge,
  StudioPageLoader,
  studioEnumLabel,
  useStudioDateFormatter,
} from "../shared";

const studioService = new StudioService();
const ALL = "ALL" as const;

type TPortfolioProps = {
  workspaceSlug: string;
};

export function StudioPortfolioView({ workspaceSlug }: TPortfolioProps) {
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  const [bucket, setBucket] = useState<TStudioPortfolioBucket | typeof ALL>(ALL);
  const [lifecycle, setLifecycle] = useState<TStudioLifecycleStage | typeof ALL>(ALL);
  const [health, setHealth] = useState<TStudioHealthStatus | typeof ALL>(ALL);
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `STUDIO_PORTFOLIO_${workspaceSlug}` : null,
    workspaceSlug ? () => studioService.getPortfolio(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  const filteredProjects = useMemo(
    () =>
      data?.projects.filter(
        (item) =>
          (bucket === ALL || item.profile?.portfolio_bucket === bucket) &&
          (lifecycle === ALL || item.profile?.lifecycle_stage === lifecycle) &&
          (health === ALL || item.health?.status === health)
      ) ?? [],
    [bucket, data?.projects, health, lifecycle]
  );

  if (isLoading) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="flex flex-col gap-3 border-b border-subtle px-page-x py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-20 font-semibold text-primary">{t("studio.portfolio.title")}</h1>
          <p className="mt-0.5 text-12 text-tertiary">{t("studio.portfolio.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CustomSelect
            value={bucket}
            label={bucket === ALL ? t("studio.portfolio.all_buckets") : studioEnumLabel(t, "bucket", bucket)}
            onChange={(value: TStudioPortfolioBucket | typeof ALL) => setBucket(value)}
            buttonClassName="h-7 min-w-32"
            placement="bottom-end"
          >
            <CustomSelect.Option value={ALL}>{t("studio.portfolio.all_buckets")}</CustomSelect.Option>
            {data.available_filters.portfolio_buckets.map((value) => (
              <CustomSelect.Option key={value} value={value}>
                {studioEnumLabel(t, "bucket", value)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <CustomSelect
            value={lifecycle}
            label={lifecycle === ALL ? t("studio.portfolio.all_lifecycle") : studioEnumLabel(t, "lifecycle", lifecycle)}
            onChange={(value: TStudioLifecycleStage | typeof ALL) => setLifecycle(value)}
            buttonClassName="h-7 min-w-32"
            placement="bottom-end"
          >
            <CustomSelect.Option value={ALL}>{t("studio.portfolio.all_lifecycle")}</CustomSelect.Option>
            {data.available_filters.lifecycle_stages.map((value) => (
              <CustomSelect.Option key={value} value={value}>
                {studioEnumLabel(t, "lifecycle", value)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
          <CustomSelect
            value={health}
            label={health === ALL ? t("studio.portfolio.all_health") : studioEnumLabel(t, "health", health)}
            onChange={(value: TStudioHealthStatus | typeof ALL) => setHealth(value)}
            buttonClassName="h-7 min-w-28"
            placement="bottom-end"
          >
            <CustomSelect.Option value={ALL}>{t("studio.portfolio.all_health")}</CustomSelect.Option>
            {data.available_filters.health_statuses.map((value) => (
              <CustomSelect.Option key={value} value={value}>
                {studioEnumLabel(t, "health", value)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filteredProjects.length > 0 ? (
          <div className="min-w-0">
            <div className="sticky top-0 z-10 hidden grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_120px_72px_110px_140px] gap-3 border-b border-subtle bg-surface-1 px-page-x py-2 text-11 font-medium text-placeholder md:grid">
              <span>{t("studio.portfolio.column_project")}</span>
              <span>{t("studio.portfolio.column_focus")}</span>
              <span>{t("studio.portfolio.column_lifecycle")}</span>
              <span>{t("studio.portfolio.column_priority")}</span>
              <span>{t("studio.portfolio.column_health")}</span>
              <span>{t("studio.portfolio.column_last_activity")}</span>
            </div>
            {filteredProjects.map((item) => (
              <Link
                key={item.project.id}
                href={`/${workspaceSlug}/projects/${item.project.id}/overview`}
                className="group grid min-w-0 grid-cols-1 gap-2 border-b border-subtle px-page-x py-3 hover:bg-layer-transparent-hover md:grid-cols-[minmax(220px,1.4fr)_minmax(180px,1fr)_120px_72px_110px_140px] md:items-center md:gap-3"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono shrink-0 text-11 text-placeholder">{item.project.identifier}</span>
                    <span className="truncate text-13 font-medium text-primary group-hover:text-accent-primary">
                      {item.project.name}
                    </span>
                  </div>
                  <span className="mt-1 inline-block text-11 text-placeholder md:hidden">
                    {item.profile
                      ? studioEnumLabel(t, "bucket", item.profile.portfolio_bucket)
                      : t("studio.common.profile_not_configured")}
                  </span>
                </div>
                <p className="line-clamp-2 text-12 text-secondary">
                  {item.profile?.focus_statement || t("studio.common.no_active_focus")}
                </p>
                <span className="text-12 text-tertiary">
                  {item.profile
                    ? studioEnumLabel(t, "lifecycle", item.profile.lifecycle_stage)
                    : t("studio.common.not_configured")}
                </span>
                <span className="text-12 font-medium text-tertiary">{item.profile?.priority ?? "—"}</span>
                <div>
                  {item.health ? (
                    <StudioHealthBadge status={item.health.status} />
                  ) : (
                    <span className="text-11 text-placeholder">{t("studio.common.not_configured")}</span>
                  )}
                </div>
                <span className="text-11 text-placeholder">
                  {formatDate(item.health?.last_meaningful_activity_at ?? null, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <StudioEmptyState
              title={t("studio.portfolio.empty_title")}
              description={t("studio.portfolio.empty_description")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
