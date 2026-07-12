from __future__ import annotations

from app.schemas.common import CamelModel


class AnalyticsPoint(CamelModel):
    date: str
    value: int


class LabelCount(CamelModel):
    label: str
    count: int


class AnalyticsOverview(CamelModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    completion_rate: int
    avg_completion_hours: float
    status_distribution: list[LabelCount]
    priority_distribution: list[LabelCount]
    completed_per_day: list[AnalyticsPoint]
    hours_per_day: list[AnalyticsPoint]
