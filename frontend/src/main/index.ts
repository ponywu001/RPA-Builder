/**
 * Electron 主進程
 */

import { app, BrowserWindow, ipcMain, screen, globalShortcut, desktopCapturer } from 'electron'
import * as path from 'path'
import { spawn, ChildProcess } from 'child_process'

let mainWindow: BrowserWindow | null = null
let backendProcess: ChildProcess | null = null

// 後端 API URL
const BACKEND_URL = 'http://127.0.0.1:8000'

/**
 * 啟動後端服務
 */
function startBackend(): void {
  const isDev = !app.isPackaged

  if (isDev) {
    // 開發模式：假設後端已手動啟動
    console.log('開發模式：請確保後端服務已啟動於', BACKEND_URL)
    return
  }

  // 生產模式：啟動打包的後端
  const backendPath = path.join(process.resourcesPath, 'backend', 'rpa-engine.exe')
  
  console.log('啟動後端服務:', backendPath)
  
  backendProcess = spawn(backendPath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    detached: false,
  })

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[Backend] ${data}`)
  })

  backendProcess.stderr?.on('data', (data) => {
    console.error(`[Backend Error] ${data}`)
  })

  backendProcess.on('error', (err) => {
    console.error('後端啟動失敗:', err)
  })

  backendProcess.on('close', (code) => {
    console.log(`後端進程結束，退出碼: ${code}`)
    backendProcess = null
  })
}

/**
 * 停止後端服務
 */
function stopBackend(): void {
  if (backendProcess) {
    console.log('停止後端服務')
    backendProcess.kill()
    backendProcess = null
  }
}

/**
 * 建立主視窗
 */
function createWindow(): void {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize

  mainWindow = new BrowserWindow({
    width: Math.min(1600, width - 100),
    height: Math.min(900, height - 100),
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#020617',
    show: false,
  })

  // 載入頁面
  const isDev = !app.isPackaged

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 註冊全域快捷鍵
  registerShortcuts()
}

/**
 * 註冊全域快捷鍵
 */
function registerShortcuts(): void {
  // Ctrl+Shift+S: 截圖模式
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    mainWindow?.webContents.send('start-capture')
  })

  // Escape: 取消截圖模式
  globalShortcut.register('Escape', () => {
    mainWindow?.webContents.send('cancel-capture')
  })
}

/**
 * IPC 處理器
 */
function setupIPC(): void {
  // 取得螢幕截圖（先最小化視窗）
  ipcMain.handle('capture-screen', async () => {
    // 先最小化視窗
    if (mainWindow && !mainWindow.isMinimized()) {
      mainWindow.minimize()
      // 等待視窗最小化動畫完成
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.size
    const scaleFactor = primaryDisplay.scaleFactor
    
    // 使用實際像素大小（考慮 DPI 縮放）
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.floor(width * scaleFactor),
        height: Math.floor(height * scaleFactor),
      },
    })

    // 截圖完成後恢復視窗
    if (mainWindow) {
      mainWindow.restore()
      mainWindow.focus()
    }

    if (sources.length > 0) {
      return sources[0].thumbnail.toDataURL()
    }

    return null
  })

  // 取得螢幕資訊
  ipcMain.handle('get-screen-info', () => {
    const displays = screen.getAllDisplays()
    return displays.map((display, index) => ({
      index,
      bounds: display.bounds,
      workArea: display.workArea,
      scaleFactor: display.scaleFactor,
    }))
  })

  // 取得後端 URL
  ipcMain.handle('get-backend-url', () => {
    return BACKEND_URL
  })

  // 最小化視窗
  ipcMain.on('minimize-window', () => {
    mainWindow?.minimize()
  })

  // 最大化/還原視窗
  ipcMain.on('maximize-window', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow?.maximize()
    }
  })

  // 關閉視窗
  ipcMain.on('close-window', () => {
    mainWindow?.close()
  })
}

// 應用程式事件
app.whenReady().then(() => {
  startBackend()
  setupIPC()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  stopBackend()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
  stopBackend()
})
