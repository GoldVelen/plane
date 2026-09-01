/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import React, { useMemo, useState } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
import { EIconSize } from "@plane/constants";
import { StateGroupIcon } from "@plane/propel/icons";
import type { IState } from "@plane/types";
// components
import { Loader } from "@plane/ui";
import { getTranslatedStateName } from "@plane/utils";
import { FilterHeader, FilterNoMatches, FilterOption } from "@/components/issues/issue-layouts/filters";
// ui
// types

type Props = {
  appliedFilters: string[] | null;
  handleUpdate: (val: string) => void;
  searchQuery: string;
  states: IState[] | undefined;
};

export const FilterState = observer(function FilterState(props: Props) {
  const { t } = useTranslation();
  const { appliedFilters, handleUpdate, searchQuery, states } = props;

  const [itemsToRender, setItemsToRender] = useState(5);
  const [previewEnabled, setPreviewEnabled] = useState(true);

  const appliedFiltersCount = appliedFilters?.length ?? 0;

  const sortedOptions = useMemo(() => {
    const filteredOptions = (states ?? []).filter((s) => {
      const displayName = getTranslatedStateName(s.name, t);
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || displayName.toLowerCase().includes(q);
    });

    return sortBy(filteredOptions, [(s) => !(appliedFilters ?? []).includes(s.id)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const handleViewToggle = () => {
    if (!sortedOptions) return;

    if (itemsToRender === sortedOptions.length) setItemsToRender(5);
    else setItemsToRender(sortedOptions.length);
  };

  return (
    <>
      <FilterHeader
        title={t("legacy_ui.state_value0", { value0: appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : "" })}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {sortedOptions ? (
            sortedOptions.length > 0 ? (
              <>
                {sortedOptions.slice(0, itemsToRender).map((state) => (
                  <FilterOption
                    key={state.id}
                    isChecked={Boolean(appliedFilters?.includes(state.id))}
                    onClick={() => handleUpdate(state.id)}
                    icon={
                      <StateGroupIcon
                        stateGroup={state.group}
                        color={state.color}
                        size={EIconSize.MD}
                        percentage={state?.order}
                      />
                    }
                    title={getTranslatedStateName(state.name, t)}
                  />
                ))}
                {sortedOptions.length > 5 && (
                  <button
                    type="button"
                    className="ml-8 text-11 font-medium text-accent-primary"
                    onClick={handleViewToggle}
                  >
                    {itemsToRender === sortedOptions.length ? t("legacy_ui.view_less") : t("legacy_ui.view_all")}
                  </button>
                )}
              </>
            ) : (
              <FilterNoMatches />
            )
          ) : (
            <Loader className="space-y-2">
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
              <Loader.Item height="20px" />
            </Loader>
          )}
        </div>
      )}
    </>
  );
});
