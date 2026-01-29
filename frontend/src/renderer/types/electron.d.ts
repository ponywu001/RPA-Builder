/**
 * Electron API 類型定義
 */

interface ElectronAPI {
  captureScreen: () => Promise<string | null>
  getScreenInfo: () => Promise<{
    index: number
    bounds: { x: number; y: number; width: number; height: number }
    workArea: { x: number; y: number; width: number; height: number }
    scaleFactor: number
  }[]>
  getBackendUrl: () => Promise<string>
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  onStartCapture: (callback: () => void) => void
  onCancelCapture: (callback: () => void) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

export {}
