"""
API 依賴項
"""

from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, Header, status

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from ..core.config import settings
from ..core.engine import ScriptEngine, engine
from ..models import Base


# 建立資料庫引擎
db_engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
)

# Session 工廠
async_session_factory = async_sessionmaker(
    db_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def init_db() -> None:
    """初始化資料庫"""
    async with db_engine.begin() as conn:
        # 建立所有資料表
        await conn.run_sync(Base.metadata.create_all)
        
        # 檢查並添加缺失的欄位（處理 schema 更新）
        await _migrate_schema(conn)


async def _migrate_schema(conn) -> None:
    """檢查並遷移資料庫 schema"""
    from sqlalchemy import text
    
    # 取得 scripts 資料表的現有欄位
    result = await conn.execute(text("PRAGMA table_info(scripts)"))
    columns = {row[1] for row in result.fetchall()}
    
    # 如果 folder_id 欄位不存在，添加它
    if "folder_id" not in columns:
        await conn.execute(text(
            "ALTER TABLE scripts ADD COLUMN folder_id VARCHAR(36) REFERENCES folders(id)"
        ))
        print("[+] Added folder_id column to scripts table")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """取得資料庫 Session"""
    async with async_session_factory() as session:
        try:
            yield session
        finally:
            await session.close()


def get_engine() -> ScriptEngine:
    """取得腳本引擎"""
    return engine


async def verify_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
) -> bool:
    """驗證 API Key"""
    # 如果沒有設定 API Key，不需要驗證
    if not settings.api_key:
        return True
    
    if x_api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API Key",
        )
    
    return True
