# Studio OS Phase 5 evidence

GitHub read-only facts verified on 2026-08-31.

## Capability

- GET GitHub status without credentials: `PENDING_EXTERNAL_CREDENTIAL`, `connected: false`.
- Unsigned / wrong-signature webhook: HTTP 401, no projection rows.
- Signed push webhook: 202, projection includes `captured_at`; same `X-GitHub-Delivery` is processed once.
- Overview `github` payload matches that pending status.
- Harness `studio_github_harness` prints `PENDING_EXTERNAL_CREDENTIAL` when `STUDIO_GITHUB_WEBHOOK_SECRET` is absent.

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db`

45 passed.

## Live isolated API

`studio.0005_github` applied. Two authenticated passes:

- GitHub GET `200` status `PENDING_EXTERNAL_CREDENTIAL` `connected: false`
- Unsigned webhook `401`
- Overview `github.connected: false`

Harness:

```
PENDING_EXTERNAL_CREDENTIAL
No STUDIO_GITHUB_WEBHOOK_SECRET; harness cannot sign a webhook.
collector_status=PENDING_EXTERNAL_CREDENTIAL
```

## i18n / web

`check:sync` 19 locales, 4,311 keys, 100%. types ok. lint 0 errors. `git diff --check` ok.

## Out of this tag

Live GitHub App collection, write/merge, public deploy, legacy import.
