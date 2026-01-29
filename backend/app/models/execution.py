"""
執行紀錄資料模型
"""

from datetime import datetime
from typing import Dict, Any, Optional

from sqlalchemy import Column, String, Text, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship

from .script import Base


class ExecutionLog(Base):
    """執行紀錄資料表"""
    
    __tablename__ = "execution_logs"
    
    id = Column(String(36), primary_key=True)
    script_id = Column(String(36), ForeignKey("scripts.id"), nullable=False)
    script_name = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # pending, running, paused, success, failed, stopped
    
    # 進度
    current_step = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    
    # 時間
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    
    # 結果
    error = Column(Text, nullable=True)
    variables = Column(JSON, default=dict)
    logs = Column(JSON, default=list)
    
    # 關聯
    # script = relationship("Script", back_populates="executions")
    
    def to_dict(self) -> Dict[str, Any]:
        """轉換為字典"""
        return {
            "execution_id": self.id,
            "script_id": self.script_id,
            "script_name": self.script_name,
            "status": self.status,
            "progress": {
                "current_step": self.current_step,
                "total_steps": self.total_steps,
                "current_block_id": None,
            },
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "error": self.error,
            "variables": self.variables if self.variables else {},
            "logs": self.logs if self.logs else [],
        }
