"""
腳本資料模型
"""

import json
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import Column, String, Text, DateTime, JSON, ForeignKey
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    """SQLAlchemy Base"""
    pass


class Folder(Base):
    """資料夾資料表"""
    
    __tablename__ = "folders"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    parent_id = Column(String(36), ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # 關聯
    scripts = relationship("Script", back_populates="folder")
    children = relationship("Folder", backref="parent", remote_side=[id])
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "parent_id": self.parent_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Script(Base):
    """腳本資料表"""
    
    __tablename__ = "scripts"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    blocks = Column(JSON, nullable=False, default=list)
    folder_id = Column(String(36), ForeignKey("folders.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 關聯
    folder = relationship("Folder", back_populates="scripts")
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "blocks": self.blocks if self.blocks else [],
            "folder_id": self.folder_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Script":
        """從字典建立"""
        return cls(
            id=data.get("id"),
            name=data.get("name"),
            description=data.get("description"),
            blocks=data.get("blocks", []),
            folder_id=data.get("folder_id"),
        )
