# Studio OS Phase 7 evidence

Hardening verified on 2026-08-31.

## Capability

- Guest POST convert is HTTP 403; `linked_issue_id` stays null.
- A user who is only a member of another workspace gets HTTP 403 on this workspace’s operations and project feedback.
- Unauthenticated live convert / operations / feedback are HTTP 401; Feedback status stays `INBOX` and `linked_issue_id` stays null after the rejected convert.
- Isolated `pg_dump --schema-only -t 'studio_*'` contains `CREATE TABLE` for Studio operating, cadence, GitHub, and import tables.
- Runbook: `specs/studio-phase-7/runbook.md` (loopback compose `studio-plane-phase1` only).

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db`

48 passed, including `test_hardening.py::test_guest_cannot_convert_and_outsider_cannot_read_workspace_operations`.

## Live isolated API

Two authenticated passes as `studio.admin@local.test` against `http://127.0.0.1:8200`, workspace `studio-os`, project `58da0c3c-4ae8-4a5e-8f75-f3b580ebb1a4`:

| Check                                           | Pass 1                                             | Pass 2                                             |
| ----------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| Unauthenticated operations / feedback / convert | 401                                                | 401                                                |
| Unsigned GitHub webhook                         | 401                                                | 401                                                |
| Operations 200 with real Feedback ids           | yes (`17c73f6c…` and earlier)                      | yes (`d7ce8c9f…` and earlier)                      |
| Feedback create                                 | 201 `INBOX` `d7ce8c9f-3f0a-4bdf-8a1b-28ca28b699b3` | 201 `INBOX` `1ffd058b-052c-41b6-8b26-0c496d740544` |
| After unauth convert                            | `linked_issue_id` null, status `INBOX`             | same                                               |
| GitHub                                          | `PENDING_EXTERNAL_CREDENTIAL` `connected: false`   | same                                               |

Pass 1 created Feedback `d7ce8c9f-3f0a-4bdf-8a1b-28ca28b699b3`. Pass 2 created `1ffd058b-052c-41b6-8b26-0c496d740544`. Both remain unconverted.

## Backup drill

Isolated dump of `studio_*` schema. Tables present include:

`studio_content_items`, `studio_decisions`, `studio_events`, `studio_experiments`, `studio_feedback`, `studio_github_bindings`, `studio_github_deliveries`, `studio_github_projections`, `studio_import_maps`, `studio_metric_definitions`, `studio_metric_snapshots`, `studio_milestones`, `studio_project_profiles`, `studio_releases`, `studio_risks`, `studio_routines`, `studio_weekly_reviews`.

Live row counts at dump time: `studio_feedback` 3, `studio_experiments` 3, `issues` 10, `projects` 4.

Restore is documented in the runbook for this same loopback volume only. It was **not** executed against a second database.

## i18n / web

This phase added no UI strings or web routes. `git diff --check` ok.

## Out of this tag

Public deploy, public hostname, open registration, live restore onto another database.
