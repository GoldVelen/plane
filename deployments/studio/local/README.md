# Studio OS local runtime

This isolated Compose project is the Phase 0/1 verification environment. It does not share containers, networks, or volumes with another Plane installation.

```bash
cp deployments/studio/local/.env.example deployments/studio/local/.env
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml up -d --build

VITE_API_BASE_URL=http://127.0.0.1:8200 \
VITE_WEB_BASE_URL=http://127.0.0.1:3200 \
pnpm --filter web exec react-router dev --host 127.0.0.1 --port 3200
```

For first-instance setup, run the native Plane admin app on its isolated port:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8200 \
VITE_ADMIN_BASE_URL=http://127.0.0.1:3201 \
VITE_ADMIN_BASE_PATH=/god-mode \
pnpm --filter admin exec react-router dev --host 127.0.0.1 --port 3201
```

Open `http://127.0.0.1:3201/god-mode/`, clear the anonymous telemetry checkbox, and create the local instance administrator. Verify that `is_telemetry_enabled` is false before starting background workers:

```bash
docker compose --env-file deployments/studio/local/.env \
  -f deployments/studio/local/docker-compose.yml --profile workers up -d worker beat-worker
```

The web app is available at `http://127.0.0.1:3200`; the admin app at `http://127.0.0.1:3201/god-mode/`; and the API at `http://127.0.0.1:8200`. The local environment also points OTLP at a closed loopback port and leaves PostHog unconfigured, so a setup mistake cannot send Phase 0/1 data to an external analytics collector.

## Reviewer sign-in

The authorized local test account for sign-in verification is `studio.admin@local.test`. Its password for this isolated instance is stored in `deployments/studio/local/.audit-credentials` (gitignored, mode 600). Read that file, sign in at `http://127.0.0.1:3200/`, and switch the profile language from Profile → Preferences → Language. Do not commit the credentials file; rotate it by resetting the password on the account inside the `studio-plane-phase1` API container.
