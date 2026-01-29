"""
截圖相關 Schemas
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class CaptureRegionRequest(BaseModel):
    """擷取區域請求"""
    x: int = Field(..., ge=0, description="左上角 X 座標")
    y: int = Field(..., ge=0, description="左上角 Y 座標")
    width: int = Field(..., gt=0, description="寬度")
    height: int = Field(..., gt=0, description="高度")


class CaptureSaveRequest(BaseModel):
    """儲存截圖請求"""
    image: str = Field(..., description="Base64 編碼的圖片")
    name: str = Field(..., min_length=1, max_length=255, description="圖片名稱")


class CaptureSaveResponse(BaseModel):
    """儲存截圖回應"""
    path: str = Field(..., description="圖片路徑")


class CaptureTestRequest(BaseModel):
    """測試圖片辨識請求"""
    template_path: str = Field(..., description="模板圖片路徑")
    confidence: Optional[float] = Field(0.8, ge=0, le=1, description="匹配信心度")


class PositionSchema(BaseModel):
    """位置結構"""
    x: int
    y: int
    width: int
    height: int
    confidence: float


class CaptureTestResponse(BaseModel):
    """測試圖片辨識回應"""
    found: bool
    position: Optional[PositionSchema] = None


class TemplateResponse(BaseModel):
    """模板圖片回應"""
    name: str
    path: str
    size: int  # 檔案大小 (bytes)
    created_at: datetime
    modified_at: datetime


class TemplateListResponse(BaseModel):
    """模板圖片列表回應"""
    templates: List[TemplateResponse]
