"""
動作錄製 API
"""

from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel

from ...core.recorder import recorder, RecordedAction
from ..deps import verify_api_key


router = APIRouter(prefix="/recorder", tags=["Recorder"])


class RecorderStatusResponse(BaseModel):
    is_recording: bool
    action_count: int


class ActionResponse(BaseModel):
    action_id: str
    action_type: str
    timestamp: float
    params: dict
    screenshot_path: str = None


class StartRecordingRequest(BaseModel):
    auto_screenshot: bool = True


class BlocksResponse(BaseModel):
    blocks: List[dict]


@router.get("/status", response_model=RecorderStatusResponse)
async def get_recorder_status(_: bool = Depends(verify_api_key)):
    """取得錄製器狀態"""
    return RecorderStatusResponse(
        is_recording=recorder.is_recording,
        action_count=len(recorder.actions),
    )


@router.post("/start")
async def start_recording(
    request: StartRecordingRequest = None,
    _: bool = Depends(verify_api_key),
):
    """開始錄製"""
    auto_screenshot = request.auto_screenshot if request else True
    
    try:
        success = recorder.start_recording(auto_screenshot=auto_screenshot)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="已在錄製中",
            )
        
        return {"success": True, "message": "錄製已開始"}
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/stop")
async def stop_recording(_: bool = Depends(verify_api_key)):
    """停止錄製"""
    actions = recorder.stop_recording()
    
    return {
        "success": True,
        "message": "錄製已停止",
        "action_count": len(actions),
    }


@router.post("/clear")
async def clear_recording(_: bool = Depends(verify_api_key)):
    """清除錄製"""
    recorder.clear_recording()
    return {"success": True, "message": "錄製已清除"}


@router.get("/actions")
async def get_recorded_actions(_: bool = Depends(verify_api_key)):
    """取得錄製的動作"""
    actions = recorder.actions
    return {
        "actions": [action.to_dict() for action in actions],
    }


@router.get("/blocks")
async def get_recorded_blocks(_: bool = Depends(verify_api_key)):
    """取得生成的 Blocks"""
    blocks = recorder.get_blocks()
    return {"blocks": blocks}
