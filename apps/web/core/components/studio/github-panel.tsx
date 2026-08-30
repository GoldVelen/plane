/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import type { IStudioGithubStatus } from "@/services/studio";
import { StudioEmptyState, StudioSection, StudioStatusBadge, useStudioDateFormatter } from "./shared";

export function StudioGithubPanel({ github }: { github: IStudioGithubStatus | undefined }) {
  const { t } = useTranslation();
  const formatDate = useStudioDateFormatter();
  if (!github) return null;
  const isPending = github.status === "PENDING_EXTERNAL_CREDENTIAL" || github.connected === false;

  return (
    <StudioSection title={t("studio.github.title")} description={t("studio.github.description")}>
      <p className="mb-3 text-12 text-secondary">
        {t("studio.github.repository")}: {github.repository || t("studio.common.not_set")}
      </p>
      <p className="mb-3 text-12 text-secondary">
        {isPending ? t("studio.github.pending") : t(`studio.github.status.${github.status}`)}
      </p>
      {github.projections.length > 0 ? (
        <div className="border-y border-subtle">
          {github.projections.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 items-center gap-2 border-b border-subtle px-2 py-2 last:border-b-0"
            >
              <StudioStatusBadge status={item.kind} domain="github_kind" />
              <p className="min-w-0 truncate text-13 text-primary">{item.title || item.external_id}</p>
              <p className="ml-auto shrink-0 text-11 text-placeholder">{formatDate(item.captured_at)}</p>
            </div>
          ))}
        </div>
      ) : (
        <StudioEmptyState title={t("studio.github.empty_title")} description={t("studio.github.empty_description")} />
      )}
    </StudioSection>
  );
}
