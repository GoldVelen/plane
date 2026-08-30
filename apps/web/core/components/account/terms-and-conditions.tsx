/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import Link from "next/link";
import { EAuthModes } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

interface TermsAndConditionsProps {
  authType?: EAuthModes;
}

// Constants for better maintainability
const LEGAL_LINKS = {
  termsOfService: "https://plane.so/legals/terms-and-conditions",
  privacyPolicy: "https://plane.so/legals/privacy-policy",
} as const;

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-secondary" target="_blank" rel="noopener noreferrer">
      <span className="text-13 font-medium underline hover:cursor-pointer">{children}</span>
    </Link>
  );
}

export function TermsAndConditions({ authType = EAuthModes.SIGN_IN }: TermsAndConditionsProps) {
  const { t } = useTranslation();
  const leadKey = authType === EAuthModes.SIGN_UP ? "auth.common.terms.sign_up_lead" : "auth.common.terms.sign_in_lead";

  return (
    <div className="flex items-center justify-center">
      <p className="text-center text-13 whitespace-pre-line text-tertiary">
        {t(leadKey)}
        <LegalLink href={LEGAL_LINKS.termsOfService}>{t("auth.common.terms.terms_of_service")}</LegalLink>
        {t("auth.common.terms.conjunction")}
        <LegalLink href={LEGAL_LINKS.privacyPolicy}>{t("auth.common.terms.privacy_policy")}</LegalLink>
        {t("auth.common.terms.period")}
      </p>
    </div>
  );
}
