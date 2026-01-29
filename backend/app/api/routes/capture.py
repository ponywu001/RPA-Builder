"""
截圖工具 API
"""

import base64
from pathlib import Path
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from ...schemas import (
    CaptureRegionRequest,
    CaptureSaveRequest,
    CaptureTestRequest,
    CaptureTestResponse,
    TemplateResponse,
    TemplateListResponse,
    SuccessResponse,
    PositionSchema,
)
from ...schemas.capture import CaptureSaveResponse
from ...core.image_finder import image_finder
from ...core.config import settings
from ..deps import verify_api_key


router = APIRouter(prefix="/capture", tags=["Capture"])


@router.get("/screen")
async def capture_screen(
    _: bool = Depends(verify_api_key),
):
    """擷取全螢幕"""
    image_bytes = image_finder.capture_screen()
    return Response(content=image_bytes, media_type="image/png")


@router.post("/region")
async def capture_region(
    request: CaptureRegionRequest,
    _: bool = Depends(verify_api_key),
):
    """擷取指定區域"""
    try:
        image_bytes = image_finder.capture_region(
            x=request.x,
            y=request.y,
            width=request.width,
            height=request.height,
        )
        return Response(content=image_bytes, media_type="image/png")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"擷取區域失敗: {e}",
        )


@router.post("/save", response_model=CaptureSaveResponse)
async def save_capture(
    request: CaptureSaveRequest,
    _: bool = Depends(verify_api_key),
):
    """儲存為模板圖片"""
    try:
        # 解碼 base64 圖片
        image_data = base64.b64decode(request.image)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Base64 解碼失敗: {e}",
        )
    
    # 確保檔名有 .png 副檔名
    name = request.name
    if not name.lower().endswith(".png"):
        name += ".png"
    
    # 儲存圖片
    image_path = settings.images_dir / name
    
    try:
        image_path.write_bytes(image_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"儲存圖片失敗: {e}",
        )
    
    # 清除快取
    image_finder.invalidate_cache(str(image_path))
    
    return CaptureSaveResponse(path=str(name))


@router.get("/templates", response_model=TemplateListResponse)
async def get_templates(
    _: bool = Depends(verify_api_key),
):
    """取得所有模板圖片"""
    templates = []
    
    if settings.images_dir.exists():
        for file_path in settings.images_dir.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in (".png", ".jpg", ".jpeg", ".bmp"):
                stat = file_path.stat()
                templates.append(TemplateResponse(
                    name=file_path.name,
                    path=str(file_path.relative_to(settings.images_dir)),
                    size=stat.st_size,
                    created_at=datetime.fromtimestamp(stat.st_ctime),
                    modified_at=datetime.fromtimestamp(stat.st_mtime),
                ))
    
    # 按修改時間排序
    templates.sort(key=lambda t: t.modified_at, reverse=True)
    
    return TemplateListResponse(templates=templates)


@router.delete("/templates/{name}", response_model=SuccessResponse)
async def delete_template(
    name: str,
    _: bool = Depends(verify_api_key),
):
    """刪除模板圖片"""
    image_path = settings.images_dir / name
    
    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"圖片不存在: {name}",
        )
    
    try:
        image_path.unlink()
        # 清除快取
        image_finder.invalidate_cache(str(image_path))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"刪除圖片失敗: {e}",
        )
    
    return SuccessResponse(success=True)


@router.post("/test", response_model=CaptureTestResponse)
async def test_capture(
    request: CaptureTestRequest,
    _: bool = Depends(verify_api_key),
):
    """測試圖片辨識"""
    try:
        position = image_finder.find_on_screen(
            template_path=request.template_path,
            confidence=request.confidence,
        )
        
        if position:
            return CaptureTestResponse(
                found=True,
                position=PositionSchema(
                    x=position.x,
                    y=position.y,
                    width=position.width,
                    height=position.height,
                    confidence=position.confidence,
                ),
            )
        else:
            return CaptureTestResponse(found=False)
            
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"圖片辨識失敗: {e}",
        )


@router.get("/templates/{name}")
async def get_template_image(
    name: str,
    # 移除 API Key 驗證，允許圖片直接載入
):
    """取得模板圖片"""
    image_path = settings.images_dir / name
    
    if not image_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"圖片不存在: {name}",
        )
    
    # 判斷 content type
    suffix = image_path.suffix.lower()
    content_type_map = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".bmp": "image/bmp",
        ".gif": "image/gif",
    }
    content_type = content_type_map.get(suffix, "application/octet-stream")
    
    return Response(
        content=image_path.read_bytes(),
        media_type=content_type,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    )
