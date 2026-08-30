# Studio OS Phase 6 Requirements

## Status

Authorized after `studio-phase-5`.

## Observable outcome

A management command imports operating records from a legacy Studio OS export into Studio entities. It never rewrites Plane Project or Issue rows, never destructively overwrites existing CE data, and records import evidence.

## In

- `studio_import_legacy` dry-run and `--apply`
- Fixture-based import (legacy Postgres may be absent)
- Idempotent `StudioImportMap`
- Refusal of `--rewrite-plane`

## Out

Rewriting Plane projects/work items, inventing Plane projects when identifiers are missing, live legacy DB success if that database is unreachable.
