# Studio OS Phase 0-1 Requirements

## Status

Approved for implementation on 2026-08-30. Phase 2 is not authorized.

## Observable outcome

Studio OS runs as a native-looking Plane CE extension on the `v1.4.2` fork. A signed-in workspace member can use real Plane and Studio database records to understand focus projects, attention items, upcoming releases, pending decisions, risks, and one project's operating context from Today, Portfolio, and Project Overview.

## Scope

### Phase 0

- Create the real `GoldVelen/plane` fork.
- Keep `origin` on the fork and read-only `upstream` on `makeplane/plane`.
- Base the implementation branch exactly on `v1.4.2` (`5f7d92784c403f76284f0f16718f320221dc7fec`).
- Reproduce the source build and an isolated local runtime.
- Use an authorized local test account to verify the signed-in CE flows for Projects, Work Items, Cycles, Modules, Views, Pages, Search, Notifications, and Analytics.

### Phase 1

- Add `plane.studio` with independent `studio_*` tables in Plane PostgreSQL.
- Add real CRUD for Studio Project Profile, Release, Decision, and Risk.
- Add contextual Health computation based on portfolio bucket, lifecycle, explicit focus, update cadence, and recent meaningful activity.
- Add Today, Portfolio, and Project Overview using real Plane and Studio data.
- Add the Studio workspace sidebar section and Project Overview tab through Plane extension seams.
- Preserve project switching and default-tab behavior.
- Produce desktop and mobile screenshots from the real signed-in runtime.

## Business rules

1. Plane owns users, sessions, workspaces, projects, memberships, Work Items, Cycles, Modules, Views, Pages, Intake, and project execution.
2. Studio owns portfolio bucket, product lifecycle, operating priority, explicit focus, cadence, manual health override, release governance, decisions, and risks.
3. Today and Portfolio are live query projections. They are not separately persisted dashboard snapshots.
4. Phase 1 Release, Decision, and Risk are minimum durable entities with basic CRUD. Full transition validation, acknowledgements, milestones, checklists, and append-only events belong to Phase 2.
5. No page may use fake records or a permanent placeholder. A real empty state is allowed only when it explains which real record is missing and offers the permitted next action.
6. PAUSED and ARCHIVED projects never become STALE. INCUBATING, NEXT, KEEP_ALIVE, LIVE, and MAINTENANCE projects do not become STALE from inactivity alone unless current focus explicitly says the project should advance.
7. A project is expected to advance when it is in FOCUS or has a non-empty focus statement, except PAUSED/ARCHIVED. The lifecycle supplies the reason/context; update cadence supplies the threshold.
8. A never-active project starts its inactivity clock when the expectation to advance begins, not at an arbitrary historical date.
9. Open blocker risks may yield BLOCKED. Due decisions and near-term incomplete releases may yield AT_RISK. STALE is reserved for missed progress cadence while advancement is expected.
10. A valid, unexpired manual health override wins and must include a reason.
11. All Studio API permissions derive from Plane workspace/project membership.
12. Studio may not modify Plane core models, authentication, global theme/tokens, or generic component visual behavior.

## EARS acceptance criteria

### R1 — Fork baseline

When Phase 0 is inspected, the repository shall show `origin` as `GoldVelen/plane`, `upstream` as `makeplane/plane`, and the implementation base as the signed `v1.4.2` commit.

### R2 — Native CE verification

While signed in to the isolated runtime, when the tester opens each audited native capability, Plane shall render the real page or an honest CE empty state without Studio replacing its workflow.

### R3 — Durable Studio entities

When an authorized member creates, reads, updates, or deletes a Release, Decision, or Risk, the API shall operate on `studio_*` PostgreSQL rows and return the persisted result.

### R4 — Project profile

When an authorized member updates portfolio, lifecycle, priority, focus, cadence, or manual health fields, the system shall persist one active Studio profile per Plane Project.

### R5 — Contextual health

When a project is not currently expected to advance, inactivity alone shall not generate STALE; when a FOCUS or explicitly focused project exceeds its cadence without meaningful activity, the system shall return STALE with a human-readable reason.

### R6 — Today

When a member opens Today, the first viewport shall use real data to show Focus Projects, Needs Attention, Upcoming Releases, pending Decisions, and cross-project work or honest empty states.

### R7 — Portfolio

When a member opens Portfolio, the system shall show Plane Projects enriched by Studio profile and computed health, with scan-friendly grouping/filtering and no duplicate Project records.

### R8 — Project Overview

When a member opens Project Overview, the page shall combine the selected Plane Project's native work summary with its real Studio profile, releases, decisions, and risks.

### R9 — Navigation

When Studio routes are enabled, Workspace Sidebar, Project Tabs, and project switching shall preserve Plane's layout, permissions, responsive behavior, and selected/default tab semantics.

### R10 — Visual baseline

While rendering Studio pages, the application shall use Plane semantic tokens, Inter Variable/IBM Plex Mono, Propel/UI primitives, icons, spacing, borders, empty states, modals, and responsive patterns without changing global visual behavior.

### R11 — Evidence and stop gate

When Phase 1 verification completes, the implementation shall provide real runtime/API/database evidence and desktop/mobile screenshots, then stop without Phase 2 implementation until the user gives Visual GO.

## Non-goals

- Full Release/Risk/Decision state machines.
- Decision acknowledgements.
- Milestones, release checklists, or StudioEvent.
- Feedback, Metrics, Experiments, Operations, Timeline, or Weekly Review implementation.
- GitHub fact ingestion.
- Old Studio OS data migration.
- Production deployment.
- Commit or push before separately authorized Git closure.
