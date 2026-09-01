/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
import { usePopper } from "react-popper";
import { Popover, Transition } from "@headlessui/react";
import { MONTHS_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "@plane/propel/icons";
//hooks
// icons
// constants
import { getDate } from "@plane/utils";
import { useCalendarView } from "@/hooks/store/use-calendar-view";
import type { ICycleIssuesFilter } from "@/store/issue/cycle";
import type { IModuleIssuesFilter } from "@/store/issue/module";
import type { IProjectIssuesFilter } from "@/store/issue/project";
import type { IProjectViewIssuesFilter } from "@/store/issue/project-views";
// helpers

interface Props {
  issuesFilterStore: IProjectIssuesFilter | IModuleIssuesFilter | ICycleIssuesFilter | IProjectViewIssuesFilter;
}
export const CalendarMonthsDropdown = observer(function CalendarMonthsDropdown(props: Props) {
  const { issuesFilterStore } = props;
  const { currentLocale, t } = useTranslation();

  const issueCalendarView = useCalendarView();

  const calendarLayout = issuesFilterStore.issueFilters?.displayFilters?.calendar?.layout ?? "month";

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "auto",
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 12,
        },
      },
    ],
  });

  const { activeMonthDate } = issueCalendarView.calendarFilters;

  const formatMonth = (date: Date, month: "long" | "short") =>
    new Intl.DateTimeFormat(currentLocale, { month }).format(date);
  const formatMonthYear = (date: Date, month: "long" | "short") =>
    new Intl.DateTimeFormat(currentLocale, { month, year: "numeric" }).format(date);

  const getWeekLayoutHeader = (): string => {
    const allDaysOfActiveWeek = issueCalendarView.allDaysOfActiveWeek;

    if (!allDaysOfActiveWeek) return t("common.week");

    const daysList = Object.keys(allDaysOfActiveWeek);

    const firstDay = getDate(daysList[0]);
    const lastDay = getDate(daysList[daysList.length - 1]);

    if (!firstDay || !lastDay) return t("common.week");

    if (firstDay.getMonth() === lastDay.getMonth() && firstDay.getFullYear() === lastDay.getFullYear())
      return formatMonthYear(firstDay, "long");

    if (firstDay.getFullYear() !== lastDay.getFullYear()) {
      return `${formatMonthYear(firstDay, "short")} – ${formatMonthYear(lastDay, "short")}`;
    } else return `${formatMonth(firstDay, "short")} – ${formatMonthYear(lastDay, "short")}`;
  };

  const handleDateChange = (date: Date) => {
    issueCalendarView.updateCalendarFilters({
      activeMonthDate: date,
    });
  };

  return (
    <Popover className="relative">
      <Popover.Button as={React.Fragment}>
        <button
          type="button"
          ref={setReferenceElement}
          className="text-18 font-semibold outline-none"
          disabled={calendarLayout === "week"}
        >
          {calendarLayout === "month" ? formatMonthYear(activeMonthDate, "long") : getWeekLayoutHeader()}
        </button>
      </Popover.Button>
      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="fixed z-50">
          <div
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            className="w-56 divide-y divide-subtle-1 rounded-sm border border-subtle bg-surface-1 p-3 shadow-raised-200"
          >
            <div className="flex items-center justify-between gap-2 pb-3">
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const previousYear = new Date(activeMonthDate.getFullYear() - 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(previousYear);
                }}
              >
                <ChevronLeftIcon height={14} width={14} />
              </button>
              <span className="text-11">{activeMonthDate.getFullYear()}</span>
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const nextYear = new Date(activeMonthDate.getFullYear() + 1, activeMonthDate.getMonth(), 1);
                  handleDateChange(nextYear);
                }}
              >
                <ChevronRightIcon height={14} width={14} />
              </button>
            </div>
            <div className="grid grid-cols-4 items-stretch justify-items-stretch gap-4 pt-3">
              {Object.values(MONTHS_LIST).map((month) => {
                const monthDate = new Date(Date.UTC(2024, month.value - 1, 1));
                const monthLabel = new Intl.DateTimeFormat(currentLocale, {
                  month: "short",
                  timeZone: "UTC",
                }).format(monthDate);

                return (
                  <button
                    key={month.value}
                    type="button"
                    className="rounded-sm py-0.5 text-11 hover:bg-layer-1"
                    onClick={() => {
                      const newDate = new Date(activeMonthDate.getFullYear(), month.value - 1, 1);
                      handleDateChange(newDate);
                    }}
                  >
                    {monthLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
