"""
應用程式配置
"""

from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field, model_validator


# 基礎目錄
BASE_DIR = Path(__file__).parent.parent.parent.parent


class Settings(BaseSettings):
    """應用程式設定"""
    
    # 應用程式資訊
    app_name: str = "RPA Builder"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # API 設定
    api_prefix: str = "/api"
    api_key: str = Field(default="", description="API 認證金鑰，空字串表示不啟用認證")
    
    # 伺服器設定
    host: str = "127.0.0.1"
    port: int = 8000
    
    # 資料庫設定
    database_url: str = "sqlite+aiosqlite:///./rpa_builder.db"
    
    # 檔案路徑設定
    base_dir: Path = BASE_DIR
    scripts_dir: Optional[Path] = None
    images_dir: Optional[Path] = None
    logs_dir: Optional[Path] = None
    
    # 圖像辨識設定
    default_confidence: float = 0.8
    default_timeout: float = 30.0
    default_interval: float = 0.5
    
    # 桌面控制設定
    failsafe: bool = True
    action_delay: float = 0.1
    type_interval: float = 0.05
    
    # 執行引擎設定
    max_concurrent_executions: int = 5
    execution_log_retention_days: int = 30
    
    @model_validator(mode='after')
    def set_default_paths(self):
        """設定預設路徑並確保目錄存在"""
        if self.scripts_dir is None:
            self.scripts_dir = self.base_dir / "scripts"
        if self.images_dir is None:
            self.images_dir = self.base_dir / "images"
        if self.logs_dir is None:
            self.logs_dir = self.base_dir / "logs"
        
        # 確保目錄存在
        self.scripts_dir.mkdir(parents=True, exist_ok=True)
        self.images_dir.mkdir(parents=True, exist_ok=True)
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        return self
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
