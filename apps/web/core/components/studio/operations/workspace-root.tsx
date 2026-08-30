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

export function StudioWorkspaceOperationsView({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `STUDIO_OPERATIONS_${workspaceSlug}` : null,
    workspaceSlug ? () => studioService.getOperations(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) return <StudioPageLoader />;
  if (error || !data) return <StudioErrorState onRetry={() => void mutate()} />;

  return (
    <div className="mx-auto w-full max-w-[1200px] px-page-x pb-8">
      <div className="border-b border-subtle py-5">
        <h1 className="text-20 font-semibold text-primary">{t("studio.operations.title")}</h1>
        <p className="mt-1 text-13 text-secondary">{t("studio.operations.subtitle")}</p>
      </div>
      <StudioOperationsBoard
        workspaceSlug={workspaceSlug}
        projects={data.projects}
        canWrite={data.permissions.writable_project_ids.length > 0}
        writableProjectIds={data.permissions.writable_project_ids}
        feedback={data.feedback}
        contentItems={data.content_items}
        routines={data.routines}
        experiments={data.experiments}
        onMutate={() => mutate()}
      />
    </div>
  );
}
