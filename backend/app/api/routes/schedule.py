"""
排程管理 API
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ...core.scheduler import scheduler, ScheduleConfig, ScheduleType
from ..deps import verify_api_key


router = APIRouter(prefix="/schedules", tags=["Schedules"])


class CreateScheduleRequest(BaseModel):
    script_id: str
    script_name: str
    schedule_type: str  # once, interval, cron
    run_at: Optional[str] = None  # ISO 格式時間
    interval_seconds: Optional[int] = None
    cron_expression: Optional[str] = None
    variables: dict = {}
    enabled: bool = True


class UpdateScheduleRequest(BaseModel):
    enabled: Optional[bool] = None
    run_at: Optional[str] = None
    interval_seconds: Optional[int] = None
    cron_expression: Optional[str] = None
    variables: Optional[dict] = None


class ScheduleResponse(BaseModel):
    schedule_id: str
    script_id: str
    script_name: str
    schedule_type: str
    enabled: bool
    run_at: Optional[str] = None
    interval_seconds: Optional[int] = None
    cron_expression: Optional[str] = None
    variables: dict = {}
    last_run: Optional[str] = None
    next_run: Optional[str] = None


@router.get("", response_model=list)
async def get_schedules(_: bool = Depends(verify_api_key)):
    """取得所有排程"""
    schedules = scheduler.get_all_schedules()
    return [s.to_dict() for s in schedules]


@router.get("/{schedule_id}")
async def get_schedule(
    schedule_id: str,
    _: bool = Depends(verify_api_key),
):
    """取得單一排程"""
    schedule = scheduler.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"排程不存在: {schedule_id}",
        )
    
    return schedule.to_dict()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_schedule(
    request: CreateScheduleRequest,
    _: bool = Depends(verify_api_key),
):
    """建立排程"""
    schedule_id = str(uuid.uuid4())
    
    try:
        schedule_type = ScheduleType(request.schedule_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無效的排程類型: {request.schedule_type}",
        )
    
    run_at = None
    if request.run_at:
        try:
            run_at = datetime.fromisoformat(request.run_at)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="無效的時間格式",
            )
    
    config = ScheduleConfig(
        schedule_id=schedule_id,
        script_id=request.script_id,
        script_name=request.script_name,
        schedule_type=schedule_type,
        enabled=request.enabled,
        run_at=run_at,
        interval_seconds=request.interval_seconds,
        cron_expression=request.cron_expression,
        variables=request.variables,
    )
    
    scheduler.add_schedule(config)
    
    return config.to_dict()


@router.put("/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    request: UpdateScheduleRequest,
    _: bool = Depends(verify_api_key),
):
    """更新排程"""
    schedule = scheduler.get_schedule(schedule_id)
    
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"排程不存在: {schedule_id}",
        )
    
    update_data = {}
    
    if request.enabled is not None:
        update_data['enabled'] = request.enabled
    
    if request.run_at is not None:
        try:
            update_data['run_at'] = datetime.fromisoformat(request.run_at)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="無效的時間格式",
            )
    
    if request.interval_seconds is not None:
        update_data['interval_seconds'] = request.interval_seconds
    
    if request.cron_expression is not None:
        update_data['cron_expression'] = request.cron_expression
    
    if request.variables is not None:
        update_data['variables'] = request.variables
    
    scheduler.update_schedule(schedule_id, **update_data)
    
    return scheduler.get_schedule(schedule_id).to_dict()


@router.delete("/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    _: bool = Depends(verify_api_key),
):
    """刪除排程"""
    success = scheduler.remove_schedule(schedule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"排程不存在: {schedule_id}",
        )
    
    return {"success": True}


@router.post("/{schedule_id}/enable")
async def enable_schedule(
    schedule_id: str,
    _: bool = Depends(verify_api_key),
):
    """啟用排程"""
    success = scheduler.enable_schedule(schedule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"排程不存在: {schedule_id}",
        )
    
    return {"success": True}


@router.post("/{schedule_id}/disable")
async def disable_schedule(
    schedule_id: str,
    _: bool = Depends(verify_api_key),
):
    """停用排程"""
    success = scheduler.disable_schedule(schedule_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"排程不存在: {schedule_id}",
        )
    
    return {"success": True}
