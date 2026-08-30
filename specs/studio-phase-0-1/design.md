# Studio OS Phase 0-1 Design

## Architecture

Studio is an internal Plane Django/Web namespace, not a parallel service.

```text
Plane Web routes and shell
  -> Studio React pages/components
  -> /api/studio/workspaces/:workspace_slug/...
  -> plane.studio Django views/services
  -> Plane PostgreSQL studio_* tables + Plane db models
```

The implementation reuses Plane sessions, membership permissions, API error handling, Celery boundary, SWR/services, Propel/UI components, themes, and responsive shell.

## Backend namespace

```text
apps/api/plane/studio/
  apps.py
  models.py
  serializers.py
  services/
    health.py
    projections.py
  views.py
  urls.py
  migrations/
  tests/
```

Only two existing backend files are wired:

- `apps/api/plane/settings/common.py` registers `plane.studio`.
- `apps/api/plane/urls.py` includes `/api/studio/`.

## Phase 1 models

All models reuse Plane `BaseModel`, `WorkspaceBaseModel`, or `ProjectBaseModel`, explicitly set `db_table = "studio_*"`, and use Plane User/Workspace/Project/Module foreign keys.

### StudioProjectProfile

- `project`, `workspace`
- `product_type`
- `portfolio_bucket`: FOCUS / NEXT / INCUBATING / KEEP_ALIVE / PAUSED / ARCHIVED
- `lifecycle_stage`: IDEA / RESEARCH / VALIDATED / DESIGN / BUILD / TEST / RELEASE_READY / LIVE / GROWTH / MAINTENANCE
- `priority`: P0 / P1 / P2 / P3
- `operator` (optional Plane User)
- `focus_statement`
- `expected_update_interval_days` (1–365)
- `progress_expected_since`
- `last_meaningful_activity_at` (optional explicit operating update)
- `manual_health`, `manual_health_reason`, `manual_health_expires_at`
- one active row per Plane Project via a conditional unique constraint

### StudioRelease

- required Plane Project/Workspace
- optional Plane Module
- `name`, `version`, `channel`, `status`
- `target_at`, `released_at`, `scope_summary`
- one active version value per project
- Phase 1 accepts valid enum values through normal CRUD; transition graph and checklist belong to Phase 2

### StudioDecision

- required Workspace; optional Project
- `title`, `question`, `context`, `recommendation`, `final_decision`
- `status`, `due_at`, `decided_at`
- proposer uses a Plane User
- acknowledgements and options belong to Phase 2

### StudioRisk

- required Project/Workspace
- `type`, `title`, `description`
- `probability` and `impact` (1–5), derived integer `score`
- `is_blocker`, `status`, `mitigation`, optional owner and due date
- full transition validation belongs to Phase 2

## Health semantics

The health service is a pure decision function plus a query adapter.

### Advancement expectation

```text
never expected: bucket in {PAUSED, ARCHIVED}
expected: bucket == FOCUS OR focus_statement is non-empty
not expected by inactivity alone: NEXT, INCUBATING, KEEP_ALIVE
LIVE/MAINTENANCE: only expected when FOCUS or explicitly focused
```

`progress_expected_since` is set when an expectation begins. Recent meaningful activity is the maximum of:

- explicit `last_meaningful_activity_at`;
- latest relevant Plane Work Item/Module update;
- latest Studio Release/Decision/Risk update.

Profile metadata edits do not silently count as product progress.

### Precedence

1. PAUSED/ARCHIVED -> PAUSED, no inactivity attention.
2. Valid manual override -> effective health result, retaining computed evidence separately.
3. Open blocker -> BLOCKED.
4. Explicit due/release risk -> AT_RISK.
5. Expected to advance and cadence missed -> STALE.
6. Otherwise -> ON_TRACK.

Every non-ON_TRACK result includes structured evidence and a human-readable reason.

## API surface

```text
GET/PATCH  /api/studio/workspaces/:slug/projects/:project_id/profile/
GET/POST   /api/studio/workspaces/:slug/projects/:project_id/releases/
GET/PATCH/DELETE /api/studio/workspaces/:slug/projects/:project_id/releases/:id/
GET/POST   /api/studio/workspaces/:slug/decisions/
GET/PATCH/DELETE /api/studio/workspaces/:slug/decisions/:id/
GET/POST   /api/studio/workspaces/:slug/projects/:project_id/risks/
GET/PATCH/DELETE /api/studio/workspaces/:slug/projects/:project_id/risks/:id/
GET        /api/studio/workspaces/:slug/today/
GET        /api/studio/workspaces/:slug/portfolio/
GET        /api/studio/workspaces/:slug/projects/:project_id/overview/
```

List endpoints support only the filters needed by the Phase 1 screens. No generic query framework is introduced.

## Permissions

- Workspace owner/admin: full Phase 1 CRUD.
- Workspace member with project membership: read and scoped write where Plane project permission allows.
- Guest: read only when the Plane project is visible to that guest.
- Object queries always include workspace and project scope before lookup.

Exact behavior follows existing Plane permission decorators/helpers; Studio does not duplicate session or membership logic.

## Frontend namespace

```text
apps/web/core/components/studio/
  navigation/
  today/
  portfolio/
  project-overview/
  shared/
apps/web/core/services/studio/
apps/web/app/(all)/[workspaceSlug]/(projects)/studio/...
apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/overview/...
```

Existing-file touch points are limited to:

- `apps/web/app/routes/extended.ts`
- `apps/web/core/components/home/root.tsx`
- `apps/web/core/components/workspace/sidebar/sidebar-menu-items.tsx`
- `apps/web/core/components/navigation/use-navigation-items.ts`
- `apps/web/core/components/workspace/sidebar/projects-list-item.tsx`

One narrow Plane-shell behavior correction is also required in `apps/web/core/lib/wrappers/store-wrapper.tsx` and `apps/web/core/store/theme.store.ts`: the initial sidebar state resolves to collapsed below 768px, while mobile overlay changes remain transient and never replace the persisted desktop preference. Plane previously raced its persisted desktop preference against the mobile auto-collapse effect, leaving a 390px workspace squeezed behind a 250px sidebar. Studio pages cannot safely correct a workspace-shell width race from inside their route content. This changes no token, theme value, or component styling and preserves the native sidebar/toggle interaction.

Overview already exists in Plane's hard-coded tab URL map, so Phase 1 does not need to modify global tab URL behavior. Project switching is explicitly browser-tested.

## Design specification

- Purpose: operating visibility inside Plane, using real Plane and Studio facts.
- Aesthetic: Plane's existing utilitarian workspace UI; no Studio visual brand.
- Colors: only Plane semantic tokens; no new literal palette and no global token edit.
- Typography: Plane's Inter Variable and IBM Plex Mono.
- Layout: Plane workspace shell, sidebar groups, project header/tabs, compact lists/tables, native Modal/Empty State/Skeleton.
- Icons: existing `@plane/propel/icons` only.
- Responsive: Plane breakpoints and mobile shell; priority is reordered rather than desktop columns overflowing.

This project-level design system overrides generic prototype advice to choose a new palette/font or break the grid.

## Real-data strategy

Phase 1 test data is inserted through authenticated Studio CRUD and native Plane API/UI, never embedded in React fixtures. Screens query the same endpoints used for manual interaction. Empty states are verified separately after data-backed screenshots.

## Verification

- Django model/serializer/service/API unit tests, including cross-workspace denial.
- Health table tests covering FOCUS stale and all inactivity exemptions.
- Migration check and isolated PostgreSQL migration.
- Frontend typecheck/lint/build for changed packages.
- Authenticated API CRUD against the isolated runtime.
- Browser flows for Today, Portfolio, Overview, Sidebar, Tabs, project switching, permissions, empty/loading/error states.
- 1440×960 and 390×844 screenshots from the same real dataset.

## Stop condition

After Phase 1 evidence and screenshots are prepared, no Phase 2 model, API, route, or UI may be added before explicit Visual GO.
