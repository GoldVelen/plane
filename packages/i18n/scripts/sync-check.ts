/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Usage:
//   tsx packages/i18n/scripts/sync-check.ts          # Report only
//   tsx packages/i18n/scripts/sync-check.ts --ci     # Exit 1 if issues found

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import type { LocaleData } from "./lib/locale-io.js";
import { LOCALES_DIR, listLocales, loadLocale } from "./lib/locale-io.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "../../..");

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const SOURCE_DIRECTORY_EXCLUDES = new Set([".next", ".react-router", ".turbo", "build", "dist", "node_modules"]);
const SOURCE_PATH_EXCLUDES = [
  // Retained for compatibility by the deprecated dashboard helper; there are no runtime UI consumers.
  "/packages/constants/src/dashboard.ts",
  "/packages/editor/src/core/extensions/starter-kit.ts",
  "/packages/editor/src/core/hooks/use-yjs-setup.ts",
  "/packages/i18n/",
  "/packages/propel/src/charts/",
  "/packages/propel/src/empty-state/assets/",
  "/packages/propel/src/icons/constants.tsx",
  "/packages/utils/src/auth.ts",
];

const AUDITED_UI_PATHS = [
  "apps/web/core/components/project",
  "apps/web/core/components/settings/project",
  "apps/web/core/components/analytics",
  "apps/web/core/components/archives",
  "apps/web/core/components/api-token",
  "apps/web/core/components/issues/issue-layouts/spreadsheet",
  "apps/web/core/components/sidebar",
  "apps/web/core/components/settings/profile/content/pages/general/form.tsx",
];

const UI_COPY_PROPS = new Set([
  "alt",
  "aria-label",
  "ariaLabel",
  "buttonTitle",
  "content",
  "customTooltipHeading",
  "description",
  "emptyText",
  "emptyStateMessage",
  "errorMessage",
  "heading",
  "header",
  "label",
  "loading",
  "message",
  "placeholder",
  "required",
  "subHeading",
  "subHeader",
  "text",
  "title",
  "tooltipContent",
  "tooltipHeading",
]);

const NON_UI_COPY_VALUES = new Set([
  "&nbsp;",
  "archive",
  "block+",
  "heading",
  "lazy",
  "lock",
  "make-private",
  "make-public",
  "text-11",
  "text-13",
  "text-14",
  "text-16",
  "text-11 font-medium",
  "text*",
  "tableRow+",
  "(tableCell | tableHeader)*",
  "unarchive",
  "unlock",
]);

const INTENTIONAL_ENGLISH_UI_COPY = new Set([
  "@planepowers",
  "- Plane",
  "Ask Pi",
  "AWS AMI",
  "CSV",
  "Excel",
  "Freshdesk",
  "GAC",
  "GitHub",
  "GitLab",
  "Google",
  "Jira",
  "JSON",
  "Markdown",
  "OAuth",
  "OIDC",
  "PDF",
  "Plane",
  "PQL",
  "RBAC",
  "SAML",
  "Sentry",
  "SLA",
  "Slack",
  "SMTP",
  "Studio OS",
  "Unsplash",
  "UTC",
  "Zapier",
  "Zendesk",
]);

// Any high-confidence hardcoded UI copy across the Web app is a regression.
const WEB_UI_COPY_BASELINE = 0;

const ZH_CN_EQUAL_VALUE_ALLOWLIST = new Set([
  "auth:auth.common.email.placeholder",
  "auth:auth.common.unique_code.placeholder",
  "auth:auth.sign_in.header.step.email.sub_header",
  "auth:auth.sign_up.header.step.email.sub_header",
  "auth:sso.domain_management.verified_domains.add_domain.form.domain_placeholder",
  "auth:sso.providers.saml.setup_modal.mapping_table.table.idp",
  "auth:sso.providers.saml.setup_modal.mapping_table.table.plane",
  "automation:automations.trigger.schedule.am",
  "automation:automations.trigger.schedule.cron_expression_placeholder",
  "automation:automations.trigger.schedule.main_content_cron_summary",
  "automation:automations.trigger.schedule.pm",
  "automation:automations.trigger.schedule.schedule_mode_cron",
  "common:common.url",
  "legacy-ui:legacy_ui.100_mb",
  "legacy-ui:legacy_ui.1_tb",
  "legacy-ui:legacy_ui.200_mb",
  "legacy-ui:legacy_ui.5_mb",
  "legacy-ui:legacy_ui.5_tb",
  "legacy-ui:legacy_ui.5gb",
  "legacy-ui:legacy_ui.gac",
  "legacy-ui:legacy_ui.ldap",
  "legacy-ui:legacy_ui.power_k",
  "legacy-ui:legacy_ui.url",
  "legacy-ui:legacy_ui.value0_plane",
  "common:exporter.csv.title",
  "common:exporter.excel.title",
  "common:exporter.json.title",
  "common:exporter.xlsx.title",
  "common:link.modal.url.text",
  "inbox:inbox_issue.order_by.id",
  "integration:bitbucket_dc_integration.name",
  "integration:github_enterprise_integration.app_id_title",
  "integration:github_enterprise_integration.app_name_title",
  "integration:github_enterprise_integration.base_url_title",
  "integration:github_enterprise_integration.client_id_title",
  "integration:github_enterprise_integration.client_secret_title",
  "integration:github_enterprise_integration.name",
  "integration:github_enterprise_integration.webhook_secret_title",
  "integration:github_integration.name",
  "integration:gitlab_enterprise_integration.name",
  "integration:gitlab_integration.name",
  "integration:oauth_bridge_integration.name",
  "integration:oauth_bridge_integration.provider_form.audience_placeholder",
  "integration:oauth_bridge_integration.provider_form.issuer_placeholder",
  "integration:oauth_bridge_integration.provider_form.jwks_url_label",
  "integration:oauth_bridge_integration.provider_form.jwks_url_placeholder",
  "integration:oauth_bridge_integration.provider_form.rate_limit_placeholder",
  "integration:sentry_integration.name",
  "integration:slack_integration.name",
  "navigation:sidebar.plane_pro",
  "settings:account_settings.profile.change_email_modal.form.code.placeholder",
  "studio:studio.enums.content_channel.X",
  "studio:studio.enums.feedback_source.APP_STORE",
  "studio:studio.enums.github_kind.CI",
  "studio:studio.enums.priority.P0",
  "studio:studio.enums.priority.P1",
  "studio:studio.enums.priority.P2",
  "studio:studio.enums.priority.P3",
  "studio:studio.forms.placeholder_version",
  "studio:studio.metrics.key_placeholder",
  "studio:studio.navigation.studio",
  "template:templates.settings.form.publish.company_name.placeholder",
  "template:templates.settings.form.publish.contact_email.placeholder",
  "template:templates.settings.form.publish.privacy_policy_url.placeholder",
  "template:templates.settings.form.publish.terms_of_service_url.placeholder",
  "template:templates.settings.form.publish.website.placeholder",
  "work-item:issue.display.properties.id",
  "workspace-settings:workspace_settings.settings.applications.redirect_uris.placeholder",
  "workspace-settings:workspace_settings.settings.applications.setup_url.placeholder",
  "workspace-settings:workspace_settings.settings.applications.webhook_url.label",
  "workspace-settings:workspace_settings.settings.applications.webhook_url.placeholder",
  "workspace-settings:workspace_settings.settings.applications.webhook_url_title",
  "workspace-settings:workspace_settings.settings.applications.website.placeholder",
  "workspace-settings:workspace_settings.settings.members.modal.placeholder",
  "workspace-settings:workspace_settings.settings.plane-intelligence.heading",
  "workspace-settings:workspace_settings.settings.plane-intelligence.title",
  "workspace-settings:workspace_settings.settings.runners.title",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number with commas (e.g. 7712 -> "7,712"). */
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function listSourceFiles(relativePaths: string[]): string[] {
  const files: string[] = [];

  const visit = (targetPath: string) => {
    const stat = fs.statSync(targetPath);
    if (stat.isFile()) {
      if (SOURCE_EXTENSIONS.has(path.extname(targetPath))) files.push(targetPath);
      return;
    }

    for (const entry of fs.readdirSync(targetPath, { withFileTypes: true })) {
      if (entry.isDirectory() && SOURCE_DIRECTORY_EXCLUDES.has(entry.name)) continue;
      const entryPath = path.join(targetPath, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(entryPath);
    }
  };

  for (const relativePath of relativePaths) visit(path.join(REPO_ROOT, relativePath));
  return files;
}

function createSourceFile(filePath: string, source: string): ts.SourceFile {
  const scriptKind = filePath.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, scriptKind);
}

interface SourceIssue {
  file: string;
  line: number;
  value: string;
}

function sourceIssue(filePath: string, sourceFile: ts.SourceFile, node: ts.Node, value: string): SourceIssue {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return {
    file: path.relative(REPO_ROOT, filePath),
    line: position.line + 1,
    value,
  };
}

function findStaticTranslationKeyIssues(validKeys: Set<string>): SourceIssue[] {
  const issues: SourceIssue[] = [];
  const files = listSourceFiles(["apps", "packages"]);

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    if (!source.includes("useTranslation") && !source.includes("i18nInstance")) continue;
    const sourceFile = createSourceFile(filePath, source);

    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        const isTranslationCall =
          (ts.isIdentifier(expression) && expression.text === "t") ||
          (ts.isPropertyAccessExpression(expression) && expression.name.text === "t");
        const firstArgument = node.arguments[0];
        if (isTranslationCall && firstArgument && ts.isStringLiteralLike(firstArgument)) {
          const key = firstArgument.text;
          if (key && !validKeys.has(key)) issues.push(sourceIssue(filePath, sourceFile, firstArgument, key));
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return issues.toSorted((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

function flattenValues(
  value: Record<string, unknown>,
  prefix = "",
  flattened: Map<string, unknown> = new Map()
): Map<string, unknown> {
  for (const [key, child] of Object.entries(value)) {
    const childPath = prefix ? `${prefix}.${key}` : key;
    if (child !== null && typeof child === "object" && !Array.isArray(child)) {
      flattenValues(child as Record<string, unknown>, childPath, flattened);
    } else {
      flattened.set(childPath, child);
    }
  }
  return flattened;
}

function getNamespaceValues(localeData: LocaleData): Map<string, unknown> {
  const values = new Map<string, unknown>();
  for (const namespace of localeData.namespaces) {
    for (const [key, value] of flattenValues(namespace.data)) values.set(`${namespace.name}:${key}`, value);
  }
  return values;
}

interface LocaleValueIssue {
  key: string;
  value: string;
}

function findUntranslatedChineseValues(enData: LocaleData, zhData: LocaleData): LocaleValueIssue[] {
  const enValues = getNamespaceValues(enData);
  const zhValues = getNamespaceValues(zhData);
  const issues: LocaleValueIssue[] = [];

  for (const [key, enValue] of enValues) {
    const zhValue = zhValues.get(key);
    if (typeof enValue === "string" && enValue === zhValue && !ZH_CN_EQUAL_VALUE_ALLOWLIST.has(key)) {
      issues.push({ key, value: enValue });
    }
  }

  return issues.toSorted((a, b) => a.key.localeCompare(b.key));
}

interface LocaleArtifactIssue extends LocaleValueIssue {
  locale: string;
}

function findLocaleValueArtifacts(localeData: LocaleData): LocaleArtifactIssue[] {
  const issues: LocaleArtifactIssue[] = [];

  for (const [key, value] of getNamespaceValues(localeData)) {
    if (
      typeof value === "string" &&
      (/⟪|__ITEM|__TERM|__[^\s"]+_\d{3}__/.test(value) ||
        (["zh-CN", "zh-TW"].includes(localeData.locale) && value.includes("飞机")))
    ) {
      issues.push({ locale: localeData.locale, key, value });
    }
  }

  return issues.toSorted((a, b) => a.key.localeCompare(b.key));
}

function normalizeUiCopy(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function findHardcodedUiCopy(relativePaths: string[]): SourceIssue[] {
  const issues: SourceIssue[] = [];
  const seenIssues = new Set<string>();
  const files = listSourceFiles(relativePaths).filter(
    (filePath) =>
      SOURCE_EXTENSIONS.has(path.extname(filePath)) &&
      !SOURCE_PATH_EXCLUDES.some((excludedPath) => filePath.includes(excludedPath)) &&
      !filePath.includes(".stories.") &&
      !filePath.includes(".test.") &&
      !filePath.includes(".spec.")
  );

  const addIssue = (filePath: string, sourceFile: ts.SourceFile, node: ts.Node, rawValue: string) => {
    const value = normalizeUiCopy(rawValue);
    if (!value || NON_UI_COPY_VALUES.has(value) || INTENTIONAL_ENGLISH_UI_COPY.has(value)) return;
    if (/^#[0-9a-f]{3,8}$/i.test(value) || /^https?:\/\//i.test(value)) return;
    if (/^[.,:;!?()-]+$/.test(value) || !/[A-Za-z]{2}/.test(value)) return;
    if (/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/.test(value)) return;
    const issue = sourceIssue(filePath, sourceFile, node, value);
    const fingerprint = `${issue.file}:${issue.line}:${issue.value}`;
    if (seenIssues.has(fingerprint)) return;
    seenIssues.add(fingerprint);
    issues.push(issue);
  };

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, "utf8");
    const sourceFile = createSourceFile(filePath, source);

    const addUiExpressionCopy = (expression: ts.Expression) => {
      if (ts.isStringLiteralLike(expression)) {
        addIssue(filePath, sourceFile, expression, expression.text);
        return;
      }
      if (ts.isConditionalExpression(expression)) {
        addUiExpressionCopy(expression.whenTrue);
        addUiExpressionCopy(expression.whenFalse);
        return;
      }
      if (ts.isParenthesizedExpression(expression)) {
        addUiExpressionCopy(expression.expression);
        return;
      }
      if (ts.isBinaryExpression(expression)) {
        if (
          [ts.SyntaxKind.PlusToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(
            expression.operatorToken.kind
          )
        ) {
          addUiExpressionCopy(expression.left);
          addUiExpressionCopy(expression.right);
        }
        return;
      }
      if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) {
        if (ts.isBlock(expression.body)) {
          const visitReturns = (node: ts.Node) => {
            if (ts.isReturnStatement(node) && node.expression) addUiExpressionCopy(node.expression);
            ts.forEachChild(node, visitReturns);
          };
          visitReturns(expression.body);
        } else {
          addUiExpressionCopy(expression.body);
        }
        return;
      }
      if (ts.isNoSubstitutionTemplateLiteral(expression)) {
        addIssue(filePath, sourceFile, expression, expression.text);
        return;
      }
      if (ts.isTemplateExpression(expression)) {
        addIssue(filePath, sourceFile, expression.head, expression.head.text);
        for (const span of expression.templateSpans) {
          addUiExpressionCopy(span.expression);
          addIssue(filePath, sourceFile, span.literal, span.literal.text);
        }
        return;
      }
      if (
        ts.isCallExpression(expression) &&
        ts.isIdentifier(expression.expression) &&
        ["t", "tx"].includes(expression.expression.text)
      ) {
        for (const argument of expression.arguments.slice(1)) addUiExpressionCopy(argument);
      }
    };

    const visit = (node: ts.Node) => {
      if (ts.isJsxElement(node)) {
        const tagName = node.openingElement.tagName.getText(sourceFile);
        if (tagName === "Script" || tagName === "script") return;
      }
      if (ts.isJsxText(node)) addIssue(filePath, sourceFile, node, node.text);

      if (ts.isJsxExpression(node) && node.expression && !ts.isJsxAttribute(node.parent)) {
        addUiExpressionCopy(node.expression);
      }

      if (ts.isJsxAttribute(node) && UI_COPY_PROPS.has(node.name.text) && node.initializer) {
        const parentTag = node.parent.parent.tagName.getText(sourceFile);
        if (parentTag === "meta" && node.name.text === "content") {
          ts.forEachChild(node, visit);
          return;
        }
        if (ts.isStringLiteral(node.initializer)) addIssue(filePath, sourceFile, node, node.initializer.text);
        else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
          addUiExpressionCopy(node.initializer.expression);
        }
      }

      if (
        ts.isBindingElement(node) &&
        ts.isIdentifier(node.name) &&
        UI_COPY_PROPS.has(node.name.text) &&
        node.initializer
      ) {
        addUiExpressionCopy(node.initializer);
      }

      if (
        ts.isPropertyAssignment(node) &&
        (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
        UI_COPY_PROPS.has(node.name.text)
      ) {
        const propertyName = node.name.text;
        const isMetadataContent =
          propertyName === "content" &&
          ts.isObjectLiteralExpression(node.parent) &&
          node.parent.properties.some((property) => {
            if (
              !ts.isPropertyAssignment(property) ||
              !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) ||
              !ts.isStringLiteralLike(property.initializer)
            ) {
              return false;
            }
            if (property.name.text === "property") return property.initializer.text.startsWith("og:");
            if (property.name.text !== "name") return false;
            return (
              ["robots", "viewport", "keywords"].includes(property.initializer.text) ||
              property.initializer.text.startsWith("twitter:")
            );
          });
        if (isMetadataContent) {
          ts.forEachChild(node, visit);
          return;
        }
        const siblingTranslationKeys = new Set([
          `i18n_${propertyName}`,
          `${propertyName}TranslationKey`,
          propertyName === "label" ? "i18nKey" : "",
        ]);
        const hasTranslationKey =
          ts.isObjectLiteralExpression(node.parent) &&
          node.parent.properties.some(
            (property) =>
              ts.isPropertyAssignment(property) &&
              (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
              siblingTranslationKeys.has(property.name.text)
          );
        if (!hasTranslationKey) addUiExpressionCopy(node.initializer);
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
  }

  return issues.toSorted((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

interface CollisionEntry {
  key: string;
  files: string[];
}

/** Cross-namespace collision check: same flattened key in multiple namespace files. */
function findCollisions(localeData: LocaleData): CollisionEntry[] {
  const keyToFiles = new Map<string, string[]>();
  for (const ns of localeData.namespaces) {
    for (const key of ns.keys) {
      const existing = keyToFiles.get(key);
      if (existing) {
        existing.push(`${ns.name}.json`);
      } else {
        keyToFiles.set(key, [`${ns.name}.json`]);
      }
    }
  }

  const collisions: CollisionEntry[] = [];
  for (const [key, files] of keyToFiles) {
    if (files.length > 1) {
      collisions.push({ key, files });
    }
  }
  return collisions.toSorted((a, b) => a.key.localeCompare(b.key));
}

interface PathConflict {
  leaf: string;
  branch: string;
}

/** Path conflict check: a key is both a leaf AND a prefix of another key. */
function findPathConflicts(localeData: LocaleData): PathConflict[] {
  const allKeysArray = [...localeData.allKeys].toSorted();
  const conflicts: PathConflict[] = [];

  // Build a set of all prefixes used in the keys
  const prefixes = new Set<string>();
  for (const key of allKeysArray) {
    const parts = key.split(".");
    for (let i = 1; i < parts.length; i++) {
      prefixes.add(parts.slice(0, i).join("."));
    }
  }

  // A conflict exists when a leaf key is also a prefix
  for (const key of allKeysArray) {
    if (prefixes.has(key)) {
      // Find one example of a key that extends this prefix
      const extending = allKeysArray.find((k) => k.startsWith(key + "."));
      if (extending) {
        conflicts.push({ leaf: key, branch: extending });
      }
    }
  }

  return conflicts;
}

interface LocaleComparison {
  locale: string;
  totalKeys: number;
  missingKeys: string[];
  staleKeys: string[];
  coverage: number; // 0-100
}

function compareToEnglish(enKeys: Set<string>, other: LocaleData): LocaleComparison {
  const missingKeys: string[] = [];
  const staleKeys: string[] = [];

  for (const key of enKeys) {
    if (!other.allKeys.has(key)) {
      missingKeys.push(key);
    }
  }

  for (const key of other.allKeys) {
    if (!enKeys.has(key)) {
      staleKeys.push(key);
    }
  }

  const coverage = enKeys.size > 0 ? ((enKeys.size - missingKeys.length) / enKeys.size) * 100 : 100;

  return {
    locale: other.locale,
    totalKeys: other.allKeys.size,
    missingKeys: missingKeys.toSorted(),
    staleKeys: staleKeys.toSorted(),
    coverage,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const ciMode = process.argv.includes("--ci");
  const reportHardcodedUi = process.argv.includes("--report-hardcoded");

  // Discover all locale directories
  const localeDirs = listLocales();

  if (!localeDirs.includes("en")) {
    console.error("ERROR: English locale (en) not found in", LOCALES_DIR);
    process.exit(1);
  }

  // Load all locales
  const localeDataMap = new Map<string, LocaleData>();
  for (const locale of localeDirs) {
    localeDataMap.set(locale, loadLocale(locale));
  }

  const enData = localeDataMap.get("en")!;
  const zhData = localeDataMap.get("zh-CN");
  if (!zhData) {
    console.error("ERROR: Simplified Chinese locale (zh-CN) not found in", LOCALES_DIR);
    process.exit(1);
  }

  // Run checks
  const collisions = findCollisions(enData);
  const pathConflicts = findPathConflicts(enData);
  const staticTranslationKeyIssues = findStaticTranslationKeyIssues(enData.allKeys);
  const untranslatedChineseValues = findUntranslatedChineseValues(enData, zhData);
  const localeValueArtifacts = localeDirs.flatMap((locale) => findLocaleValueArtifacts(localeDataMap.get(locale)!));
  const auditedUiCopyIssues = findHardcodedUiCopy(AUDITED_UI_PATHS);
  const webUiCopyIssues = findHardcodedUiCopy(["apps/web", "packages"]);

  const comparisons: LocaleComparison[] = [];
  for (const locale of localeDirs) {
    if (locale === "en") continue;
    comparisons.push(compareToEnglish(enData.allKeys, localeDataMap.get(locale)!));
  }

  // -------------------------------------------------------------------------
  // Print report
  // -------------------------------------------------------------------------

  let hasFailure = false;

  console.log("\n=== Sync Check Results ===\n");
  console.log(`  en:    ${fmt(enData.allKeys.size)} keys (source)\n`);

  for (const comp of comparisons) {
    const status = comp.missingKeys.length === 0 ? "✓" : "✗";
    const missingStr = comp.missingKeys.length > 0 ? ` — ${fmt(comp.missingKeys.length)} missing` : "";
    const staleStr = comp.staleKeys.length > 0 ? `, ${fmt(comp.staleKeys.length)} stale` : "";
    console.log(
      `  ${status} ${comp.locale.padEnd(10)} ${fmt(comp.totalKeys)} keys (${comp.coverage.toFixed(1)}%)${missingStr}${staleStr}`
    );
    if (comp.missingKeys.length > 0) {
      hasFailure = true;
    }
  }

  // Cross-namespace collisions
  if (collisions.length > 0) {
    hasFailure = true;
    console.log("\nCROSS-NAMESPACE COLLISIONS:");
    for (const c of collisions) {
      console.log(`  ✗ "${c.key}" exists in: ${c.files.join(", ")}`);
    }
  }

  // Path conflicts
  if (pathConflicts.length > 0) {
    hasFailure = true;
    console.log("\nPATH CONFLICTS:");
    for (const pc of pathConflicts) {
      console.log(`  ✗ "${pc.leaf}" is a leaf but "${pc.branch}" extends it`);
    }
  }

  if (staticTranslationKeyIssues.length > 0) {
    hasFailure = true;
    console.log("\nINVALID STATIC TRANSLATION KEYS:");
    for (const issue of staticTranslationKeyIssues.slice(0, 50)) {
      console.log(`  ✗ ${issue.file}:${issue.line} — ${JSON.stringify(issue.value)}`);
    }
    if (staticTranslationKeyIssues.length > 50) {
      console.log(`  ... and ${fmt(staticTranslationKeyIssues.length - 50)} more`);
    }
  }

  if (untranslatedChineseValues.length > 0) {
    hasFailure = true;
    console.log("\nUNTRANSLATED SIMPLIFIED CHINESE VALUES:");
    for (const issue of untranslatedChineseValues) {
      console.log(`  ✗ ${issue.key} = ${JSON.stringify(issue.value)}`);
    }
  }

  if (localeValueArtifacts.length > 0) {
    hasFailure = true;
    console.log("\nTRANSLATION VALUE ARTIFACTS:");
    for (const issue of localeValueArtifacts) {
      console.log(`  ✗ ${issue.locale}:${issue.key} = ${JSON.stringify(issue.value)}`);
    }
  }

  if (auditedUiCopyIssues.length > 0) {
    hasFailure = true;
    console.log("\nHARDCODED UI COPY IN AUDITED CORE PATHS:");
    for (const issue of auditedUiCopyIssues) {
      console.log(`  ✗ ${issue.file}:${issue.line} — ${JSON.stringify(issue.value)}`);
    }
  }

  if (webUiCopyIssues.length > WEB_UI_COPY_BASELINE) {
    hasFailure = true;
    console.log(
      `\nHARDCODED WEB UI COPY REGRESSION: ${fmt(webUiCopyIssues.length)} matches exceeds the ${fmt(WEB_UI_COPY_BASELINE)}-match baseline.`
    );
  }

  if (reportHardcodedUi && webUiCopyIssues.length > 0) {
    console.log("\nHARDCODED WEB UI COPY INVENTORY:");
    for (const issue of webUiCopyIssues) {
      console.log(`  - ${issue.file}:${issue.line} — ${JSON.stringify(issue.value)}`);
    }
  }

  console.log(
    `\n  Web hardcoded UI inventory: ${fmt(webUiCopyIssues.length)} high-confidence matches across the full app (baseline ${fmt(WEB_UI_COPY_BASELINE)}).`
  );

  // Missing keys detail
  const withMissing = comparisons.filter((c) => c.missingKeys.length > 0);
  if (withMissing.length > 0) {
    console.log("\n--- Missing Keys Detail ---\n");
    for (const comp of withMissing) {
      console.log(`${comp.locale} (${fmt(comp.missingKeys.length)} missing):`);
      const show = comp.missingKeys.slice(0, 20);
      for (const key of show) {
        console.log(`  - ${key}`);
      }
      if (comp.missingKeys.length > 20) {
        console.log(`  ... and ${fmt(comp.missingKeys.length - 20)} more`);
      }
      console.log();
    }
  }

  // Stale keys detail
  const withStale = comparisons.filter((c) => c.staleKeys.length > 0);
  if (withStale.length > 0) {
    console.log("--- Stale Keys Detail ---\n");
    for (const comp of withStale) {
      console.log(`${comp.locale} (${fmt(comp.staleKeys.length)} stale):`);
      const show = comp.staleKeys.slice(0, 20);
      for (const key of show) {
        console.log(`  - ${key}`);
      }
      if (comp.staleKeys.length > 20) {
        console.log(`  ... and ${fmt(comp.staleKeys.length - 20)} more`);
      }
      console.log();
    }
  }

  // CI exit code
  if (ciMode && hasFailure) {
    console.log("CI mode: exiting with code 1 due to localization integrity failures.");
    process.exit(1);
  }

  if (!hasFailure) {
    console.log("\nAll locale keys, static translation calls, Chinese values, and audited core UI paths passed.");
  }
}

try {
  main();
} catch (err) {
  console.error("Sync check failed:", err);
  process.exit(1);
}
