"""
腳本資料模型
"""

import json
from datetime import datetime
from typing import List, Dict, Any

from sqlalchemy import Column, String, Text, DateTime, JSON
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """SQLAlchemy Base"""
    pass


class Script(Base):
    """腳本資料表"""
    
    __tablename__ = "scripts"
    
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    blocks = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "blocks": self.blocks if self.blocks else [],
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
        )
