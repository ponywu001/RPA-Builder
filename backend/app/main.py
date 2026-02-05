"""
RPA Builder FastAPI 應用程式入口

啟動方式：
    開發模式: uvicorn app.main:app --reload --port 8000
    生產模式: uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .api.deps import init_db
from .api.routes import scripts, execution, capture, system, ws, schedule, recorder, folders
from .core.scheduler import scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """應用程式生命週期管理"""
    # 啟動時
    print(f"[*] Starting {settings.app_name} v{settings.app_version}")
    print(f"[*] Scripts directory: {settings.scripts_dir}")
    print(f"[*] Images directory: {settings.images_dir}")
    
    # 初始化資料庫
    await init_db()
    print("[+] Database initialized")
    
    # 啟動排程器
    scheduler.start()
    print("[+] Scheduler started")
    
    yield
    
    # 停止排程器
    scheduler.stop()
    
    # 關閉時
    print("[*] Application shutdown")


# 建立 FastAPI 應用
app = FastAPI(
    title=settings.app_name,
    description="視覺化 RPA 應用程式後端 API",
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發環境允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 註冊路由
app.include_router(system.router, prefix=settings.api_prefix)
app.include_router(scripts.router, prefix=settings.api_prefix)
app.include_router(execution.router, prefix=settings.api_prefix)
app.include_router(execution.executions_router, prefix=settings.api_prefix)
app.include_router(capture.router, prefix=settings.api_prefix)
app.include_router(ws.router, prefix=settings.api_prefix)
app.include_router(schedule.router, prefix=settings.api_prefix)
app.include_router(recorder.router, prefix=settings.api_prefix)
app.include_router(folders.router, prefix=settings.api_prefix)


@app.get("/")
async def root():
    """根路由"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "docs": "/docs",
        "api": settings.api_prefix,
    }


# 開發模式啟動
if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
