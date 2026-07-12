from __future__ import annotations

import asyncio
import uuid
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    """In-memory pub/sub of workspace WebSocket connections.

    Messages are broadcast to every socket in a workspace so clients can
    invalidate their caches and refetch (last-write-wins, no payload trust).
    """

    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, workspace_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections[workspace_id].add(websocket)

    async def disconnect(self, workspace_id: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[workspace_id].discard(websocket)

    async def broadcast(self, workspace_id: str, message: dict) -> None:
        for websocket in list(self._connections.get(workspace_id, ())):
            try:
                await websocket.send_json(message)
            except Exception:  # noqa: BLE001 - drop dead sockets
                await self.disconnect(workspace_id, websocket)


manager = ConnectionManager()


async def publish_invalidate(workspace_id: uuid.UUID, scope: str = "tasks") -> None:
    """Notify a workspace that data changed and clients should refetch."""
    await manager.broadcast(str(workspace_id), {"type": "invalidate", "scope": scope})
