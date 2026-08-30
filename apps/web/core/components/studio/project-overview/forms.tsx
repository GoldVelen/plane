/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Checkbox, CustomSelect, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";
import type {
  IStudioDecision,
  IStudioProjectProfile,
  IStudioRelease,
  IStudioRisk,
  TStudioDecisionInput,
  TStudioDecisionStatus,
  TStudioHealthStatus,
  TStudioLifecycleStage,
  TStudioPortfolioBucket,
  TStudioPriority,
  TStudioProjectProfileInput,
  TStudioProductType,
  TStudioReleaseChannel,
  TStudioReleaseInput,
  TStudioReleaseStatus,
  TStudioRiskInput,
  TStudioRiskStatus,
  TStudioRiskType,
} from "@/services/studio";
import {
  fromDateTimeLocalValue,
  getStudioErrorMessage,
  STUDIO_DECISION_STATUSES,
  STUDIO_HEALTH_STATUSES,
  STUDIO_LIFECYCLE_STAGES,
  STUDIO_PORTFOLIO_BUCKETS,
  STUDIO_PRIORITIES,
  STUDIO_PRODUCT_TYPES,
  STUDIO_RELEASE_CHANNELS,
  STUDIO_RELEASE_STATUSES,
  STUDIO_RISK_STATUSES,
  STUDIO_RISK_TYPES,
  studioEnumLabel,
  toDateTimeLocalValue,
} from "../shared";
import type { TStudioEnumDomain } from "../shared";

type TModalShellProps = {
  title: string;
  isSubmitting: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

function ModalShell({ title, isSubmitting, submitLabel, onClose, onSubmit, children }: TModalShellProps) {
  const { t } = useTranslation();

  return (
    <ModalCore isOpen position={EModalPosition.TOP} width={EModalWidth.XXL} handleClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="border-b border-subtle px-5 py-4">
          <h2 className="text-18 font-medium text-primary">{title}</h2>
        </div>
        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-5">{children}</div>
        <div className="flex items-center justify-end gap-2 border-t border-subtle px-5 py-4">
          <Button type="button" variant="secondary" size="lg" onClick={onClose}>
            {t("studio.common.cancel")}
          </Button>
          <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-12 font-medium text-secondary">{label}</span>
      {children}
      {hint && <span className="block text-11 text-placeholder">{hint}</span>}
    </label>
  );
}

function SelectField<T extends string>({
  value,
  options,
  domain,
  onChange,
}: {
  value: T;
  options: readonly T[];
  domain: TStudioEnumDomain;
  onChange: (value: T) => void;
}) {
  const { t } = useTranslation();

  return (
    <CustomSelect
      value={value}
      label={studioEnumLabel(t, domain, value)}
      onChange={onChange}
      input
      buttonClassName="h-9 w-full"
      optionsClassName="min-w-48"
    >
      {options.map((option) => (
        <CustomSelect.Option key={option} value={option}>
          {studioEnumLabel(t, domain, option)}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
}

function useShowRequestError() {
  const { t } = useTranslation();

  return (error: unknown) =>
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("studio.forms.update_failed_title"),
      message: getStudioErrorMessage(error, t("studio.error.request_failed"), t),
    });
}

export function ProjectProfileModal({
  profile,
  onClose,
  onSave,
}: {
  profile: IStudioProjectProfile | null;
  onClose: () => void;
  onSave: (payload: TStudioProjectProfileInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [productType, setProductType] = useState<TStudioProductType>(profile?.product_type ?? "OTHER");
  const [bucket, setBucket] = useState<TStudioPortfolioBucket>(profile?.portfolio_bucket ?? "INCUBATING");
  const [lifecycle, setLifecycle] = useState<TStudioLifecycleStage>(profile?.lifecycle_stage ?? "IDEA");
  const [priority, setPriority] = useState<TStudioPriority>(profile?.priority ?? "P2");
  const [focusStatement, setFocusStatement] = useState(profile?.focus_statement ?? "");
  const [cadence, setCadence] = useState(profile?.expected_update_interval_days ?? 14);
  const [lastActivity, setLastActivity] = useState(toDateTimeLocalValue(profile?.last_meaningful_activity_at ?? null));
  const [manualHealth, setManualHealth] = useState<TStudioHealthStatus | "AUTO">(profile?.manual_health ?? "AUTO");
  const [manualReason, setManualReason] = useState(profile?.manual_health_reason ?? "");
  const [manualExpiresAt, setManualExpiresAt] = useState(
    toDateTimeLocalValue(profile?.manual_health_expires_at ?? null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (manualHealth !== "AUTO" && !manualReason.trim()) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("studio.forms.override_reason_required_title"),
        message: t("studio.forms.override_reason_required_message"),
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        product_type: productType,
        portfolio_bucket: bucket,
        lifecycle_stage: lifecycle,
        priority,
        focus_statement: focusStatement.trim(),
        expected_update_interval_days: cadence,
        last_meaningful_activity_at: fromDateTimeLocalValue(lastActivity),
        manual_health: manualHealth === "AUTO" ? null : manualHealth,
        manual_health_reason: manualHealth === "AUTO" ? "" : manualReason.trim(),
        manual_health_expires_at: manualHealth === "AUTO" ? null : fromDateTimeLocalValue(manualExpiresAt),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.profile_saved_title"),
        message: t("studio.forms.profile_saved_message"),
      });
      onClose();
    } catch (error) {
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={profile ? t("studio.forms.profile_title_edit") : t("studio.forms.profile_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={t("studio.forms.save_profile")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_portfolio_bucket")}>
          <SelectField value={bucket} options={STUDIO_PORTFOLIO_BUCKETS} domain="bucket" onChange={setBucket} />
        </Field>
        <Field label={t("studio.forms.label_lifecycle")}>
          <SelectField value={lifecycle} options={STUDIO_LIFECYCLE_STAGES} domain="lifecycle" onChange={setLifecycle} />
        </Field>
        <Field label={t("studio.forms.label_priority")}>
          <SelectField value={priority} options={STUDIO_PRIORITIES} domain="priority" onChange={setPriority} />
        </Field>
        <Field label={t("studio.forms.label_product_type")}>
          <SelectField
            value={productType}
            options={STUDIO_PRODUCT_TYPES}
            domain="product_type"
            onChange={setProductType}
          />
        </Field>
      </div>
      <Field label={t("studio.forms.label_focus")} hint={t("studio.forms.hint_focus")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={focusStatement}
          onChange={(event) => setFocusStatement(event.target.value)}
          placeholder={t("studio.forms.placeholder_focus")}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_cadence")} hint={t("studio.forms.hint_cadence")}>
          <Input
            className="w-full"
            type="number"
            min={1}
            max={365}
            value={cadence}
            onChange={(event) => setCadence(Number(event.target.value))}
            required
          />
        </Field>
        <Field label={t("studio.forms.label_last_activity")}>
          <Input
            className="w-full"
            type="datetime-local"
            value={lastActivity}
            onChange={(event) => setLastActivity(event.target.value)}
          />
        </Field>
      </div>
      <div className="border-t border-subtle pt-4">
        <h3 className="mb-3 text-13 font-medium text-primary">{t("studio.forms.manual_override_heading")}</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t("studio.forms.label_health_source")}>
            <SelectField
              value={manualHealth}
              options={["AUTO", ...STUDIO_HEALTH_STATUSES] as const}
              domain="health"
              onChange={setManualHealth}
            />
          </Field>
          <Field label={t("studio.forms.label_expires_at")}>
            <Input
              className="w-full"
              type="datetime-local"
              value={manualExpiresAt}
              onChange={(event) => setManualExpiresAt(event.target.value)}
              disabled={manualHealth === "AUTO"}
            />
          </Field>
        </div>
        {manualHealth !== "AUTO" && (
          <div className="mt-4">
            <Field label={t("studio.forms.label_override_reason")}>
              <TextArea
                className="min-h-16 resize-none text-13"
                value={manualReason}
                onChange={(event) => setManualReason(event.target.value)}
                required
              />
            </Field>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

export function ReleaseModal({
  release,
  onClose,
  onSave,
}: {
  release: IStudioRelease | null;
  onClose: () => void;
  onSave: (payload: TStudioReleaseInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [name, setName] = useState(release?.name ?? "");
  const [version, setVersion] = useState(release?.version ?? "");
  const [channel, setChannel] = useState<TStudioReleaseChannel>(release?.channel ?? "INTERNAL");
  const [status, setStatus] = useState<TStudioReleaseStatus>(release?.status ?? "PLANNED");
  const [targetAt, setTargetAt] = useState(toDateTimeLocalValue(release?.target_at ?? null));
  const [releasedAt, setReleasedAt] = useState(toDateTimeLocalValue(release?.released_at ?? null));
  const [scopeSummary, setScopeSummary] = useState(release?.scope_summary ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        version: version.trim(),
        channel,
        status,
        target_at: fromDateTimeLocalValue(targetAt),
        released_at: fromDateTimeLocalValue(releasedAt),
        scope_summary: scopeSummary.trim(),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.release_saved_title", {
          action: release ? t("studio.forms.action_updated") : t("studio.forms.action_created"),
        }),
        message: t("studio.forms.release_saved_message"),
      });
      onClose();
    } catch (error) {
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={release ? t("studio.forms.release_title_edit") : t("studio.forms.release_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={release ? t("studio.forms.save_release") : t("studio.forms.create_release")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_name")}>
          <Input className="w-full" value={name} onChange={(event) => setName(event.target.value)} required />
        </Field>
        <Field label={t("studio.forms.label_version")}>
          <Input
            className="w-full"
            value={version}
            onChange={(event) => setVersion(event.target.value)}
            placeholder={t("studio.forms.placeholder_version")}
            required
          />
        </Field>
        <Field label={t("studio.forms.label_channel")}>
          <SelectField
            value={channel}
            options={STUDIO_RELEASE_CHANNELS}
            domain="release_channel"
            onChange={setChannel}
          />
        </Field>
        <Field label={t("studio.forms.label_status")}>
          <SelectField value={status} options={STUDIO_RELEASE_STATUSES} domain="release_status" onChange={setStatus} />
        </Field>
        <Field label={t("studio.forms.label_target_date")}>
          <Input
            className="w-full"
            type="datetime-local"
            value={targetAt}
            onChange={(event) => setTargetAt(event.target.value)}
          />
        </Field>
        <Field label={t("studio.forms.label_released_at")}>
          <Input
            className="w-full"
            type="datetime-local"
            value={releasedAt}
            onChange={(event) => setReleasedAt(event.target.value)}
          />
        </Field>
      </div>
      <Field label={t("studio.forms.label_scope_summary")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={scopeSummary}
          onChange={(event) => setScopeSummary(event.target.value)}
        />
      </Field>
    </ModalShell>
  );
}

export function DecisionModal({
  decision,
  projectId,
  onClose,
  onSave,
}: {
  decision: IStudioDecision | null;
  projectId: string;
  onClose: () => void;
  onSave: (payload: TStudioDecisionInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [title, setTitle] = useState(decision?.title ?? "");
  const [question, setQuestion] = useState(decision?.question ?? "");
  const [context, setContext] = useState(decision?.context ?? "");
  const [recommendation, setRecommendation] = useState(decision?.recommendation ?? "");
  const [finalDecision, setFinalDecision] = useState(decision?.final_decision ?? "");
  const [status, setStatus] = useState<TStudioDecisionStatus>(decision?.status ?? "DRAFT");
  const [dueAt, setDueAt] = useState(toDateTimeLocalValue(decision?.due_at ?? null));
  const [decidedAt, setDecidedAt] = useState(toDateTimeLocalValue(decision?.decided_at ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        project_id: projectId,
        title: title.trim(),
        question: question.trim(),
        context: context.trim(),
        recommendation: recommendation.trim(),
        final_decision: finalDecision.trim(),
        status,
        due_at: fromDateTimeLocalValue(dueAt),
        decided_at: fromDateTimeLocalValue(decidedAt),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.decision_saved_title", {
          action: decision ? t("studio.forms.action_updated") : t("studio.forms.action_created"),
        }),
        message: t("studio.forms.decision_saved_message"),
      });
      onClose();
    } catch (error) {
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={decision ? t("studio.forms.decision_title_edit") : t("studio.forms.decision_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={decision ? t("studio.forms.save_decision") : t("studio.forms.create_decision")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_title")}>
        <Input className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <Field label={t("studio.forms.label_question")}>
        <Input className="w-full" value={question} onChange={(event) => setQuestion(event.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_status")}>
          <SelectField
            value={status}
            options={STUDIO_DECISION_STATUSES}
            domain="decision_status"
            onChange={setStatus}
          />
        </Field>
        <Field label={t("studio.forms.label_due_at")}>
          <Input
            className="w-full"
            type="datetime-local"
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </Field>
      </div>
      <Field label={t("studio.forms.label_context")}>
        <TextArea
          className="min-h-16 resize-none text-13"
          value={context}
          onChange={(event) => setContext(event.target.value)}
        />
      </Field>
      <Field label={t("studio.forms.label_recommendation")}>
        <TextArea
          className="min-h-16 resize-none text-13"
          value={recommendation}
          onChange={(event) => setRecommendation(event.target.value)}
        />
      </Field>
      <Field label={t("studio.forms.label_final_decision")}>
        <TextArea
          className="min-h-16 resize-none text-13"
          value={finalDecision}
          onChange={(event) => setFinalDecision(event.target.value)}
        />
      </Field>
      {status === "DECIDED" && (
        <Field label={t("studio.forms.label_decided_at")}>
          <Input
            className="w-full"
            type="datetime-local"
            value={decidedAt}
            onChange={(event) => setDecidedAt(event.target.value)}
          />
        </Field>
      )}
    </ModalShell>
  );
}

export function RiskModal({
  risk,
  onClose,
  onSave,
}: {
  risk: IStudioRisk | null;
  onClose: () => void;
  onSave: (payload: TStudioRiskInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [title, setTitle] = useState(risk?.title ?? "");
  const [type, setType] = useState<TStudioRiskType>(risk?.type ?? "PRODUCT");
  const [status, setStatus] = useState<TStudioRiskStatus>(risk?.status ?? "OPEN");
  const [probability, setProbability] = useState(risk?.probability ?? 2);
  const [impact, setImpact] = useState(risk?.impact ?? 2);
  const [isBlocker, setIsBlocker] = useState(risk?.is_blocker ?? false);
  const [description, setDescription] = useState(risk?.description ?? "");
  const [mitigation, setMitigation] = useState(risk?.mitigation ?? "");
  const [dueAt, setDueAt] = useState(toDateTimeLocalValue(risk?.due_at ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        type,
        status,
        probability,
        impact,
        is_blocker: isBlocker,
        description: description.trim(),
        mitigation: mitigation.trim(),
        due_at: fromDateTimeLocalValue(dueAt),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.risk_saved_title", {
          action: risk ? t("studio.forms.action_updated") : t("studio.forms.action_created"),
        }),
        message: t("studio.forms.risk_saved_message"),
      });
      onClose();
    } catch (error) {
      showRequestError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalShell
      title={risk ? t("studio.forms.risk_title_edit") : t("studio.forms.risk_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={risk ? t("studio.forms.save_risk") : t("studio.forms.create_risk")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_title")}>
        <Input className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_type")}>
          <SelectField value={type} options={STUDIO_RISK_TYPES} domain="risk_type" onChange={setType} />
        </Field>
        <Field label={t("studio.forms.label_status")}>
          <SelectField value={status} options={STUDIO_RISK_STATUSES} domain="risk_status" onChange={setStatus} />
        </Field>
        <Field label={t("studio.forms.label_probability")}>
          <Input
            className="w-full"
            type="number"
            min={1}
            max={5}
            value={probability}
            onChange={(event) => setProbability(Number(event.target.value))}
            required
          />
        </Field>
        <Field label={t("studio.forms.label_impact")}>
          <Input
            className="w-full"
            type="number"
            min={1}
            max={5}
            value={impact}
            onChange={(event) => setImpact(Number(event.target.value))}
            required
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-12 font-medium text-secondary">
        <Checkbox checked={isBlocker} onChange={(event) => setIsBlocker(event.target.checked)} />
        {t("studio.forms.label_is_blocker")}
      </label>
      <Field label={t("studio.forms.label_description")}>
        <TextArea
          className="min-h-16 resize-none text-13"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </Field>
      <Field label={t("studio.forms.label_mitigation")}>
        <TextArea
          className="min-h-16 resize-none text-13"
          value={mitigation}
          onChange={(event) => setMitigation(event.target.value)}
        />
      </Field>
      <Field label={t("studio.forms.label_due_at")}>
        <Input
          className="w-full"
          type="datetime-local"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
        />
      </Field>
    </ModalShell>
  );
}
