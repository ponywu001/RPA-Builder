/**
 * 圖片截取元件
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ImageCaptureProps {
  onCapture: (imageData: string, name: string) => void
  onCancel: () => void
}

interface SelectionRect {
  startX: number
  startY: number
  endX: number
  endY: number
}

const ImageCapture: React.FC<ImageCaptureProps> = ({
  onCapture,
  onCancel,
}) => {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [imageName, setImageName] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 載入螢幕截圖
  useEffect(() => {
    const loadScreenshot = async () => {
      try {
        // 優先使用 Electron API
        if (window.electronAPI) {
          const dataUrl = await window.electronAPI.captureScreen()
          if (dataUrl) {
            setScreenshot(dataUrl)
            return
          }
        }
        
        // 備用：使用後端 API（透過 Vite 代理）
        const response = await fetch('/api/capture/screen')
        if (response.ok) {
          const blob = await response.blob()
          const dataUrl = await blobToDataUrl(blob)
          setScreenshot(dataUrl)
        } else {
          throw new Error('無法擷取螢幕')
        }
      } catch (err) {
        console.error('截圖失敗:', err)
        setError('截圖功能需要後端服務運行中')
        setTimeout(onCancel, 2000)
      }
    }

    loadScreenshot()
  }, [onCancel])

  // Blob 轉 Data URL
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // 繪製畫面
  useEffect(() => {
    if (!screenshot || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height

      // 繪製原圖（變暗）
      ctx.drawImage(img, 0, 0)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 繪製選取區域
      if (selection) {
        const x = Math.min(selection.startX, selection.endX)
        const y = Math.min(selection.startY, selection.endY)
        const w = Math.abs(selection.endX - selection.startX)
        const h = Math.abs(selection.endY - selection.startY)

        if (w > 0 && h > 0) {
          // 清除選取區域的遮罩
          ctx.save()
          ctx.beginPath()
          ctx.rect(x, y, w, h)
          ctx.clip()
          ctx.drawImage(img, 0, 0)
          ctx.restore()

          // 繪製邊框
          ctx.strokeStyle = '#0ea5e9'
          ctx.lineWidth = 2
          ctx.strokeRect(x, y, w, h)

          // 繪製尺寸資訊
          ctx.fillStyle = '#0ea5e9'
          ctx.fillRect(x, y - 24, 80, 20)
          ctx.fillStyle = '#fff'
          ctx.font = '12px JetBrains Mono'
          ctx.fillText(`${w} x ${h}`, x + 4, y - 8)
        }
      }
    }
    img.src = screenshot
  }, [screenshot, selection])

  // 開始選取
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setSelection({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
    })
    setIsSelecting(true)
  }, [])

  // 選取中
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isSelecting || !selection) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    setSelection({
      ...selection,
      endX: x,
      endY: y,
    })
  }, [isSelecting, selection])

  // 結束選取
  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !selection) return
    setIsSelecting(false)

    const w = Math.abs(selection.endX - selection.startX)
    const h = Math.abs(selection.endY - selection.startY)

    if (w > 10 && h > 10) {
      // 擷取選取區域
      captureSelection()
    }
  }, [isSelecting, selection])

  // 擷取選取區域
  const captureSelection = useCallback(() => {
    if (!selection || !screenshot) return

    const x = Math.min(selection.startX, selection.endX)
    const y = Math.min(selection.startY, selection.endY)
    const w = Math.abs(selection.endX - selection.startX)
    const h = Math.abs(selection.endY - selection.startY)

    if (w < 10 || h < 10) return

    // 建立臨時 canvas 擷取選取區域
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext('2d')
    if (!tempCtx) return

    const img = new Image()
    img.onload = () => {
      tempCtx.drawImage(img, x, y, w, h, 0, 0, w, h)
      const imageData = tempCanvas.toDataURL('image/png')
      setCapturedImage(imageData)
      setShowNameDialog(true)
    }
    img.src = screenshot
  }, [selection, screenshot])

  // 確認儲存
  const handleSave = () => {
    if (capturedImage && imageName.trim()) {
      onCapture(capturedImage, imageName.trim())
    }
  }

  // 鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNameDialog) {
          setShowNameDialog(false)
        } else {
          onCancel()
        }
      } else if (e.key === 'Enter' && showNameDialog && imageName.trim()) {
        handleSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showNameDialog, imageName, onCancel])

  // 錯誤狀態
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">⚠</div>
          <p className="text-white">{error}</p>
        </div>
      </div>
    )
  }

  // 載入中
  if (!screenshot) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>擷取螢幕中...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] cursor-crosshair overflow-hidden"
    >
      {/* 截圖畫布 - 移除 object-contain 避免座標偏移 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ width: '100vw', height: '100vh' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* 說明文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-900/90 rounded-lg text-sm text-surface-300">
        拖曳選取要擷取的區域 · 按 ESC 取消
      </div>

      {/* 命名對話框 */}
      {showNameDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
          <div className="panel w-96 animate-slide-up">
            <div className="panel-header">
              儲存截圖
            </div>
            <div className="panel-body space-y-4">
              {/* 預覽 */}
              {capturedImage && (
                <div className="rounded-lg overflow-hidden bg-surface-800">
                  <img
                    src={capturedImage}
                    alt="Preview"
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}

              {/* 名稱輸入 */}
              <div>
                <label className="block text-sm text-surface-300 mb-1">
                  圖片名稱
                </label>
                <input
                  type="text"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="例如: login_button"
                  className="input"
                  autoFocus
                />
              </div>

              {/* 按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNameDialog(false)
                    setSelection(null)
                  }}
                  className="btn btn-secondary flex-1"
                >
                  重新選取
                </button>
                <button
                  onClick={handleSave}
                  disabled={!imageName.trim()}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageCapture
