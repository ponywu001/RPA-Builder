"""
資料夾 API 路由
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...db import get_db
from ...models.script import Folder

router = APIRouter(prefix="/folders", tags=["folders"])


class FolderCreate(BaseModel):
    name: str
    parent_id: Optional[str] = None


class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_id: Optional[str] = None


class FolderResponse(BaseModel):
    id: str
    name: str
    parent_id: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True


@router.get("", response_model=List[FolderResponse])
async def get_folders(db: Session = Depends(get_db)):
    """取得所有資料夾"""
    folders = db.query(Folder).all()
    return [FolderResponse(**f.to_dict()) for f in folders]


@router.post("", response_model=FolderResponse)
async def create_folder(data: FolderCreate, db: Session = Depends(get_db)):
    """建立資料夾"""
    folder = Folder(
        id=str(uuid.uuid4()),
        name=data.name,
        parent_id=data.parent_id,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderResponse(**folder.to_dict())


@router.put("/{folder_id}", response_model=FolderResponse)
async def update_folder(folder_id: str, data: FolderUpdate, db: Session = Depends(get_db)):
    """更新資料夾"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if data.name is not None:
        folder.name = data.name
    if data.parent_id is not None:
        folder.parent_id = data.parent_id
    
    db.commit()
    db.refresh(folder)
    return FolderResponse(**folder.to_dict())


@router.delete("/{folder_id}")
async def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    """刪除資料夾"""
    folder = db.query(Folder).filter(Folder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    db.delete(folder)
    db.commit()
    return {"status": "deleted"}
