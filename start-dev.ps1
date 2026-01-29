# RPA Builder 開發環境啟動腳本
# 使用方式：在 RPA 資料夾中執行 .\start-dev.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RPA Builder 開發環境啟動中..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$RootDir = $PSScriptRoot

# 檢查 Python 環境
Write-Host "[1/5] 檢查 Python 環境..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "錯誤：找不到 Python，請先安裝 Python 3.10+" -ForegroundColor Red
    exit 1
}

# 檢查 Node.js 環境
Write-Host "[2/5] 檢查 Node.js 環境..." -ForegroundColor Yellow
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "錯誤：找不到 npm，請先安裝 Node.js" -ForegroundColor Red
    exit 1
}

# 啟動後端
Write-Host "[3/5] 啟動後端服務..." -ForegroundColor Yellow
$backendPath = Join-Path $RootDir "backend"

Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$backendPath'; Write-Host '後端服務啟動中...' -ForegroundColor Green; python run.py"
) -WindowStyle Normal

Write-Host "  後端將在 http://127.0.0.1:8000 啟動" -ForegroundColor Gray
Write-Host "  API 文件：http://127.0.0.1:8000/docs" -ForegroundColor Gray

# 等待後端啟動
Write-Host "  等待後端啟動..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# 啟動 Vite 開發伺服器
Write-Host "[4/5] 啟動 Vite 開發伺服器..." -ForegroundColor Yellow
$frontendPath = Join-Path $RootDir "frontend"

Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; Write-Host 'Vite 開發伺服器啟動中...' -ForegroundColor Green; npm run dev"
) -WindowStyle Normal

Write-Host "  Vite 將在 http://localhost:5173 啟動" -ForegroundColor Gray

# 等待 Vite 啟動
Write-Host "  等待 Vite 開發伺服器啟動..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 啟動 Electron
Write-Host "[5/5] 啟動 Electron 應用..." -ForegroundColor Yellow

Start-Process -FilePath "powershell" -ArgumentList @(
    "-NoExit",
    "-Command",
    "Set-Location '$frontendPath'; Write-Host 'Electron 應用啟動中...' -ForegroundColor Green; npm run start"
) -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  啟動完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "已開啟三個終端視窗：" -ForegroundColor White
Write-Host "  - 後端服務 (Python FastAPI) - http://127.0.0.1:8000" -ForegroundColor Gray
Write-Host "  - Vite 開發伺服器 - http://localhost:5173" -ForegroundColor Gray
Write-Host "  - Electron 應用" -ForegroundColor Gray
Write-Host ""
Write-Host "關閉應用：直接關閉所有終端視窗即可" -ForegroundColor Yellow
