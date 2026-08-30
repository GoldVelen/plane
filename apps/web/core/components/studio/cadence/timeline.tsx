/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import useSWR from "swr";
import { StudioService } from "@/services/studio";
import { StudioEmptyState, StudioErrorState, StudioPageLoader, StudioSection, useStudioDateFormatter } from "../shared";

const studioService = new StudioService();

export function StudioTimelineView({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `STUDIO_TIMELINE_${workspaceSlug}` : null,
    workspaceSlug ? () => studioService.getTimeline(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-page-x pb-8">
      <div className="border-b border-subtle py-5">
        <h1 className="text-20 font-semibold text-primary">{t("studio.timeline.title")}</h1>
        <p className="mt-1 text-13 text-secondary">{t("studio.timeline.subtitle")}</p>
      </div>
      <StudioSection title={t("studio.timeline.events_title")} count={data.events.length}>
        {data.events.length > 0 ? (
          <div className="border-y border-subtle">
            {data.events.map((event) => (
              <div
                key={event.id}
                className="flex min-w-0 items-center gap-3 border-b border-subtle px-2 py-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-13 font-medium text-primary">
                    {event.entity_type} · {event.action}
                  </p>
                </div>
                <p className="shrink-0 text-11 text-placeholder">{formatDate(event.created_at)}</p>
              </div>
            ))}
          </div>
        ) : (
          <StudioEmptyState
            title={t("studio.timeline.empty_title")}
            description={t("studio.timeline.empty_description")}
          />
        )}
      </StudioSection>
    </div>
  );
}
