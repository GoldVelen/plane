# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from datetime import timedelta

from django.utils import timezone


def monday_of(value=None):
    current = value or timezone.localdate()
    return current - timedelta(days=current.weekday())
