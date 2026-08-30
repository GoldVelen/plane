# Studio OS localization + Phase 0/1 unified review pack

This file is the single Codex review packet for Phase 0/1, Simplified Chinese localization, and the login-page copy close-out. It does not replace `evidence.md` (Phase 0/1 functional evidence) and is not a visual-regression baseline.

Runtime: isolated Compose project `studio-plane-phase1`, API `http://127.0.0.1:8200`, web `http://127.0.0.1:3200`, workspace `studio-os`. Account `studio.admin@local.test` (password only in gitignored `deployments/studio/local/.audit-credentials`).

Branch `codex/studio-phase-1` at baseline `5f7d92784c403f76284f0f16718f320221dc7fec` (Plane CE v1.4.2). Working tree remains dirty by design; no commit/push in this batch.

## Why the previous localization stop was not enough

The previous batch made the sign-in **form** Chinese (`邮箱` / `继续` / `首次使用 Plane？`) via navigator language detection, but left Plane-native hardcoded English on the same first screen:

- Hero: `Work in all dimensions.` / `Welcome back to Plane.`
- Header action: `t("Sign up")` used as a missing key, so it rendered `Sign up`
- Footer social proof: `Join 10,000+ teams building with Plane`
- Terms sentence: `By signing in, you understand and agree to our Terms of Service and Privacy Policy.`

Those strings are now in `@plane/i18n` `auth` and render in zh-CN / en as specified below.

## Language resolution

Previously `@plane/i18n` initialized with `localStorage.userLanguage` or `FALLBACK_LANGUAGE` (`"en"`). A fresh browser therefore always rendered the sign-in page in English.

Current order, implemented in `packages/i18n/src/core/resolve-initial-language.ts` and used by `packages/i18n/src/core/instance.ts`:

1. `localStorage` key `userLanguage`, if it exactly matches a `SUPPORTED_LANGUAGES` value (case-insensitive canonicalization to the supported tag, e.g. `zh-cn` → `zh-CN`).
2. First exact match in `navigator.languages`, falling back to `navigator.language` when the list is empty.
3. `FALLBACK_LANGUAGE`, still `"en"`. That constant was not changed.

Constraints that were verified:

- SSR / no `window` always returns `en`.
- Prefixes such as `zh` or `zh-Hans-CN` are not mapped onto `zh-CN` / `zh-TW`.
- Navigator detection does not write `localStorage`. Only `changeLanguage` / `setLanguage` persist a choice.
- Signed-in profile language is unchanged: `fetchUserProfile` / `updateUserProfile` still call `setLanguage`.
- `useTranslation` public signature is unchanged.

Unit tests: `packages/i18n/src/core/resolve-initial-language.test.ts` (7 cases; not re-run this wrap-up because the file was not touched).

## Namespace boundary

`NAMESPACES` in `packages/i18n/src/constants/namespaces.ts` includes `"studio"`. Studio chrome, empty states, forms, health reasons, enum labels, and the nine known DRF validation messages live under `studio.*`.

Plane-generic strings added for this fork stay in existing namespaces, with 19-locale key parity:

- `common.more` / `common.hide` / `common.show` / `common.set_as_default` / `common.clear_default`
- `aria_labels.app_sidebar.open_workspace_menu` / `close_workspace_menu` / `open_extended_sidebar` / `close_extended_sidebar`
- Login-page close-out (this wrap-up), all under `auth.common.*` — not `studio.*`:
  - `auth.common.sign_in` / `auth.common.sign_up`
  - `auth.common.hero_header`
  - `auth.common.hero_subheader_sign_in` / `auth.common.hero_subheader_sign_up`
  - `auth.common.footer_social_proof`
  - `auth.common.terms.sign_in_lead` / `sign_up_lead` / `terms_of_service` / `conjunction` / `privacy_policy` / `period`

Invitation subheaders reuse existing `auth.sign_up.header.label` and `auth.sign_in.header.label`.

`en` is the source of truth. `zh-CN` is human-translated. The other 17 locales copy English values for these fork-added keys.

Studio copy was not inserted into Plane native dictionaries except the keys listed above.

## Health `reason_code` contract

`compute_health` still returns the legacy human `reason` string (Chinese, backward compatible). New fields:

| Field           | Role                                                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `reason_code`   | First stable code                                                                                                                               |
| `reason_codes`  | All codes for the branch (attention may append `profile_not_configured`)                                                                        |
| `reason_params` | JSON-safe interpolation (`blocker_count`, `due_decision_count`, `at_risk_release_count`, `portfolio_bucket`, `lifecycle_stage`, `cadence_days`) |
| `is_manual`     | Valid unexpired manual override                                                                                                                 |

Frontend `useStudioHealthReasonText` translates `studio.health.reason.{code}` with `reason_params`. Manual override (`is_manual` or code `manual_override`) shows `reason` verbatim in every language. `manual_override` is intentionally absent from `studio.health.reason`.

Codes present in `studio.health.reason`: `paused_bucket`, `focus_bucket_expected`, `focus_statement_expected`, `not_marked_to_advance`, `blocked_by_risks`, `due_decisions`, `at_risk_releases`, `profile_not_configured`, `stale_beyond_cadence`, `on_track_cadence_normal`.

Live sample, `GET /api/studio/workspaces/studio-os/projects/58da0c3c-4ae8-4a5e-8f75-f3b580ebb1a4/overview/` HTTP 200, still carries:

```json
{
  "status": "BLOCKED",
  "reason": "存在 1 项未解决的 blocker 风险",
  "reason_code": "blocked_by_risks",
  "reason_codes": ["blocked_by_risks"],
  "reason_params": { "blocker_count": 1 },
  "is_manual": false
}
```

zh-CN UI rendered `存在 1 项未解决的阻塞风险`. en UI rendered `1 unresolved blocker risk`. The legacy Chinese `reason` string is not shown when codes are present.

## DRF exact-match mapping

`getStudioErrorMessage` in `apps/web/core/components/studio/shared/constants.ts` maps these nine English server strings to `studio.api_error.*`. Unknown messages pass through.

| Server string                                                      | Key                                           |
| ------------------------------------------------------------------ | --------------------------------------------- |
| Operator must be an active member of this workspace.               | `studio.api_error.operator_not_member`        |
| A manual health override requires a reason.                        | `studio.api_error.override_reason_required`   |
| A new manual health override must expire in the future.            | `studio.api_error.override_expires_in_past`   |
| Meaningful activity cannot be in the future.                       | `studio.api_error.activity_in_future`         |
| Module must belong to the release project.                         | `studio.api_error.module_project_mismatch`    |
| An active release with this version already exists in the project. | `studio.api_error.duplicate_version`          |
| Project must belong to this workspace.                             | `studio.api_error.project_workspace_mismatch` |
| Owner must be an active member of this workspace.                  | `studio.api_error.owner_not_member`           |
| You do not have permission to perform this action.                 | `studio.api_error.permission_denied`          |

Unmapped `PermissionDenied` strings that still pass through if they surface: `You do not have permission to write to this project.`, `You do not have permission to update this decision.`, `You do not have permission to delete this decision.`, `Only a workspace admin can create a workspace-level decision.`, `Only a workspace admin can move a decision between scopes.`

## Key completeness

`corepack pnpm --filter @plane/i18n check:sync` after this wrap-up: **19 locales, 4,116 keys, 100%**. Previous localization total was 4,104; this wrap-up added 12 `auth.common.*` keys in every locale.

- `studio.json`: 258 keys/file, unchanged this wrap-up.
- New login keys: 12, present in all 19 locales.
- `en` and `zh-CN` values are real translations. The other 17 locales use English fallback for the new keys (same policy as the earlier Studio-related `common.*` / `aria_labels.app_sidebar.*` additions).

## What the user sees now

### Guest `/`, empty `localStorage`, `navigator.language=zh-CN`

Visible first screen is Simplified Chinese except brand / proper names:

- Hero: `在所有维度开展工作。` / `欢迎回到 Plane。`
- Header: `首次使用 Plane？` `注册`
- Form: `邮箱` / `继续`
- Terms: `登录即表示您理解并同意我们的服务条款和隐私政策。`
- Footer: `已有 10,000 多个团队使用 Plane 开展工作`
- Document title: `注册 - Plane` (existing Plane mapping: the sign-in screen’s page title is the opposite-mode action; only the language changed)
- `html lang` stays `"en"` until an explicit `setLanguage` (existing Plane `app/root.tsx` behavior)
- `localStorage.userLanguage` remains unset

Forbidden leftovers from the previous gap (`Work in all dimensions.`, `Welcome back to Plane.`, `Sign up`, `Join 10,000+ teams…`, English terms sentence) are gone. No `studio.*` / `auth.common.*` key leaks.

### Guest `/`, empty `localStorage`, `navigator.language=en-US`

Same layout in English: `Work in all dimensions.` / `Welcome back to Plane.` / `Sign up` / `Email` / `Continue` / `New to Plane?` / terms sentence / `Join 10,000+ teams building with Plane`. No Chinese form or hero copy. Title `Sign up - Plane`.

### Signed-in zh-CN

| Route                                                               | Observed                                                                                                                                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/studio-os/`                                                       | Heading `今日`; relative time `8小时前`; health `已阻塞`                                                                                                            |
| `/studio-os/studio/portfolio`                                       | `项目组合`                                                                                                                                                          |
| `/studio-os/projects/58da0c3c-4ae8-4a5e-8f75-f3b580ebb1a4/overview` | `Plane 执行情况`; health `存在 1 项未解决的阻塞风险`; `编辑项目画像`                                                                                                |
| Login → PATCH profile `zh-CN` → reload                              | Profile `zh-CN`, `localStorage.userLanguage=zh-CN`, Today still `今日`                                                                                              |
| Delete confirm                                                      | Dialog heading `删除风险？`; cancelled; row `上游升级边界尚未固化` still present                                                                                    |
| Validation toast                                                    | Health source `自动` → `已暂停`, whitespace-only override reason, Save: title `需要填写覆盖原因`, message `请在保存前说明为什么需要人工健康覆盖。`; modal not saved |

### Signed-in en

| Route                         | Observed                                                                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/studio-os/`                 | Heading `Today`; relative time `8 hours ago`; health `Blocked`; no Studio chrome in Chinese                                                                                              |
| `/studio-os/studio/portfolio` | `Portfolio`                                                                                                                                                                              |
| Overview                      | `Plane execution`; `1 unresolved blocker risk` (not the API Chinese `reason`); user data remains Chinese (`完成 Plane CE 阶段 1…`, `上游升级边界尚未固化`, `确定 Plane CE 长期升级边界`) |
| PATCH `en` → reload           | Profile `en`, `localStorage.userLanguage=en`                                                                                                                                             |
| Restore                       | PATCH `zh-CN` → reload: profile `zh-CN`, `userLanguage=zh-CN`, Today `今日`                                                                                                              |

Studio HTTP captured on these routes: `GET` `/api/studio/workspaces/studio-os/today/`, `.../portfolio/`, `.../projects/58da0c3c-4ae8-4a5e-8f75-f3b580ebb1a4/overview/` all **200**. No Studio 4xx/5xx in the captured run.

Console: v1.4.2 hydration fallback (known exception) plus existing Vite module-externalized warnings in the dev server. No new Studio-only console error class.

Guest `html` `lang` stays `"en"` until an explicit `setLanguage` / `changeLanguage` call.

## Screenshot index (10)

Eight surfaces from the previous localization round were not overwritten (mtime 2026-08-30). Two sign-in captures were **replaced** 2026-08-31 after the login copy close-out, `deviceScaleFactor=1`. Guest sign-in metrics: desktop `innerWidth=1440`, `documentWidth=1440`, `bodyWidth=1440`; mobile `390` / `390` / `390`. PNG pixel size confirmed `1440×960` and `390×844`. Both new images were opened and inspected: hero, header `注册`, terms, and footer are Chinese.

| Surface              | File                                                                                                                                  | Size     | Notes                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------------------------------------- |
| Guest sign-in, zh-CN | [signin-zh-CN-desktop-1440x960.png](../../docs/screenshots/studio-localization/signin-zh-CN-desktop-1440x960.png)                     | 1440×960 | Replaced this wrap-up                         |
| Guest sign-in, zh-CN | [signin-zh-CN-mobile-390x844.png](../../docs/screenshots/studio-localization/signin-zh-CN-mobile-390x844.png)                         | 390×844  | Replaced this wrap-up; no horizontal overflow |
| Today                | [today-zh-CN-desktop-1440x960.png](../../docs/screenshots/studio-localization/today-zh-CN-desktop-1440x960.png)                       | 1440×960 | Previous round; retained                      |
| Today                | [today-zh-CN-mobile-390x844.png](../../docs/screenshots/studio-localization/today-zh-CN-mobile-390x844.png)                           | 390×844  | Previous round; retained                      |
| Portfolio            | [portfolio-zh-CN-desktop-1440x960.png](../../docs/screenshots/studio-localization/portfolio-zh-CN-desktop-1440x960.png)               | 1440×960 | Previous round; retained                      |
| Portfolio            | [portfolio-zh-CN-mobile-390x844.png](../../docs/screenshots/studio-localization/portfolio-zh-CN-mobile-390x844.png)                   | 390×844  | Previous round; retained                      |
| Project Overview     | [project-overview-zh-CN-desktop-1440x960.png](../../docs/screenshots/studio-localization/project-overview-zh-CN-desktop-1440x960.png) | 1440×960 | Previous round; retained                      |
| Project Overview     | [project-overview-zh-CN-mobile-390x844.png](../../docs/screenshots/studio-localization/project-overview-zh-CN-mobile-390x844.png)     | 390×844  | Previous round; retained                      |
| Profile form         | [project-form-zh-CN-desktop-1440x960.png](../../docs/screenshots/studio-localization/project-form-zh-CN-desktop-1440x960.png)         | 1440×960 | Previous round; retained                      |
| Workspace sidebar    | [workspace-sidebar-zh-CN-mobile-390x844.png](../../docs/screenshots/studio-localization/workspace-sidebar-zh-CN-mobile-390x844.png)   | 390×844  | Previous round; retained                      |

## Remaining English, by category

Not “scan passed”. Each item is a concrete leftover.

### Business enum codes / type constants

Database, API, TypeScript, and routes keep English codes: portfolio buckets (`FOCUS`, `NEXT`, `INCUBATING`, `KEEP_ALIVE`, `PAUSED`, `ARCHIVED`), lifecycle stages (`IDEA` … `MAINTENANCE`), health (`ON_TRACK`, `AT_RISK`, `BLOCKED`, `STALE`, `AUTO`), product types, release channel/status, decision status, risk type/status, `reason_code` tokens (`blocked_by_risks`, …), JSON field names, workspace slug `studio-os`, project UUIDs. UI labels are translated; `P0`–`P3` render as `P0`–`P3` in zh-CN by design.

### User data

Shown unchanged in every language: project names `Studio OS`, `Xyora`, `WeatherRE`; identifiers `SOS` / `XYO` / `WRE`; workspace name `Studio Workspace`; focus statements `完成 Plane CE 阶段 1 原生纵切面并等待 Visual GO。` and `完成家庭同步实机证据并形成下一版候选。`; decision title `确定 Plane CE 长期升级边界` and its question; risk title `上游升级边界尚未固化`; work item `Close Phase 1 Visual GO evidence`; release `Xyora 0.6.0`.

### English translation resources

- `studio.json` in the 17 non-`en` / non-`zh-CN` locales is English fallback, key-for-key with `en` (258 keys each).
- New `common.*` / `aria_labels.app_sidebar.*` / `auth.common.*` login keys in those 17 locales are English fallback.
- zh-CN Studio copy keeps the product word `Focus` in mixed strings (`暂无有效 Focus`, `当前 Focus`, `已有明确 Focus`).
- Brand marks stay Latin: `Plane`, `Studio`, `GitHub`.
- Sign-in email placeholder remains `name@company.com` in zh-CN (`auth.common.email.placeholder`, pre-existing format example, not part of this wrap-up).

### Plane native UI explicitly out of this authorized batch

These were **not** in the login-page close-out and remain as before:

- App rail `Projects` / `Community`; command palette placeholder `Search commands...`.
- Native `datetime-local` control still shows `mm/dd/yyyy` / AM-PM inside the profile modal.
- `html lang="en"` until the user or profile explicitly calls `setLanguage`.
- Pre-existing zh-CN `common.your_profile` / `common.developer` / `common.work_structure` / `common.execution` / `common.administration` still English (not introduced by Studio keys).
- Language picker toasts `Success!` / `Language updated successfully` and placeholder `Select a language` in `language-and-timezone-list.tsx`.
- Native sidebar/work-item/cycle/module/analytics surfaces beyond the keys listed in the namespace boundary.
- Sign-in footer brand logos (Zerodha / Sony / Dolby / Accenture) are marks, not copy.
- Sign-in page `<title>` on `/` is the opposite-mode action (`注册` / `Sign up`) plus ` - Plane`; that pairing is pre-existing Plane behavior.

Closed by this wrap-up (no longer remaining):

- Hardcoded hero `Work in all dimensions.` / `Welcome back to Plane.`
- Header `t("Sign up")` / `t("Sign in")` missing-key fallback
- Footer `Join 10,000+ teams building with Plane`
- Hardcoded Terms of Service / Privacy Policy sentence

### Legacy server strings

API `reason` remains Chinese for compatibility (`存在 1 项未解决的 blocker 风险`, including the English token `blocker`). The UI does not display that string when `reason_code` is present. Unmapped DRF/PermissionDenied sentences listed above pass through if those endpoints error.

## Files touched this wrap-up (login close-out only)

Components (no token/theme/layout structure change):

- `apps/web/core/components/account/auth-forms/auth-header.tsx`
- `apps/web/core/components/auth-screens/header.tsx`
- `apps/web/core/components/auth-screens/footer.tsx`
- `apps/web/core/components/account/terms-and-conditions.tsx`

i18n:

- `packages/i18n/src/locales/{cs,de,en,es,fr,id,it,ja,ko,pl,pt-BR,ro,ru,sk,tr-TR,ua,vi-VN,zh-CN,zh-TW}/auth.json` — 12 keys each

Screenshots replaced: the two sign-in files listed above.

Phase 0/1 Studio implementation, `studio.json`, navigator language resolution, and the earlier `common.*` / `aria_labels.app_sidebar.*` keys were not reworked.

## Commands re-run after the login copy close-out

| Command                                                                                                                                                             | Result                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `corepack pnpm --filter @plane/i18n check:sync`                                                                                                                     | 19 locales, 4,116 keys, 100%                                                                                                                            |
| `corepack pnpm --filter @plane/i18n check:types`                                                                                                                    | pass                                                                                                                                                    |
| `corepack pnpm --filter @plane/i18n check:lint`                                                                                                                     | 3 existing warnings, 0 errors (threshold 9)                                                                                                             |
| `corepack pnpm --filter @plane/i18n build`                                                                                                                          | pass; consumed by the restarted web dev server on :3200                                                                                                 |
| `corepack pnpm --filter web check:types`                                                                                                                            | pass                                                                                                                                                    |
| `corepack pnpm --filter web check:lint`                                                                                                                             | 779 existing warnings, 0 errors (threshold 11957)                                                                                                       |
| `corepack pnpm --filter web build`                                                                                                                                  | pass                                                                                                                                                    |
| `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests/test_health.py plane/studio/tests/test_api.py --no-cov -p no:cacheprovider` | 30 passed (no `--build`)                                                                                                                                |
| `git diff --check`                                                                                                                                                  | clean                                                                                                                                                   |
| Live browser (Playwright Chromium, `deviceScaleFactor=1`)                                                                                                           | Guest zh/en `/`; signed-in zh+en Today / Portfolio / Overview; login; language persist; relative time; delete confirm; validation toast; Studio GET 200 |

## Out of this document / not done

- No Git commit/push (still needs a separate authorization).
- No Phase 2 (full Release/Risk/Decision state machines, Acknowledgement, Milestone, Checklist, StudioEvent, Feedback/Metrics/Experiments/Operations/Timeline/Weekly Review, GitHub ingest, legacy migration, production deploy).
- No visual-regression baseline update.
- `FALLBACK_LANGUAGE` remains `"en"`; an unconditional default of `zh-CN` was not applied.
- Today / Portfolio / Overview were not restyled.

## Codex review request

Authorized Phase 0/1 + localization + login-page close-out is complete and verified on the isolated runtime. Please review once against `evidence.md` (functional Phase 0/1) and this file (i18n, login copy, dual-language browser proof). Do not split into further “wait for review” batches.
