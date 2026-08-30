/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";

type TStudioSectionProps = {
  title: string;
  description?: string;
  count?: number;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function StudioSection({ title, description, count, action, children, className = "" }: TStudioSectionProps) {
  return (
    <section className={`min-w-0 border-b border-subtle py-5 last:border-b-0 ${className}`}>
      <div className="mb-3 flex min-h-7 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-14 font-semibold text-primary">{title}</h2>
            {typeof count === "number" && <span className="text-11 text-placeholder">{count}</span>}
          </div>
          {description && <p className="mt-0.5 text-12 text-tertiary">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {children}
    </section>
  );
}

export function StudioEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-28 rounded-md border border-dashed border-subtle bg-surface-1 px-4 py-5">
      <EmptyStateCompact
        title={title}
        description={description}
        align="start"
        customButton={action}
        rootClassName="justify-start"
        className="max-w-none gap-2"
      />
    </div>
  );
}

export function StudioPageLoader() {
  return (
    <div className="flex w-full flex-col gap-4 p-6">
      <Loader className="flex flex-col gap-3">
        <Loader.Item height="28px" width="220px" />
        <Loader.Item height="72px" width="100%" />
        <Loader.Item height="72px" width="100%" />
        <Loader.Item height="72px" width="100%" />
      </Loader>
    </div>
  );
}

export function StudioErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-h-72 items-center px-6">
      <EmptyStateCompact
        title={t("studio.error.load_title")}
        description={t("studio.error.load_description")}
        align="start"
        rootClassName="justify-start"
        actions={[{ label: t("studio.common.retry"), variant: "secondary", onClick: onRetry }]}
      />
    </div>
  );
}
