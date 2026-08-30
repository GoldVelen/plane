# Studio OS Phase 3 Requirements

## Status

Authorized 2026-08-31 after Phase 2 tag `studio-phase-2`.

## Observable outcome

A workspace member can open Studio Operations from the workspace sidebar and the project tab (the existing navigation registry plus `getTabUrl`), create Feedback, move it only along `INBOX → TRIAGED → PLANNED → RESOLVED / WONT_DO / DUPLICATE`, run Content / Routine / Experiment records, convert those operating records into a real Plane Work Item while storing only a Work Item reference, and see the same persisted rows on Project Overview.

## In

- `StudioFeedback`, `StudioContentItem`, `StudioRoutine`, `StudioExperiment`
- Feedback and Experiment transition graphs
- Convert-to-Work-Item is idempotent; convert failure does not change status and does not invent a link
- Workspace `/studio/operations` and project `/operations` tab
- Overview surfaces operating counts and recent feedback
- API tests for illegal jumps, convert idempotency, convert failure, guest write denial

## Out

Metrics charts, Timeline, Weekly Review, GitHub, legacy import, production deploy.
