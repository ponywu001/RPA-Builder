@echo off
chcp 65001 >nul
title RPA Builder 啟動器

echo ========================================
echo   RPA Builder 開發環境啟動中...
echo ========================================
echo.

:: 取得腳本所在目錄
set "ROOT_DIR=%~dp0"

:: 啟動後端
echo [1/3] 啟動後端服務...
start "RPA Backend" cmd /k "cd /d %ROOT_DIR%backend && echo 後端服務啟動中... && python run.py"

:: 等待後端啟動
echo   等待後端啟動...
timeout /t 3 /nobreak >nul

:: 啟動 Vite 開發伺服器
echo [2/3] 啟動 Vite 開發伺服器...
start "RPA Vite Dev" cmd /k "cd /d %ROOT_DIR%frontend && echo Vite 開發伺服器啟動中... && npm run dev"

:: 等待 Vite 啟動
echo   等待 Vite 開發伺服器啟動...
timeout /t 5 /nobreak >nul

:: 啟動 Electron
echo [3/3] 啟動 Electron 應用...
start "RPA Electron" cmd /k "cd /d %ROOT_DIR%frontend && echo Electron 應用啟動中... && npm run start"

echo.
echo ========================================
echo   啟動完成！
echo ========================================
echo.
echo 已開啟三個終端視窗：
echo   - 後端服務 (Python FastAPI) - http://127.0.0.1:8000
echo   - Vite 開發伺服器 - http://localhost:5173
echo   - Electron 應用
echo.
echo 關閉應用：直接關閉所有終端視窗即可
echo.
pause
