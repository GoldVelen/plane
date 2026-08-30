# Studio OS Phase 3 evidence

Operating loop verified on 2026-08-31.

## Capability

- Feedback create starts at `INBOX`. `INBOX → RESOLVED` is HTTP 400 and the current status is kept.
- Legal path `INBOX → TRIAGED → PLANNED → RESOLVED` persists.
- Convert creates one Plane `Issue`, stores `linked_issue_id` on the Studio record, does not change Feedback status, and a second convert returns the same Issue id.
- Convert failure (Issue create error) returns HTTP 400, status stays `INBOX`, no fake link.
- Experiment `DRAFT → COMPLETED` is HTTP 400; `DRAFT → RUNNING → COMPLETED` succeeds. Guest POST/PATCH is 403; guest can still GET operations.
- Workspace Studio nav and project tab `operations` share the existing navigation registry and `getTabUrl`. Intake remains task capture.

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db`

38 passed.

## Live isolated API

Compose project `studio-plane-phase1` applied `studio.0003_operations`. Authenticated as `studio.admin@local.test` against `http://127.0.0.1:8200` twice:

- Create Feedback `201` `INBOX`
- Illegal jump `400`, status remains `INBOX`
- Legal `TRIAGED` `200`
- Convert `200` with a real `linked_issue_id`
- Experiment / content / routine `201`
- Operations and Overview `200` include the created Feedback id
- Today `200`

Illegal-transition `400` is the published graph, not a service defect.

## i18n / web

`corepack pnpm --filter @plane/i18n check:sync` — 19 locales, 4,269 keys, 100%.
`corepack pnpm --filter @plane/i18n build` — ok.
`corepack pnpm --filter web check:types` — ok.
`corepack pnpm --filter web check:lint` — 0 errors.
`git diff --check` — ok.

## Out of this tag

Metrics, Timeline, Weekly Review, GitHub, legacy import, production deploy.
