# Studio OS Phase 0-1 acceptance evidence

This file records evidence from the isolated local runtime. It is not a Visual GO decision or a visual-regression baseline.

## Baseline and runtime

- Fork baseline: Plane CE `v1.4.2` at `5f7d92784c403f76284f0f16718f320221dc7fec`.
- Remotes: writable `origin` is `GoldVelen/plane`; official `upstream` has push disabled.
- Isolated services: one API, one Celery worker service, one Celery beat service, Postgres, Valkey, RabbitMQ, and MinIO under Compose project `studio-plane-phase1`.
- Migration: `studio.0001_initial` is applied in the real database.
- Active data after temporary CRUD cleanup: 3 Plane projects, 3 Studio profiles, 1 release, 1 decision, and 1 risk.

## Real data closure

- Today returns HTTP 200 and projects `XYO` and `SOS` as focus projects, `SOS` as blocked attention, Xyora `0.6.0` as the upcoming release, the Plane upgrade-boundary decision, and native work item `XYO-1` as cross-project work.
- Portfolio returns HTTP 200 for all three real Plane projects.
- `WRE` is `KEEP_ALIVE` + `MAINTENANCE`, has old explicit activity, and evaluates to `ON_TRACK` with `expected_to_advance=false`; inactivity alone does not mark it stale.
- `SOS` is `FOCUS` + `BUILD`, has an unresolved blocker risk, and evaluates to `BLOCKED` with a concrete reason.
- Project Overview returns native Plane work-item/cycle/module counts plus durable Studio release, decision, and risk records.
- Direct API CRUD proof for Release, Decision, and Risk: create 201, update 200, delete 204, and read-after-delete 404.
- Browser-driven Release CRUD proof through the real Plane UI: POST 201, PATCH 200, DELETE 204; the temporary record is absent after cleanup.
- Unauthenticated Studio API access returns 401; membership and write-role boundaries are covered by the focused API tests.
- The real worker received project-visit tasks and Studio soft-delete tasks; the latter referenced the temporary `studio.StudioRelease` rows created by UI verification.

## Browser and responsive evidence

- Today, Portfolio, and Project Overview were loaded from the live API with no HTTP 4xx/5xx responses.
- At 1440×960 and 390×844, document width equals viewport width on all three routes.
- The native sidebar starts collapsed below 768px, can be opened with Plane's existing toggle, and does not squeeze the mobile working view.
- Browser proof with a persisted expanded desktop preference (`false`): the 390px route started with a collapsed overlay and retained `false`; reloading at 1440px restored the 250px expanded desktop sidebar. Mobile auto-collapse therefore does not replace the desktop preference.
- Project switching was performed through the native accordion/sidebar: Studio OS to Xyora Overview, ending at the real Xyora project URL.
- Plane CE `v1.4.2` emits an existing client-only hydration fallback warning from the unchanged root/HydrateFallback path in both native and Studio routes. It replaces the initial shell with client content without a failed Studio request; this Phase 1 does not modify that core rendering path.

| Surface           | Desktop                                                                                         | Mobile                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Today             | [1440×960](../../docs/screenshots/studio-phase-1/today-desktop-1440x960.png)                    | [390×844](../../docs/screenshots/studio-phase-1/today-mobile-390x844.png)                        |
| Portfolio         | [1440×960](../../docs/screenshots/studio-phase-1/portfolio-desktop-1440x960.png)                | [390×844](../../docs/screenshots/studio-phase-1/portfolio-mobile-390x844.png)                    |
| Project Overview  | [1440×960](../../docs/screenshots/studio-phase-1/project-overview-desktop-1440x960.png)         | [390×844](../../docs/screenshots/studio-phase-1/project-overview-mobile-390x844.png)             |
| Workspace Sidebar | visible in desktop surfaces                                                                     | [390×844 open state](../../docs/screenshots/studio-phase-1/workspace-sidebar-mobile-390x844.png) |
| Project switching | [Studio OS to Xyora](../../docs/screenshots/studio-phase-1/project-switch-desktop-1440x960.png) | native sidebar closes after navigation                                                           |

## Verification gates

- Focused Studio API and health tests pass 17/17, including real CRUD, workspace permissions, contextual health, and progress-anchor reset coverage.
- Django system check passes and `makemigrations --check --dry-run` reports no model drift.
- Ruff passes for `plane/studio`; Web type checking and the production build pass.
- Web lint completes with no errors; its warnings are the existing repository warning set and remain within the configured threshold.
- `git diff --check` passes.

## Deliberate stop boundary

- No Plane UI token, theme value, Propel/UI visual primitive, generic component styling, or core Plane data model was changed. The only shell-level behavior change is the documented mobile sidebar initialization/persistence correction.
- No Acknowledgement, Milestone, Checklist, Event, full state machine, GitHub integration, or other Phase 2 module was implemented.
- No implementation commit, push, baseline update, deployment, or external-system write has been performed.
- Phase 2 remains blocked on explicit Visual GO.
