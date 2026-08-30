/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { StudioService } from "@/services/studio";
import type { IStudioMetricDefinition } from "@/services/studio";
import { StudioEmptyState, StudioSection, getStudioErrorMessage } from "../shared";

const studioService = new StudioService();

function MetricLine({ values }: { values: number[] }) {
  const width = 180;
  const height = 48;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="text-accent-primary" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
    </svg>
  );
}

export function StudioMetricsSection({
  workspaceSlug,
  projectId,
  metrics,
  canWrite,
  onMutate,
}: {
  workspaceSlug: string;
  projectId: string;
  metrics: IStudioMetricDefinition[];
  canWrite: boolean;
  onMutate: () => Promise<unknown>;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [snapshotValue, setSnapshotValue] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMetric = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await studioService.createMetric(workspaceSlug, projectId, {
        name: name.trim(),
        key: key.trim() || name.trim().toLowerCase().replace(/\s+/g, "_"),
        unit: "COUNT",
        source_type: "MANUAL",
      });
      setName("");
      setKey("");
      await onMutate();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.forms.update_failed_title"),
        message: getStudioErrorMessage(error, t("studio.error.request_failed"), t),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSnapshot = async (metricId: string) => {
    const raw = snapshotValue[metricId];
    const numericValue = Number(raw);
    if (Number.isNaN(numericValue)) return;
    try {
      await studioService.createMetricSnapshot(workspaceSlug, projectId, metricId, {
        numeric_value: numericValue,
        captured_at: new Date().toISOString(),
      });
      setSnapshotValue((current) => ({ ...current, [metricId]: "" }));
      await onMutate();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.forms.update_failed_title"),
        message: getStudioErrorMessage(error, t("studio.error.request_failed"), t),
      });
    }
  };

  return (
    <StudioSection
      title={t("studio.metrics.title")}
      description={t("studio.metrics.description")}
      count={metrics.length}
    >
      {canWrite && (
        <form className="mb-3 flex flex-wrap items-end gap-2" onSubmit={(event) => void createMetric(event)}>
          <Input
            className="h-9 w-40"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t("studio.metrics.name_placeholder")}
            required
          />
          <Input
            className="h-9 w-32"
            value={key}
            onChange={(event) => setKey(event.target.value)}
            placeholder={t("studio.metrics.key_placeholder")}
          />
          <Button type="submit" variant="secondary" size="sm" loading={isSubmitting}>
            {t("studio.metrics.add")}
          </Button>
        </form>
      )}
      {metrics.length > 0 ? (
        <div className="space-y-3">
          {metrics.map((metric) => {
            const numericPoints = metric.series.points
              .map((point) => point.numeric_value)
              .filter((value): value is number => typeof value === "number");
            return (
              <div key={metric.id} className="rounded-md border border-subtle px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-13 font-medium text-primary">{metric.name}</p>
                    <p className="text-11 text-placeholder">
                      {metric.key} · {metric.series.point_count}
                    </p>
                  </div>
                  {metric.series.draws_line ? (
                    <MetricLine values={numericPoints} />
                  ) : (
                    <p className="text-11 text-placeholder">{t("studio.metrics.need_three_points")}</p>
                  )}
                </div>
                {canWrite && (
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      className="h-8 w-28"
                      type="number"
                      value={snapshotValue[metric.id] ?? ""}
                      onChange={(event) =>
                        setSnapshotValue((current) => ({ ...current, [metric.id]: event.target.value }))
                      }
                      placeholder={t("studio.metrics.snapshot_placeholder")}
                    />
                    <Button variant="secondary" size="sm" onClick={() => void addSnapshot(metric.id)}>
                      {t("studio.metrics.add_snapshot")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <StudioEmptyState title={t("studio.metrics.empty_title")} description={t("studio.metrics.empty_description")} />
      )}
    </StudioSection>
  );
}
