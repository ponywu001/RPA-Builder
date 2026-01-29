"""
腳本管理 API
"""

import json
import uuid
from typing import List
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...models import Script
from ...schemas import (
    ScriptCreate,
    ScriptUpdate,
    ScriptResponse,
    ScriptListResponse,
    ScriptExportResponse,
    ScriptImportRequest,
    SuccessResponse,
)
from ...core.code_generator import code_generator
from ..deps import get_db, verify_api_key


router = APIRouter(prefix="/scripts", tags=["Scripts"])


@router.get("", response_model=ScriptListResponse)
async def get_scripts(
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """取得所有腳本"""
    result = await db.execute(select(Script).order_by(Script.updated_at.desc()))
    scripts = result.scalars().all()
    
    return ScriptListResponse(
        scripts=[
            ScriptResponse(
                id=s.id,
                name=s.name,
                description=s.description,
                blocks=s.blocks or [],
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
            for s in scripts
        ]
    )


@router.get("/{script_id}", response_model=ScriptResponse)
async def get_script(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """取得單一腳本"""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        blocks=script.blocks or [],
        created_at=script.created_at,
        updated_at=script.updated_at,
    )


@router.post("", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_script(
    data: ScriptCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """建立腳本"""
    script = Script(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description,
        blocks=data.blocks,
    )
    
    db.add(script)
    await db.commit()
    await db.refresh(script)
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        blocks=script.blocks or [],
        created_at=script.created_at,
        updated_at=script.updated_at,
    )


@router.put("/{script_id}", response_model=ScriptResponse)
async def update_script(
    script_id: str,
    data: ScriptUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """更新腳本"""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    # 更新欄位
    if data.name is not None:
        script.name = data.name
    if data.description is not None:
        script.description = data.description
    if data.blocks is not None:
        script.blocks = data.blocks
    
    await db.commit()
    await db.refresh(script)
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        blocks=script.blocks or [],
        created_at=script.created_at,
        updated_at=script.updated_at,
    )


@router.delete("/{script_id}", response_model=SuccessResponse)
async def delete_script(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """刪除腳本"""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    await db.delete(script)
    await db.commit()
    
    return SuccessResponse(success=True)


@router.get("/{script_id}/export", response_model=ScriptExportResponse)
async def export_script(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """匯出腳本"""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    export_data = {
        "name": script.name,
        "description": script.description,
        "blocks": script.blocks or [],
        "exported_at": script.updated_at.isoformat() if script.updated_at else None,
        "version": "1.0",
    }
    
    return ScriptExportResponse(data=json.dumps(export_data, ensure_ascii=False, indent=2))


@router.get("/{script_id}/export/python")
async def export_script_python(
    script_id: str,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """匯出腳本為 Python 檔案"""
    result = await db.execute(select(Script).where(Script.id == script_id))
    script = result.scalar_one_or_none()
    
    if not script:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"腳本不存在: {script_id}",
        )
    
    # 生成 Python 代碼
    python_code = code_generator.generate(script.name, script.blocks or [])
    
    # 返回純文字響應，設置下載檔名
    # 使用 URL 編碼處理中文檔名 (RFC 5987)
    filename = f"{script.name}.py"
    filename_encoded = quote(filename, safe='')
    
    return PlainTextResponse(
        content=python_code,
        media_type="text/x-python",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{filename_encoded}",
            "Access-Control-Allow-Origin": "*",
        },
    )


@router.post("/import", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def import_script(
    data: ScriptImportRequest,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(verify_api_key),
):
    """匯入腳本"""
    try:
        import_data = json.loads(data.data)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"JSON 格式錯誤: {e}",
        )
    
    # 驗證必要欄位
    if "name" not in import_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="缺少必要欄位: name",
        )
    
    script = Script(
        id=str(uuid.uuid4()),
        name=import_data.get("name"),
        description=import_data.get("description"),
        blocks=import_data.get("blocks", []),
    )
    
    db.add(script)
    await db.commit()
    await db.refresh(script)
    
    return ScriptResponse(
        id=script.id,
        name=script.name,
        description=script.description,
        blocks=script.blocks or [],
        created_at=script.created_at,
        updated_at=script.updated_at,
    )
