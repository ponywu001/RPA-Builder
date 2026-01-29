"""
執行相關 Schemas
"""

from datetime import datetime
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field


class ExecutionRequest(BaseModel):
    """執行請求"""
    variables: Optional[Dict[str, Any]] = Field(default_factory=dict, description="初始變數")


class ProgressSchema(BaseModel):
    """進度結構"""
    current_step: int = 0
    total_steps: int = 0
    current_block_id: Optional[str] = None


class ExecutionResponse(BaseModel):
    """執行回應"""
    execution_id: str
    script_id: str
    script_name: str
    status: str  # pending, running, paused, success, failed, stopped
    progress: ProgressSchema
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    variables: Dict[str, Any] = {}
    logs: List[Dict[str, Any]] = []


class ExecutionStatusResponse(BaseModel):
    """執行狀態回應"""
    execution_id: str
    script_id: str
    script_name: str
    status: str
    progress: ProgressSchema
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    variables: Dict[str, Any] = {}


class LogEntrySchema(BaseModel):
    """日誌條目"""
    timestamp: str
    level: str
    message: str


class ExecutionLogsResponse(BaseModel):
    """執行日誌回應"""
    logs: List[LogEntrySchema]


class ExecutionListResponse(BaseModel):
    """執行列表回應"""
    executions: List[ExecutionStatusResponse]


class AsyncExecutionResponse(BaseModel):
    """非同步執行回應"""
    execution_id: str
