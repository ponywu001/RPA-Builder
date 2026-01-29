/**
 * Electron Preload 腳本
 * 在渲染進程中暴露安全的 API
 */

import { contextBridge, ipcRenderer } from 'electron'

// 暴露給渲染進程的 API
contextBridge.exposeInMainWorld('electronAPI', {
  // 截圖相關
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  getScreenInfo: () => ipcRenderer.invoke('get-screen-info'),
  
  // 後端相關
  getBackendUrl: () => ipcRenderer.invoke('get-backend-url'),
  
  // 視窗控制
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  restoreWindow: () => ipcRenderer.send('restore-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // 事件監聽
  onStartCapture: (callback: () => void) => {
    ipcRenderer.on('start-capture', callback)
    return () => ipcRenderer.removeListener('start-capture', callback)
  },
  onCancelCapture: (callback: () => void) => {
    ipcRenderer.on('cancel-capture', callback)
    return () => ipcRenderer.removeListener('cancel-capture', callback)
  },
})

// TypeScript 類型定義
declare global {
  interface Window {
    electronAPI: {
      captureScreen: () => Promise<string | null>
      getScreenInfo: () => Promise<Array<{
        index: number
        bounds: { x: number; y: number; width: number; height: number }
        workArea: { x: number; y: number; width: number; height: number }
        scaleFactor: number
      }>>
      getBackendUrl: () => Promise<string>
      minimizeWindow: () => void
      restoreWindow: () => void
      maximizeWindow: () => void
      closeWindow: () => void
      onStartCapture: (callback: () => void) => () => void
      onCancelCapture: (callback: () => void) => () => void
    }
  }
}
