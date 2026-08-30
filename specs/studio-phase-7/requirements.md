# Studio OS Phase 7 Requirements

## Status

Authorized after `studio-phase-6`.

## Observable outcome

The isolated Studio stack has extra permission isolation coverage, a loopback backup drill with evidence, and an operator runbook. Nothing is exposed beyond loopback. Visual-regression baselines and validator-of-validator tests are not part of this phase.

## In

- Extra API tests: Guest cannot convert Feedback to a Work Item; a member of another workspace cannot read this workspace’s operations or feedback
- Isolated Postgres `studio_*` schema dump on compose project `studio-plane-phase1`
- Runbook for start, sign-in, migrate, backup, import, GitHub harness, and tests — loopback only

## Out

Public internet, public hostname, open registration, production user-data path, visual-regression baseline updates, restore onto a second or public database.
