from __future__ import annotations

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.database import SessionLocal
from app.core.ws_manager import manager
from app.services.auth_service import AuthService
from app.services.workspace_service import WorkspaceService

router = APIRouter()


@router.websocket("/ws")
async def workspace_socket(websocket: WebSocket, token: str = Query(...)) -> None:
    async with SessionLocal() as session:
        try:
            user = await AuthService(session).get_user_from_access_token(token)
            workspace = await WorkspaceService(session).get_default(user)
        except Exception:  # noqa: BLE001 - reject unauthenticated sockets
            await websocket.close(code=1008)
            return
        workspace_id = str(workspace.id)

    await manager.connect(workspace_id, websocket)
    try:
        while True:
            # Client messages are ignored; the socket is a one-way notifier.
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(workspace_id, websocket)
    except Exception:  # noqa: BLE001
        await manager.disconnect(workspace_id, websocket)
