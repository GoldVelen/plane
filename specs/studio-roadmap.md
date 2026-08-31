# Studio OS Plane fork roadmap

Authoritative phase list for `studio-os-plane`. The standalone `studio-os` Master Plan remains a **semantic** source. Architecture, auth, UI, and Plane integration decisions in `docs/PLANE_CE_AUDIT_AND_REQUIREMENTS_MAPPING.md` (copied as product intent, not as a second runtime) override the old Next.js stack.

Visual GO for continuing past Phase 1 was given on 2026-08-31: complete remaining phases and **commit + tag after each phase**.

Tags live on this repository: `studio-phase-N`.

## Completed

| Tag              | Result                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `studio-phase-0` | Plane CE `v1.4.2` baseline `5f7d92784c403f76284f0f16718f320221dc7fec`                                                                                             |
| `studio-phase-1` | `plane.studio` Profile / Release / Decision / Risk CRUD, contextual Health, Today / Portfolio / Project Overview, zh-CN localization including login first screen |
| `studio-phase-2` | Governance: Release/Risk/Decision transition graphs, Decision options + acknowledgements, Milestone, Release checklist, append-only StudioEvent                   |
| `studio-phase-3` | Operating loop: Feedback inbox, Operations, Experiments, content/routines, convert to Plane Work Item                                                             |
| `studio-phase-4` | Cadence: Metric definitions/snapshots, Timeline on StudioEvent, Weekly Review write-back                                                                          |
| `studio-phase-5` | GitHub read-only facts (PR/CI/release/last commit), webhook verify+dedup, `PENDING_EXTERNAL_CREDENTIAL`                                                           |
| `studio-phase-6` | Legacy Studio OS operating-record import (fixture/dry-run/apply, no Plane rewrite)                                                                                |
| `studio-phase-7` | Hardening: extra permission tests, isolated backup drill, loopback runbook                                                                                        |

## Remaining

Each phase must land a user-visible formal capability on the isolated runtime, with tests, then a commit and tag. Do not re-implement Plane auth, projects, or work items.

| Tag              | Formal capability                                                               | In                                                                                                 | Out                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `studio-phase-8` | Closed household test. Authenticated public reachability is proposed, not live. | Two-person use; 9 Plane projects; review prompt in `specs/studio-phase-8/chatgpt-review-prompt.md` | Open signup, home port-forward of the dev stack, public generative AI, Mode B billing, production tag |

## Hard stops

- Do not create a second account, project, or work-item system.
- Do not change Plane tokens/theme/generic components.
- Production (`studio-phase-8`) is a legal gate. Two-person closed test is authorized. Authenticated public reachability is proposed in `specs/studio-phase-8/chatgpt-review-prompt.md` and is **not live**. Open registration, home port-forward of the dev stack, and public generative AI remain forbidden. See `specs/studio-phase-8/legal-gate.md`.
- GitHub (`studio-phase-5`) may be marked `PENDING_EXTERNAL_CREDENTIAL` if no App credentials exist; the code path and verification harness must still exist.
- Push to `origin` is separate from commit/tag unless explicitly authorized.
