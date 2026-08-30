# Studio OS Phase 6 evidence

Legacy import verified on 2026-08-31.

## Capability

- Dry-run reports would-create counts and writes zero Studio rows.
- `--apply` creates Feedback / Experiment / Content / Routine rows mapped by project identifier.
- Plane `Project` and `Issue` counts are unchanged; project names are unchanged.
- Fixture `plane_projects` is counted as `refused_plane_rewrites`.
- `--rewrite-plane` raises `Refusing to rewrite Plane Project or Issue rows.`
- Re-apply is idempotent via `StudioImportMap`.

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db`

47 passed.

## Live isolated command

`studio.0006_import_map` applied. Workspace `studio-os`, project identifier `SOS`:

Dry-run: created 1/1/1/1, plane projects 3→3, issues 3→3, `refused_plane_rewrites: 1`.

Apply: same created counts, plane counts still 3/3.

The live legacy Studio OS Postgres was not required; the committed fixture is the verifiable source. Connecting a real legacy DSN remains an operator step.

## Gap

No live legacy Postgres was attached in this environment. The command is fixture-driven; a future `--legacy-dsn` can be added when that database is reachable without changing the no-Plane-rewrite rule.
