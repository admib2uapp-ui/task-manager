from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """Base schema: (de)serialises using camelCase aliases.

    FastAPI serialises responses ``by_alias`` by default, so the API speaks
    camelCase to the TypeScript frontend while models stay snake_case in Python.
    ``populate_by_name`` keeps snake_case input valid too.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
    )


class ORMModel(CamelModel):
    """CamelModel that can be built from ORM instances."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class MessageResponse(CamelModel):
    message: str


class HealthResponse(CamelModel):
    status: str
    environment: str
    version: str
    time: datetime


class DBHealthResponse(CamelModel):
    database: str
    detail: str | None = None
