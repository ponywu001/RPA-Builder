# RPA Builder

視覺化 RPA 應用程式 - 透過拖拉式介面設計自動化腳本，並透過 API 觸發執行。


## ✨ 功能特色

- 🎨 **視覺化編輯器** - 使用 Google Blockly 拖拉式介面設計自動化流程
- 🖼️ **圖像辨識** - 基於 OpenCV 的螢幕圖像識別與定位
- 🖱️ **桌面控制** - 滑鼠點擊、鍵盤輸入、滾動等操作
- 🔄 **流程控制** - 條件判斷、迴圈、變數、錯誤處理
- 📡 **API 驅動** - RESTful API 支援程式化觸發腳本
- 📦 **獨立打包** - 打包為單一安裝程式，無需額外環境

## 🛠️ 技術棧

| 類別 | 技術 |
|------|------|
| 後端框架 | FastAPI (Python 3.11+) |
| 桌面控制 | PyAutoGUI |
| 圖像辨識 | OpenCV + NumPy |
| 前端框架 | Electron + React + TypeScript |
| 拖拉編輯器 | Google Blockly |
| 資料庫 | SQLite |
| 打包工具 | PyInstaller + electron-builder |

## 📁 專案結構

```
rpa-builder/
├── backend/                    # FastAPI 後端
│   ├── app/
│   │   ├── api/               # API 路由
│   │   ├── core/              # 核心模組
│   │   │   ├── blocks.py      # Block 定義
│   │   │   ├── desktop.py     # 桌面控制
│   │   │   ├── engine.py      # 執行引擎
│   │   │   └── image_finder.py # 圖像辨識
│   │   ├── models/            # 資料模型
│   │   ├── schemas/           # Pydantic schemas
│   │   └── main.py            # 應用程式入口
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # Electron + React 前端
│   ├── src/
│   │   ├── main/              # Electron 主進程
│   │   ├── renderer/          # React 渲染進程
│   │   │   ├── components/    # UI 元件
│   │   │   ├── blocks/        # Blockly 定義
│   │   │   ├── services/      # API 服務
│   │   │   └── types/         # TypeScript 類型
│   │   └── preload/
│   ├── package.json
│   └── vite.config.ts
├── scripts/                    # 用戶腳本存放
├── images/                     # 模板圖片存放
└── docker-compose.yml
```

## 🚀 快速開始

### 前置需求

- Python 3.11+
- Node.js 18+
- pnpm (或 npm)

### 開發模式

#### 一鍵啟動（推薦）

直接雙擊 `start-dev.bat` 即可同時啟動後端和前端。

或在 PowerShell 中執行：
```powershell
.\start-dev.ps1
```

#### 手動啟動

**1. 啟動後端**

```bash
cd backend
pip install -r requirements.txt
python run.py
```

後端將在 http://127.0.0.1:8000 啟動，API 文件：http://127.0.0.1:8000/docs

**2. 啟動前端 (Electron)**

```bash
cd frontend
npm install
npm run dev
```

開發伺服器將在 http://localhost:5173 啟動

**3. 啟動 Electron**

```bash
cd frontend
npm run start
```

### 生產打包

**打包後端**

```bash
cd backend
pip install pyinstaller
pyinstaller pyinstaller.spec
```

**打包前端 (含 Electron)**

```bash
cd frontend
npm run package
```

## 📖 Block 類型

### 動作類 (Actions)

| Block | 說明 |
|-------|------|
| 點擊圖片 | 找到圖片並點擊 |
| 點擊座標 | 點擊指定座標 |
| 雙擊圖片 | 找到圖片並雙擊 |
| 右鍵圖片 | 找到圖片並右鍵 |
| 輸入文字 | 模擬鍵盤輸入 |
| 快捷鍵 | 執行組合鍵 |
| 滾動 | 滾動滑鼠滾輪 |
| 拖放 | 從 A 拖到 B |
| 等待 | 等待指定秒數 |
| 等待圖片出現 | 等待直到圖片出現 |
| 等待圖片消失 | 等待直到圖片消失 |

### 控制類 (Control)

| Block | 說明 |
|-------|------|
| 如果圖片存在 | 條件分支 |
| 重複 N 次 | 固定次數迴圈 |
| 當圖片存在時重複 | 條件迴圈 |
| 重複直到圖片出現 | 條件迴圈 |
| 跳出迴圈 | 中斷當前迴圈 |
| 繼續下一輪 | 跳過本輪迴圈 |

### 變數類 (Variables)

| Block | 說明 |
|-------|------|
| 設定變數 | 設定變數值 |
| 取得變數 | 讀取變數值 |
| 儲存座標 | 將找到的座標存入變數 |

### 進階類 (Advanced)

| Block | 說明 |
|-------|------|
| 執行子腳本 | 呼叫另一個腳本 |
| HTTP 請求 | 發送 HTTP 請求 |
| 執行命令 | 執行系統命令 |
| 記錄日誌 | 輸出日誌 |
| 截圖 | 儲存當前螢幕截圖 |

## 🔌 API 使用

### 執行腳本

```bash
# 同步執行（等待完成）
curl -X POST http://127.0.0.1:8000/api/execute/{script_id}

# 非同步執行（立即返回）
curl -X POST http://127.0.0.1:8000/api/execute/{script_id}/async

# 帶參數執行
curl -X POST http://127.0.0.1:8000/api/execute/{script_id} \
  -H "Content-Type: application/json" \
  -d '{"variables": {"username": "admin", "password": "123456"}}'
```

### 腳本管理

```bash
# 取得所有腳本
curl http://127.0.0.1:8000/api/scripts

# 建立腳本
curl -X POST http://127.0.0.1:8000/api/scripts \
  -H "Content-Type: application/json" \
  -d '{"name": "My Script", "blocks": []}'

# 匯出腳本
curl http://127.0.0.1:8000/api/scripts/{script_id}/export
```

### 截圖工具

```bash
# 擷取全螢幕
curl http://127.0.0.1:8000/api/capture/screen -o screenshot.png

# 測試圖片辨識
curl -X POST http://127.0.0.1:8000/api/capture/test \
  -H "Content-Type: application/json" \
  -d '{"template_path": "button.png", "confidence": 0.8}'
```

## ⌨️ 快捷鍵

| 快捷鍵 | 功能 |
|--------|------|
| Ctrl+Shift+S | 啟動截圖模式 |
| Escape | 取消截圖 / 取消操作 |

## ⚠️ 注意事項

1. **中文輸入**: 自動使用剪貼簿方式輸入，支援中文及特殊字元
2. **多螢幕**: 支援多螢幕環境，座標系統涵蓋所有螢幕
3. **權限要求**:
   - Windows: 可能需要管理員權限
   - macOS: 需要授予輔助使用權限
4. **安全機制**: 滑鼠移到螢幕左上角可中斷執行 (Failsafe)
5. **API 認證**: 可在 `.env` 設定 `API_KEY` 啟用認證

## 📄 License

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！
