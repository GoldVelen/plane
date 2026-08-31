# Studio OS Phase 8 legal gate

Recorded 2026-08-31 after the operator answered the five launch questions. This is **not** a public production authorization and **must not** be tagged as a public deploy.

## Answers

| Question         | Answer                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Project type     | Closed household operating console (Plane CE + Studio layer). Not a public Web/API/AI product.        |
| User data        | Yes. Real personal accounts and project data will enter this instance.                                |
| AI generation    | Needed later: several products are AI-embedded. Commercial key-holding and billing are deferred.      |
| Scale            | Closed test. Current users: two people (operator and spouse).                                         |
| AI key / billing | Undecided. Use the console first, connect own projects, decide commercial policy after it is running. |

## Risk grade

**Medium, closed-test band** (≤100 people, currently 2).

Real personal data plus planned generative AI would be **high** if this instance were offered to the public. It is not. The service is not “向境内公众提供生成式人工智能服务”, so algorithm filing, public watermarks, and a public complaint channel are **not** triggered **while** the instance stays closed.

PIPL / Cybersecurity Law / Data Security Law still apply to the personal accounts you store. Minimum closed-test controls below are mandatory.

## GO

- Keep using the isolated stack on loopback, or later a **private** home LAN / Tailscale-style mesh that is not a public hostname.
- Two Plane-native accounts in one workspace. No second login stack.
- Operate the existing projects and add further Plane projects as native CE projects.
- Backups stay on this machine; credentials stay gitignored.
- Telemetry remains off (PostHog unset, OTLP loopback sink).
- Open registration **off**. Spouse joins by invitation only.

## NO-GO

- Public domain, port-forward to the internet, open signup, or `studio-phase-8` production tag
- Treating Studio OS itself as a public generative-AI service
- Mode B (this instance holds paid third-party keys for anyone else) and billing, until commercial policy is decided
- Sending household personal data to a public analytics collector
- Restoring backups onto a public host

Re-open this gate if any of these happen: public marketing, users beyond a closed household test, paid third-party keys held by this instance, or generative AI offered to people who are not the two operators.

## AI split

Studio OS Plane is the **operating console**. Xyora / WeatherRE / other products are **separate** AI-embedded products.

- Do not add generative AI into this console until the console itself is in daily use.
- When AI is added here, default to **Mode A** (operators’ own keys in env/secret store, never committed).
- AI must not auto-change high-impact operating records (releases, decisions, risks, convert-to-issue).
- Content-labeling rules (effective 2025-09-01) apply to **product** output shown to end users of those apps, not to this private console remaining closed.

## Closed-test minimum

1. `ENABLE_SIGNUP=0`; invite the second person through Plane workspace membership.
2. One workspace. Do not create extra Plane account systems.
3. Store only operating data you need. Do not commit `.env`, `.audit-credentials`, or database dumps.
4. Keep `is_telemetry_enabled` false; keep PostHog empty.
5. Schema/data backups only onto this loopback volume; restore is operator-run and local.
6. GitHub stays `PENDING_EXTERNAL_CREDENTIAL` until a **read-only** token/App exists. No write/merge permission.

## Current live portfolio (already in this instance)

Workspace `studio-os`:

| Identifier | Name      | Role in seed             |
| ---------- | --------- | ------------------------ |
| `SOS`      | Studio OS | FOCUS / BUILD            |
| `XYO`      | Xyora     | FOCUS / TEST             |
| `WRE`      | WeatherRE | KEEP_ALIVE / MAINTENANCE |

Older Studio OS seed names (PulseNote, LoveCloud, HEREVERSE, 巡游历, 拜托拜托, 历史人物性格测试) are **not** in this Plane instance and must not be invented until the operator confirms which ones to create as native Plane projects.
