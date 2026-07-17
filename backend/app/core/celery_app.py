from __future__ import annotations

from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "orbit",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    task_time_limit=3600,
    task_soft_time_limit=3300,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
