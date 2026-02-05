"""
WebSocket 路由
"""

import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from ...core.websocket import ws_manager


router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket 端點
    
    訊息格式:
    - 訂閱執行: {"action": "subscribe", "execution_id": "xxx"}
    - 取消訂閱: {"action": "unsubscribe", "execution_id": "xxx"}
    - 心跳: {"action": "ping"}
    """
    await ws_manager.connect(websocket)
    
    try:
        while True:
            # 接收訊息
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                action = message.get("action")
                
                if action == "subscribe":
                    execution_id = message.get("execution_id")
                    if execution_id:
                        ws_manager.subscribe_execution(websocket, execution_id)
                        await websocket.send_json({
                            "type": "subscribed",
                            "execution_id": execution_id,
                        })
                
                elif action == "unsubscribe":
                    execution_id = message.get("execution_id")
                    if execution_id:
                        ws_manager.unsubscribe_execution(websocket, execution_id)
                        await websocket.send_json({
                            "type": "unsubscribed",
                            "execution_id": execution_id,
                        })
                
                elif action == "ping":
                    await websocket.send_json({"type": "pong"})
                    
            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "message": "Invalid JSON",
                })
                
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
