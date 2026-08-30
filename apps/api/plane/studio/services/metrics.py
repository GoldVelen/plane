# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

MIN_LINE_POINTS = 3


def should_draw_line(point_count):
    return int(point_count or 0) >= MIN_LINE_POINTS


def metric_series_payload(snapshots):
    points = [
        {
            "id": str(snapshot.id),
            "captured_at": snapshot.captured_at.isoformat() if snapshot.captured_at else None,
            "numeric_value": snapshot.numeric_value,
            "text_value": snapshot.text_value,
            "note": snapshot.note,
        }
        for snapshot in snapshots
        if snapshot.numeric_value is not None
    ]
    point_count = len(points)
    return {
        "point_count": point_count,
        "draws_line": should_draw_line(point_count),
        "min_line_points": MIN_LINE_POINTS,
        "points": points,
    }
