from __future__ import annotations

from fastapi import HTTPException, status


class AppError(HTTPException):
    """Base application error mapped to an HTTP response."""

    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class ConflictError(AppError):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(status.HTTP_409_CONFLICT, detail)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(status.HTTP_401_UNAUTHORIZED, detail)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Not enough permissions") -> None:
        super().__init__(status.HTTP_403_FORBIDDEN, detail)


class BadRequestError(AppError):
    def __init__(self, detail: str = "Invalid request") -> None:
        super().__init__(status.HTTP_400_BAD_REQUEST, detail)
