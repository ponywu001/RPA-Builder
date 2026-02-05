"""
執行控制 API
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models import Script
from ...schemas import (
    ExecutionRequest,
    ExecutionResponse,
    ExecutionStatusResponse,
    ExecutionListResponse,
    ExecutionLogsResponse,
    SuccessResponse,
    ProgressSchema,
    LogEntrySchema,
)
from ...schemas.execution import AsyncExecutionResponse
from ...core.engine import ScriptEngine, ExecutionStatus as EngineExecutionStatus
from ..deps import get_db, get_engine, verify_api_key


router = APIRouter(prefix="/execute", tags=["Execution"])
executions_router = APIRouter(prefix="/executions", tags=["Execution"])


@router.post("/{script_id}", response_model=ExecutionResponse)
async def execute_script(
    script_id: str,
    request: ExecutionRequest = None,
    db: AsyncSession = Depends(get_db),
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """執行腳本（同步，等待完成）"""
    # 取得腳本
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    # 執行腳本
    variables = request.variables if request else {}
    execution_result = await engine.execute(
        script_id=script.id,
        script_name=script.name,
        blocks=script.blocks or [],
        variables=variables,
    )
    
    return ExecutionResponse(
        execution_id=execution_result.execution_id,
        script_id=execution_result.script_id,
        script_name=execution_result.script_name,
        status=execution_result.status.value,
        progress=ProgressSchema(
            current_step=execution_result.progress.current_step,
            total_steps=execution_result.progress.total_steps,
            current_block_id=execution_result.progress.current_block_id,
        ),
        started_at=execution_result.started_at,
        finished_at=execution_result.finished_at,
        error=execution_result.error,
        variables=execution_result.variables,
        logs=execution_result.logs,
    )


@router.post("/{script_id}/async", response_model=AsyncExecutionResponse)
async def execute_script_async(
    script_id: str,
    request: ExecutionRequest = None,
    db: AsyncSession = Depends(get_db),
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """執行腳本（非同步，立即返回）"""
    # 取得腳本
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    # 非同步執行腳本
    variables = request.variables if request else {}
    
    try:
        execution_id = await engine.execute_async(
            script_id=script.id,
            script_name=script.name,
            blocks=script.blocks or [],
            variables=variables,
        )
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
        )
    
    return AsyncExecutionResponse(execution_id=execution_id)


@executions_router.get("/{execution_id}", response_model=ExecutionStatusResponse)
async def get_execution_status(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """查詢執行狀態"""
    result = engine.get_status(execution_id)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"執行紀錄不存在: {execution_id}",
        )
    
    return ExecutionStatusResponse(
        execution_id=result.execution_id,
        script_id=result.script_id,
        script_name=result.script_name,
        status=result.status.value,
        progress=ProgressSchema(
            current_step=result.progress.current_step,
            total_steps=result.progress.total_steps,
            current_block_id=result.progress.current_block_id,
        ),
        started_at=result.started_at,
        finished_at=result.finished_at,
        error=result.error,
        variables=result.variables,
    )


@executions_router.get("/{execution_id}/logs", response_model=ExecutionLogsResponse)
async def get_execution_logs(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """取得執行日誌"""
    logs = engine.get_logs(execution_id)
    
    return ExecutionLogsResponse(
        logs=[
            LogEntrySchema(
                timestamp=log.get("timestamp", ""),
                level=log.get("level", "info"),
                message=log.get("message", ""),
            )
            for log in logs
        ]
    )


@executions_router.post("/{execution_id}/stop", response_model=SuccessResponse)
async def stop_execution(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """停止執行"""
    success = engine.stop(execution_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"執行紀錄不存在或無法停止: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.post("/{execution_id}/pause", response_model=SuccessResponse)
async def pause_execution(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """暫停執行"""
    success = engine.pause(execution_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無法暫停執行: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.post("/{execution_id}/resume", response_model=SuccessResponse)
async def resume_execution(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """繼續執行"""
    success = engine.resume(execution_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無法繼續執行: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.post("/{execution_id}/step", response_model=SuccessResponse)
async def step_execution(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """單步執行"""
    success = engine.step(execution_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無法單步執行: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.post("/{execution_id}/breakpoint", response_model=SuccessResponse)
async def set_breakpoint(
    execution_id: str,
    block_instance_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """設置斷點"""
    success = engine.set_breakpoint(execution_id, block_instance_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"執行紀錄不存在: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.delete("/{execution_id}/breakpoint", response_model=SuccessResponse)
async def remove_breakpoint(
    execution_id: str,
    block_instance_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """移除斷點"""
    success = engine.remove_breakpoint(execution_id, block_instance_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"執行紀錄不存在: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.post("/{execution_id}/debug", response_model=SuccessResponse)
async def set_debug_mode(
    execution_id: str,
    enabled: bool = True,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """設置除錯模式"""
    success = engine.set_debug_mode(execution_id, enabled)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"執行紀錄不存在: {execution_id}",
        )
    
    return SuccessResponse(success=True)


@executions_router.get("/{execution_id}/variables")
async def get_variables(
    execution_id: str,
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """取得執行變數"""
    variables = engine.get_variables(execution_id)
    return {"variables": variables}


@executions_router.get("", response_model=ExecutionListResponse)
async def get_executions(
    script_id: Optional[str] = Query(None, description="篩選腳本 ID"),
    status: Optional[str] = Query(None, description="篩選狀態"),
    limit: int = Query(50, ge=1, le=100, description="限制數量"),
    engine: ScriptEngine = Depends(get_engine),
    _: bool = Depends(verify_api_key),
):
    """取得所有執行紀錄"""
    # 轉換狀態
    engine_status = None
    if status:
        try:
            engine_status = EngineExecutionStatus(status)
        except ValueError:
            pass
    
    results = engine.get_all_executions(
        script_id=script_id,
        status=engine_status,
        limit=limit,
    )
    
    return ExecutionListResponse(
        executions=[
            ExecutionStatusResponse(
                execution_id=r.execution_id,
                script_id=r.script_id,
                script_name=r.script_name,
                status=r.status.value,
                progress=ProgressSchema(
                    current_step=r.progress.current_step,
                    total_steps=r.progress.total_steps,
                    current_block_id=r.progress.current_block_id,
                ),
                started_at=r.started_at,
                finished_at=r.finished_at,
                error=r.error,
                variables=r.variables,
            )
            for r in results
        ]
    )
