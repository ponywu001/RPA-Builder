"""
通用 Schemas
"""

from typing import List, Optional

from pydantic import BaseModel, Field


class SuccessResponse(BaseModel):
    """成功回應"""
    success: bool = True


class ErrorResponse(BaseModel):
    """錯誤回應"""
    error: str
    detail: Optional[str] = None


class HealthResponse(BaseModel):
    """健康檢查回應"""
    status: str = "ok"
    version: str


class DisplayInfo(BaseModel):
    """螢幕資訊"""
    index: int
    left: int
    top: int
    width: int
    height: int


class ScreenInfoResponse(BaseModel):
    """螢幕資訊回應"""
    width: int
    height: int
    displays: List[DisplayInfo]


class MousePositionResponse(BaseModel):
    """滑鼠位置回應"""
    x: int
    y: int


class BlockDefinitionParam(BaseModel):
    """Block 參數定義"""
    type: str
    required: Optional[bool] = False
    default_value: Optional[str] = None
    description: Optional[str] = None
    options: Optional[List[str]] = None


class BlockDefinitionResponse(BaseModel):
    """Block 定義回應"""
    id: str
    name: str
    category: str
    description: str
    params: dict
    has_children: bool = False
    has_else: bool = False
    color: str


class BlockDefinitionsResponse(BaseModel):
    """Block 定義列表回應"""
    blocks: List[BlockDefinitionResponse]
