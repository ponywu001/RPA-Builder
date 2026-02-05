"""
WebSocket 連接管理器

用於即時推送執行狀態到前端
"""

import asyncio
import json
from typing import Dict, Set, Any
from fastapi import WebSocket


class ConnectionManager:
    """WebSocket 連接管理器"""
    
    _instance: "ConnectionManager" = None
    
    def __new__(cls):
        """單例模式"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        # 所有活躍連接
        self._connections: Set[WebSocket] = set()
        # 訂閱特定執行的連接
        self._execution_subscriptions: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket) -> None:
        """接受新連接"""
        await websocket.accept()
        self._connections.add(websocket)
    
    def disconnect(self, websocket: WebSocket) -> None:
        """斷開連接"""
        self._connections.discard(websocket)
        # 移除所有訂閱
        for subs in self._execution_subscriptions.values():
            subs.discard(websocket)
    
    def subscribe_execution(self, websocket: WebSocket, execution_id: str) -> None:
        """訂閱特定執行的更新"""
        if execution_id not in self._execution_subscriptions:
            self._execution_subscriptions[execution_id] = set()
        self._execution_subscriptions[execution_id].add(websocket)
    
    def unsubscribe_execution(self, websocket: WebSocket, execution_id: str) -> None:
        """取消訂閱"""
        if execution_id in self._execution_subscriptions:
            self._execution_subscriptions[execution_id].discard(websocket)
    
    async def broadcast(self, message: dict) -> None:
        """廣播訊息給所有連接"""
        if not self._connections:
            return
        
        message_json = json.dumps(message, ensure_ascii=False, default=str)
        disconnected = set()
        
        for connection in self._connections:
            try:
                await connection.send_text(message_json)
            except Exception:
                disconnected.add(connection)
        
        # 清理斷開的連接
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_to_execution(self, execution_id: str, message: dict) -> None:
        """發送訊息給訂閱特定執行的連接"""
        subscribers = self._execution_subscriptions.get(execution_id, set())
        if not subscribers:
            return
        
        message["execution_id"] = execution_id
        message_json = json.dumps(message, ensure_ascii=False, default=str)
        disconnected = set()
        
        for connection in subscribers:
            try:
                await connection.send_text(message_json)
            except Exception:
                disconnected.add(connection)
        
        # 清理斷開的連接
        for conn in disconnected:
            self.disconnect(conn)
    
    async def send_execution_update(
        self,
        execution_id: str,
        status: str,
        progress: dict,
        current_block_id: str = None,
        logs: list = None,
        error: str = None,
    ) -> None:
        """發送執行狀態更新"""
        message = {
            "type": "execution_update",
            "data": {
                "execution_id": execution_id,
                "status": status,
                "progress": progress,
                "current_block_id": current_block_id,
            }
        }
        
        if logs:
            message["data"]["logs"] = logs
        if error:
            message["data"]["error"] = error
        
        await self.send_to_execution(execution_id, message)
    
    async def send_log(self, execution_id: str, log_entry: dict) -> None:
        """發送單條日誌"""
        message = {
            "type": "log",
            "data": log_entry,
        }
        await self.send_to_execution(execution_id, message)
    
    @property
    def connection_count(self) -> int:
        """當前連接數量"""
        return len(self._connections)


# 全域實例
ws_manager = ConnectionManager()
