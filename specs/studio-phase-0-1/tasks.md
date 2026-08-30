# Studio OS Phase 0-1 Implementation Plan

- [x] 1. Create and pin the formal fork
  - Create `GoldVelen/plane` and local checkout.
  - Configure `origin`, read-only `upstream`, `v1.4.2`, and the implementation branch.
  - _Requirements: R1_

- [x] 2. Reproduce Plane CE build and isolated signed-in runtime
  - Install the pinned pnpm workspace.
  - Run baseline checks/builds required for the touched apps.
  - Start an isolated source-backed Plane runtime without changing the existing Studio OS instance.
  - Establish an authorized test account and audit native CE flows.
  - _Requirements: R1, R2_

- [x] 3. Add the Phase 1 Studio backend
  - Register `plane.studio` and its URL namespace.
  - Add Project Profile, Release, Decision, and Risk models/migration.
  - Add scoped serializers/views and basic CRUD.
  - Add Today, Portfolio, and Project Overview projections.
  - _Requirements: R3, R4, R6, R7, R8, R9_

- [x] 4. Implement contextual Health
  - Implement expectation, activity, cadence, risk, and override semantics.
  - Add table-driven exemption and stale tests.
  - Expose structured evidence in projection responses.
  - _Requirements: R5_

- [x] 5. Add Studio routes and Plane-native UI
  - Add a Studio sidebar section and Project Overview tab.
  - Add Today, Portfolio, and Project Overview pages using Plane primitives.
  - Add real loading, empty, error, retry, and CRUD modal flows needed to create Phase 1 data.
  - Preserve project switching and responsive navigation.
  - _Requirements: R3, R4, R6, R7, R8, R9, R10_

- [x] 6. Verify the real data closure
  - Apply migrations to the isolated database.
  - Create a representative dataset through real APIs/UI.
  - Verify rows, permissions, CRUD, projections, and failures.
  - _Requirements: R3, R4, R5, R6, R7, R8_

- [x] 7. Build and visually inspect
  - Run focused backend tests, frontend lint/types/build, and adjacent native route smoke tests.
  - Capture 1440×960 and 390×844 Today, Portfolio, and Project Overview.
  - Capture Workspace Sidebar, Project Tabs, and project-switch evidence.
  - Inspect hierarchy, density, alignment, overflow, empty/error/loading states, and console output.
  - _Requirements: R2, R9, R10, R11_

- [x] 8. Stop at Visual GO
  - Report user-visible functionality, runtime/API/database evidence, screenshots, and remaining gaps.
  - Do not commit, push implementation, update baselines, or begin Phase 2 without separate authorization/Visual GO.
  - _Requirements: R11_
