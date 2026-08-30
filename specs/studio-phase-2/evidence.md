# Studio OS Phase 2 evidence

Governance slice verified on 2026-08-31.

## Capability

- Release / Risk / Decision / Milestone transition graphs reject illegal status jumps (HTTP 400).
- Decision `BOTH_REQUIRED` cannot enter `DECIDED` until two `APPROVED` acknowledgements exist.
- Creating a release for a `WEB_APP` profile instantiates 11 checklist items; toggling an item sets `done_at`.
- Milestones persist on the project and appear on Overview.
- Mutations write append-only `StudioEvent` rows, listed on Overview and `GET .../events/`.

## Tests

`docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/studio/tests/test_governance.py plane/studio/tests/test_api.py plane/studio/tests/test_health.py --no-cov -p no:cacheprovider --create-db`

34 passed.

Live isolated API applied `studio.0002_governance`.

## Out of this tag

Feedback, Operations, Experiments, Metrics, Timeline, Weekly Review, GitHub, legacy import, production deploy.
