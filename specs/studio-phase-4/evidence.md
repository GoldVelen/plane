# Studio OS Phase 4 evidence

Cadence slice verified on 2026-08-31.

## Capability

- Metric create + 1–2 snapshots: `series.draws_line` is false. Third snapshot: true.
- Timeline GET includes newly written `metric_snapshot` StudioEvent rows.
- Weekly Review POST writes 复盘 / 健康 / 重点 / 风险 / 下一步; later GET current returns the same row.
- Today `cadence` answers 重点、风险、下一步 from that write-back.
- Creating a Cycle does not insert a Weekly Review.

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests --no-cov -p no:cacheprovider --create-db`

42 passed.

## Live isolated API

`studio.0004_cadence` applied on `studio-plane-phase1`. Two authenticated passes against `http://127.0.0.1:8200`:

- Metric `201`, three snapshots, `draws_line: true`, `point_count: 3`
- Weekly Review write-back returned by `/weekly-reviews/current/`
- Timeline `200` includes `metric_snapshot`
- Today `cadence.focus/risks/next_steps` match the write-back

## i18n / web

`check:sync` 19 locales, 4,298 keys, 100%. `web check:types` ok. `web check:lint` 0 errors. `git diff --check` ok.

## Out of this tag

GitHub, legacy import, hardening extras, production deploy.
