/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState, useEffect } from "react";
import { CloudOff, Dot } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { Badge } from "@plane/propel/badge";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const { t } = useTranslation();
  const [prevSyncStatus, setPrevSyncStatus] = useState<"syncing" | "synced" | "error" | null>(null);
  const [isVisible, setIsVisible] = useState(syncStatus !== "synced");

  useEffect(() => {
    // Only handle transitions when there's a change
    if (prevSyncStatus !== syncStatus) {
      if (syncStatus === "synced") {
        // Delay hiding to allow exit animation to complete
        setTimeout(() => {
          setIsVisible(false);
        }, 300); // match animation duration
      } else {
        setIsVisible(true);
      }
      setPrevSyncStatus(syncStatus);
    }
  }, [syncStatus, prevSyncStatus]);

  if (!isVisible || syncStatus === "synced") return null;

  const badgeContent = {
    syncing: {
      label: t("legacy_ui.syncing"),
      tooltipHeading: t("legacy_ui.syncing"),
      tooltipContent: t("legacy_ui.your_changes_are_being_synced_with_the_server_you_can_continue_making_changes"),
    },
    error: {
      label: t("legacy_ui.connection_lost"),
      tooltipHeading: t("legacy_ui.connection_lost"),
      tooltipContent: t("legacy_ui.we_re_having_trouble_connecting_to_the_websocket_server_your_changes_will_be_syn"),
    },
  };

  // This way we guarantee badgeContent is defined
  const content = badgeContent[syncStatus];

  return (
    <Tooltip tooltipHeading={content.tooltipHeading} tooltipContent={content.tooltipContent}>
      <span className="animate-quickFadeIn">
        <Badge
          variant={syncStatus === "syncing" ? "brand" : "danger"}
          size="lg"
          prependIcon={syncStatus === "syncing" ? <Dot /> : <CloudOff />}
        >
          {content.label}
        </Badge>
      </span>
    </Tooltip>
  );
}
