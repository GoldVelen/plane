/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import useSWR from "swr";
import { StudioService } from "@/services/studio";
import { StudioErrorState, StudioPageLoader } from "../shared";
import { StudioOperationsBoard } from "./board";

const studioService = new StudioService();

export function StudioProjectOperationsView({
  workspaceSlug,
  projectId,
}: {
  workspaceSlug: string;
  projectId: string;
}) {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && projectId ? `STUDIO_PROJECT_OVERVIEW_${workspaceSlug}_${projectId}` : null,
    workspaceSlug && projectId ? () => studioService.getProjectOverview(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-page-x pb-8">
      <div className="border-b border-subtle py-5">
        <h1 className="text-20 font-semibold text-primary">{t("studio.operations.title")}</h1>
        <p className="mt-1 text-13 text-secondary">{t("studio.operations.project_subtitle")}</p>
      </div>
      <StudioOperationsBoard
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        projects={[{ id: data.project.id, name: data.project.name, identifier: data.project.identifier }]}
        canWrite={data.permissions.can_write_project}
        writableProjectIds={data.permissions.can_write_project ? [projectId] : []}
        feedback={data.feedback ?? []}
        contentItems={data.content_items ?? []}
        routines={data.routines ?? []}
        experiments={data.experiments ?? []}
        onMutate={() => mutate()}
      />
    </div>
  );
}
