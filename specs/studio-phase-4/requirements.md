# Studio OS Phase 4 Requirements

## Status

Authorized after `studio-phase-3`.

## Observable outcome

A workspace member can define a metric, add manual snapshots, and see a line only after three numeric points; open a Timeline of StudioEvent rows; write back Weekly Review 复盘 / 健康 / 重点 / 风险 / 下一步; and read those answers on Today. Creating a Plane Cycle does not create a Weekly Review.

## In

- Metric definitions and manual snapshots
- `draws_line` only when `point_count >= 3`
- Timeline over existing StudioEvent
- Weekly Review write-back
- Today cadence block: 重点、风险、下一步

## Out

GitHub App, public deploy, a second activity-stream engine, treating Cycles as Weekly Review.
