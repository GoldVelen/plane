/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { TextArea } from "@plane/ui";
import useSWR from "swr";
import { StudioService } from "@/services/studio";
import { StudioErrorState, StudioPageLoader, getStudioErrorMessage } from "../shared";

const studioService = new StudioService();

export function StudioWeeklyReviewView({ workspaceSlug }: { workspaceSlug: string }) {
  const { t } = useTranslation();
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug ? `STUDIO_WEEKLY_REVIEW_${workspaceSlug}` : null,
    workspaceSlug ? () => studioService.getCurrentWeeklyReview(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );
  const [retrospective, setRetrospective] = useState("");
  const [healthSummary, setHealthSummary] = useState("");
  const [focus, setFocus] = useState("");
  const [risks, setRisks] = useState("");
  const [nextSteps, setNextSteps] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setRetrospective(data?.retrospective ?? "");
    setHealthSummary(data?.health_summary ?? "");
    setFocus(data?.focus ?? "");
    setRisks(data?.risks ?? "");
    setNextSteps(data?.next_steps ?? "");
  }, [data]);

  if (isLoading) return <StudioPageLoader />;
  if (error) return <StudioErrorState onRetry={() => void mutate()} />;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await studioService.saveWeeklyReview(workspaceSlug, {
        retrospective: retrospective.trim(),
        health_summary: healthSummary.trim(),
        focus: focus.trim(),
        risks: risks.trim(),
        next_steps: nextSteps.trim(),
      });
      await mutate();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.review.saved_title"),
        message: t("studio.review.saved_message"),
      });
    } catch (saveError) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.forms.update_failed_title"),
        message: getStudioErrorMessage(saveError, t("studio.error.request_failed"), t),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[800px] px-page-x pb-8">
      <div className="border-b border-subtle py-5">
        <h1 className="text-20 font-semibold text-primary">{t("studio.review.title")}</h1>
        <p className="mt-1 text-13 text-secondary">{t("studio.review.subtitle")}</p>
      </div>
      <form className="space-y-4 py-5" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block space-y-1.5">
          <span className="text-12 font-medium text-secondary">{t("studio.review.label_retrospective")}</span>
          <TextArea
            className="min-h-24 text-13"
            value={retrospective}
            onChange={(event) => setRetrospective(event.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-12 font-medium text-secondary">{t("studio.review.label_health")}</span>
          <TextArea
            className="min-h-20 text-13"
            value={healthSummary}
            onChange={(event) => setHealthSummary(event.target.value)}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-12 font-medium text-secondary">{t("studio.review.label_focus")}</span>
          <TextArea className="min-h-20 text-13" value={focus} onChange={(event) => setFocus(event.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-12 font-medium text-secondary">{t("studio.review.label_risks")}</span>
          <TextArea className="min-h-20 text-13" value={risks} onChange={(event) => setRisks(event.target.value)} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-12 font-medium text-secondary">{t("studio.review.label_next_steps")}</span>
          <TextArea
            className="min-h-20 text-13"
            value={nextSteps}
            onChange={(event) => setNextSteps(event.target.value)}
          />
        </label>
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          {t("studio.review.save")}
        </Button>
      </form>
    </div>
  );
}
