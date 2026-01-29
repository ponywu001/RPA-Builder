"""
系統 API
"""

from fastapi import APIRouter, Depends

from ...schemas import (
    HealthResponse,
    ScreenInfoResponse,
    MousePositionResponse,
    DisplayInfo,
)
from ...schemas.common import BlockDefinitionResponse, BlockDefinitionsResponse
from ...core.config import settings
from ...core.image_finder import image_finder
from ...core.desktop import desktop
from ...core.blocks import BlockRegistry, BlockCategory
from ..deps import verify_api_key


router = APIRouter(tags=["System"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """健康檢查"""
    return HealthResponse(
        status="ok",
        version=settings.app_version,
    )


@router.get("/system/screen", response_model=ScreenInfoResponse)
async def get_screen_info(
    _: bool = Depends(verify_api_key),
):
    """取得螢幕資訊"""
    width, height = image_finder.get_screen_size()
    monitors = image_finder.get_monitors()
    
    return ScreenInfoResponse(
        width=width,
        height=height,
        displays=[
            DisplayInfo(
                index=m["index"],
                left=m["left"],
                top=m["top"],
                width=m["width"],
                height=m["height"],
            )
            for m in monitors
        ],
    )


@router.get("/system/mouse", response_model=MousePositionResponse)
async def get_mouse_position(
    _: bool = Depends(verify_api_key),
):
    """取得滑鼠位置"""
    x, y = desktop.get_mouse_position()
    
    return MousePositionResponse(x=x, y=y)


@router.get("/blocks", response_model=BlockDefinitionsResponse)
async def get_block_definitions(
    _: bool = Depends(verify_api_key),
):
    """取得所有 Block 定義"""
    definitions = BlockRegistry.get_all_definitions()
    
    return BlockDefinitionsResponse(
        blocks=[
            BlockDefinitionResponse(
                id=d.id,
                name=d.name,
                category=d.category.value,
                description=d.description,
                params=d.params,
                has_children=d.has_children,
                has_else=d.has_else,
                color=d.color,
            )
            for d in definitions.values()
        ]
    )


@router.get("/blocks/{category}", response_model=BlockDefinitionsResponse)
async def get_block_definitions_by_category(
    category: str,
    _: bool = Depends(verify_api_key),
):
    """依類別取得 Block 定義"""
    try:
        block_category = BlockCategory(category)
    except ValueError:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無效的類別: {category}",
        )
    
    definitions = BlockRegistry.get_definitions_by_category(block_category)
    
    return BlockDefinitionsResponse(
        blocks=[
            BlockDefinitionResponse(
                id=d.id,
                name=d.name,
                category=d.category.value,
                description=d.description,
                params=d.params,
                has_children=d.has_children,
                has_else=d.has_else,
                color=d.color,
            )
            for d in definitions.values()
        ]
    )
