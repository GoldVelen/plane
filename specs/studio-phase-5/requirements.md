# Studio OS Phase 5 Requirements

## Status

Authorized after `studio-phase-4`.

## Observable outcome

Studio has its own read-only GitHub collector for PR / CI / Release / last commit projections with `captured_at`. Webhook deliveries are signature-verified and deduped. Without GitHub App credentials the UI and API show `PENDING_EXTERNAL_CREDENTIAL` and never pretend to be connected. A local harness exists.

## In

- Binding + projection + delivery models
- HMAC SHA-256 webhook verify
- Delivery id dedup
- Celery task no-op without credentials
- Management command harness
- Overview GitHub facts panel

## Out

Plane Commercial GitHub integration, write/merge permission, pretending a live App is connected.
