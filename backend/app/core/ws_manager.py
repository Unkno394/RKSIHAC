import asyncio
from typing import List, Optional
from fastapi import WebSocket


class WSManager:
    def __init__(self):
        self.active: List[WebSocket] = []
        self.loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self.loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active:
            self.active.remove(websocket)

    async def broadcast(self, message: str):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)

    def broadcast_from_thread(self, message: str):
        if not self.loop:
            return
        asyncio.run_coroutine_threadsafe(self.broadcast(message), self.loop)


ws_manager = WSManager()
