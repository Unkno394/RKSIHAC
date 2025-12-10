from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.ws_manager import ws_manager

router = APIRouter(prefix="/ws", tags=["ws"])


@router.websocket("/events")
async def events_ws(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # держим соединение живым; сообщения от клиента игнорируем
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
