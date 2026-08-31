# Studio OS isolated-stack runbook

Loopback / closed household test only. Compose project `studio-plane-phase1`. API `http://127.0.0.1:8200`. Web `http://127.0.0.1:3200`. Open signup is off. Do not bind a public hostname. Legal gate: `specs/studio-phase-8/legal-gate.md`.

## Start

See `deployments/studio/local/README.md`. Do not stand up a second stack.

## Sign-in

Account `studio.admin@local.test`. Password is only in gitignored `deployments/studio/local/.audit-credentials`. Add the second household member with Plane’s native workspace invite; do not stand up another login system.

## Migrate

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml run --rm migrator
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml restart api
```

## Backup (isolated Postgres)

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml exec -T plane-db \
  pg_dump -U studio_plane -d studio_plane --schema-only -t 'studio_*' > studio-schema.sql
```

Restore is operator-run on this same loopback volume only:

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml exec -T plane-db \
  psql -U studio_plane -d studio_plane < studio-schema.sql
```

Do not restore onto a public host. Do not dump `.audit-credentials`.

## Import

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml exec -T api \
  python manage.py studio_import_legacy \
  --workspace studio-os \
  --fixture /code/plane/studio/fixtures/legacy_studio_export.json \
  --settings=plane.settings.local
```

Add `--apply` only after dry-run counts look right. `--rewrite-plane` is refused.

## GitHub harness

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml exec -T api \
  python manage.py studio_github_harness --slug studio-os --project-id <id> \
  --settings=plane.settings.local
```

Without `STUDIO_GITHUB_WEBHOOK_SECRET` this prints `PENDING_EXTERNAL_CREDENTIAL`.

## Tests

```bash
docker compose -f docker-compose-test.yml run --rm api-tests \
  pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db
```
