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
  IStudioContentItem,
  IStudioExperiment,
  IStudioFeedback,
  IStudioRoutine,
  TStudioContentChannel,
  TStudioContentInput,
  TStudioContentStatus,
  TStudioExperimentInput,
  TStudioExperimentStatus,
  TStudioFeedbackInput,
  TStudioFeedbackSource,
  TStudioFeedbackStatus,
  TStudioPriority,
  TStudioRoutineCadence,
  TStudioRoutineInput,
  TStudioSentiment,
} from "@/services/studio";
import {
  STUDIO_CONTENT_CHANNELS,
  STUDIO_CONTENT_STATUSES,
  STUDIO_EXPERIMENT_STATUSES,
  STUDIO_FEEDBACK_SOURCES,
  STUDIO_FEEDBACK_STATUSES,
  STUDIO_PRIORITIES,
  STUDIO_ROUTINE_CADENCES,
  STUDIO_SENTIMENTS,
  fromDateTimeLocalValue,
  getStudioErrorMessage,
  studioEnumLabel,
  toDateTimeLocalValue,
} from "../shared";
import type { TStudioEnumDomain } from "../shared";

function ModalShell({
  title,
  isSubmitting,
  submitLabel,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  isSubmitting: boolean;
  submitLabel: string;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-12 font-medium text-secondary">{label}</span>
      {children}
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

export function FeedbackModal({
  feedback,
  onClose,
  onSave,
}: {
  feedback: IStudioFeedback | null;
  onClose: () => void;
  onSave: (payload: TStudioFeedbackInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [title, setTitle] = useState(feedback?.title ?? "");
  const [body, setBody] = useState(feedback?.body ?? "");
  const [source, setSource] = useState<TStudioFeedbackSource>(feedback?.source ?? "MANUAL");
  const [sentiment, setSentiment] = useState<TStudioSentiment>(feedback?.sentiment ?? "UNKNOWN");
  const [priority, setPriority] = useState<TStudioPriority>(feedback?.priority ?? "P2");
  const [status, setStatus] = useState<TStudioFeedbackStatus>(feedback?.status ?? "INBOX");
  const [reporterName, setReporterName] = useState(feedback?.reporter_name ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusOptions = feedback?.allowed_next_statuses
    ? Array.from(new Set([feedback.status, ...feedback.allowed_next_statuses]))
    : STUDIO_FEEDBACK_STATUSES;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        source,
        sentiment,
        priority,
        status,
        reporter_name: reporterName.trim(),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.feedback_saved_title", {
          action: t(feedback ? "studio.forms.action_updated" : "studio.forms.action_created"),
        }),
        message: t("studio.forms.feedback_saved_message"),
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
      title={feedback ? t("studio.forms.feedback_title_edit") : t("studio.forms.feedback_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={feedback ? t("studio.forms.save_feedback") : t("studio.forms.create_feedback")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_title")}>
        <Input className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <Field label={t("studio.forms.label_description")}>
        <TextArea
          className="min-h-24 resize-none text-13"
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_source")}>
          <SelectField value={source} options={STUDIO_FEEDBACK_SOURCES} domain="feedback_source" onChange={setSource} />
        </Field>
        <Field label={t("studio.forms.label_sentiment")}>
          <SelectField value={sentiment} options={STUDIO_SENTIMENTS} domain="sentiment" onChange={setSentiment} />
        </Field>
        <Field label={t("studio.forms.label_priority")}>
          <SelectField value={priority} options={STUDIO_PRIORITIES} domain="priority" onChange={setPriority} />
        </Field>
        <Field label={t("studio.forms.label_status")}>
          <SelectField value={status} options={statusOptions} domain="feedback_status" onChange={setStatus} />
        </Field>
      </div>
      <Field label={t("studio.forms.label_reporter")}>
        <Input className="w-full" value={reporterName} onChange={(event) => setReporterName(event.target.value)} />
      </Field>
    </ModalShell>
  );
}

export function ContentModal({
  item,
  onClose,
  onSave,
}: {
  item: IStudioContentItem | null;
  onClose: () => void;
  onSave: (payload: TStudioContentInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [title, setTitle] = useState(item?.title ?? "");
  const [brief, setBrief] = useState(item?.brief ?? "");
  const [channel, setChannel] = useState<TStudioContentChannel>(item?.channel ?? "OTHER");
  const [status, setStatus] = useState<TStudioContentStatus>(item?.status ?? "IDEA");
  const [plannedAt, setPlannedAt] = useState(toDateTimeLocalValue(item?.planned_at ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        brief: brief.trim(),
        channel,
        status,
        planned_at: fromDateTimeLocalValue(plannedAt),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.content_saved_title", {
          action: t(item ? "studio.forms.action_updated" : "studio.forms.action_created"),
        }),
        message: t("studio.forms.content_saved_message"),
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
      title={item ? t("studio.forms.content_title_edit") : t("studio.forms.content_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={item ? t("studio.forms.save_content") : t("studio.forms.create_content")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_title")}>
        <Input className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <Field label={t("studio.forms.label_brief")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={brief}
          onChange={(event) => setBrief(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={t("studio.forms.label_channel")}>
          <SelectField
            value={channel}
            options={STUDIO_CONTENT_CHANNELS}
            domain="content_channel"
            onChange={setChannel}
          />
        </Field>
        <Field label={t("studio.forms.label_status")}>
          <SelectField value={status} options={STUDIO_CONTENT_STATUSES} domain="content_status" onChange={setStatus} />
        </Field>
      </div>
      <Field label={t("studio.forms.label_planned_at")}>
        <Input
          className="w-full"
          type="datetime-local"
          value={plannedAt}
          onChange={(event) => setPlannedAt(event.target.value)}
        />
      </Field>
    </ModalShell>
  );
}

export function RoutineModal({
  routine,
  onClose,
  onSave,
}: {
  routine: IStudioRoutine | null;
  onClose: () => void;
  onSave: (payload: TStudioRoutineInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [name, setName] = useState(routine?.name ?? "");
  const [cadence, setCadence] = useState<TStudioRoutineCadence>(routine?.cadence ?? "WEEKLY");
  const [isActive, setIsActive] = useState(routine?.is_active ?? true);
  const [notes, setNotes] = useState(routine?.notes ?? "");
  const [nextDueAt, setNextDueAt] = useState(toDateTimeLocalValue(routine?.next_due_at ?? null));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        cadence,
        is_active: isActive,
        notes: notes.trim(),
        next_due_at: fromDateTimeLocalValue(nextDueAt),
      });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.routine_saved_title", {
          action: t(routine ? "studio.forms.action_updated" : "studio.forms.action_created"),
        }),
        message: t("studio.forms.routine_saved_message"),
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
      title={routine ? t("studio.forms.routine_title_edit") : t("studio.forms.routine_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={routine ? t("studio.forms.save_routine") : t("studio.forms.create_routine")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_name")}>
        <Input className="w-full" value={name} onChange={(event) => setName(event.target.value)} required />
      </Field>
      <Field label={t("studio.forms.label_routine_cadence")}>
        <SelectField value={cadence} options={STUDIO_ROUTINE_CADENCES} domain="routine_cadence" onChange={setCadence} />
      </Field>
      <Field label={t("studio.forms.label_next_due_at")}>
        <Input
          className="w-full"
          type="datetime-local"
          value={nextDueAt}
          onChange={(event) => setNextDueAt(event.target.value)}
        />
      </Field>
      <label className="flex items-center gap-2 text-13 text-secondary">
        <Checkbox checked={isActive} onChange={() => setIsActive(!isActive)} />
        {t("studio.forms.label_routine_active")}
      </label>
      <Field label={t("studio.forms.label_notes")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </Field>
    </ModalShell>
  );
}

export function ExperimentModal({
  experiment,
  onClose,
  onSave,
}: {
  experiment: IStudioExperiment | null;
  onClose: () => void;
  onSave: (payload: TStudioExperimentInput) => Promise<void>;
}) {
  const { t } = useTranslation();
  const showRequestError = useShowRequestError();
  const [title, setTitle] = useState(experiment?.title ?? "");
  const [hypothesis, setHypothesis] = useState(experiment?.hypothesis ?? "");
  const [status, setStatus] = useState<TStudioExperimentStatus>(experiment?.status ?? "DRAFT");
  const [result, setResult] = useState(experiment?.result ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const statusOptions = experiment?.allowed_next_statuses
    ? Array.from(new Set([experiment.status, ...experiment.allowed_next_statuses]))
    : STUDIO_EXPERIMENT_STATUSES;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ title: title.trim(), hypothesis: hypothesis.trim(), status, result: result.trim() });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("studio.forms.experiment_saved_title", {
          action: t(experiment ? "studio.forms.action_updated" : "studio.forms.action_created"),
        }),
        message: t("studio.forms.experiment_saved_message"),
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
      title={experiment ? t("studio.forms.experiment_title_edit") : t("studio.forms.experiment_title_create")}
      isSubmitting={isSubmitting}
      submitLabel={experiment ? t("studio.forms.save_experiment") : t("studio.forms.create_experiment")}
      onClose={onClose}
      onSubmit={(event) => void handleSubmit(event)}
    >
      <Field label={t("studio.forms.label_title")}>
        <Input className="w-full" value={title} onChange={(event) => setTitle(event.target.value)} required />
      </Field>
      <Field label={t("studio.forms.label_hypothesis")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={hypothesis}
          onChange={(event) => setHypothesis(event.target.value)}
        />
      </Field>
      <Field label={t("studio.forms.label_status")}>
        <SelectField value={status} options={statusOptions} domain="experiment_status" onChange={setStatus} />
      </Field>
      <Field label={t("studio.forms.label_result")}>
        <TextArea
          className="min-h-20 resize-none text-13"
          value={result}
          onChange={(event) => setResult(event.target.value)}
        />
      </Field>
    </ModalShell>
  );
}
