"""
腳本相關 Schemas
"""

from datetime import datetime
from typing import List, Dict, Any, Optional

from pydantic import BaseModel, Field


class BlockSchema(BaseModel):
    """Block 結構"""
    id: str = Field(..., description="Block 類型 ID")
    instance_id: str = Field(..., description="唯一實例 ID")
    params: Dict[str, Any] = Field(default_factory=dict, description="參數")
    children: List["BlockSchema"] = Field(default_factory=list, description="子 blocks")
    else_children: List["BlockSchema"] = Field(default_factory=list, description="else 分支 blocks")


class ScriptCreate(BaseModel):
    """建立腳本請求"""
    name: str = Field(..., min_length=1, max_length=255, description="腳本名稱")
    description: Optional[str] = Field(None, description="腳本說明")
    blocks: List[Dict[str, Any]] = Field(default_factory=list, description="Block 列表")


class ScriptUpdate(BaseModel):
    """更新腳本請求"""
    name: Optional[str] = Field(None, min_length=1, max_length=255, description="腳本名稱")
    description: Optional[str] = Field(None, description="腳本說明")
    blocks: Optional[List[Dict[str, Any]]] = Field(None, description="Block 列表")


class ScriptResponse(BaseModel):
    """腳本回應"""
    id: str
    name: str
    description: Optional[str] = None
    blocks: List[Dict[str, Any]] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ScriptListResponse(BaseModel):
    """腳本列表回應"""
    scripts: List[ScriptResponse]


class ScriptExportResponse(BaseModel):
    """腳本匯出回應"""
    data: str = Field(..., description="腳本 JSON 字串")


class ScriptImportRequest(BaseModel):
    """腳本匯入請求"""
    data: str = Field(..., description="腳本 JSON 字串")
