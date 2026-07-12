from __future__ import annotations

from app.schemas.common import CamelModel
from app.schemas.project import ProjectRead
from app.schemas.task import TaskRead


class DashboardStats(CamelModel):
    active_projects: int
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    due_today: int
    tracked_today_seconds: int
    completion_rate: int


class DashboardResponse(CamelModel):
    stats: DashboardStats
    today_tasks: list[TaskRead]
    upcoming_deadlines: list[TaskRead]
    recent_projects: list[ProjectRead]
    recent_tasks: list[TaskRead]
