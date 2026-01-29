/**
 * 圖片截取元件 - 支援偏移選取
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface ImageCaptureProps {
  onCapture: (imageData: string, name: string, offsetX?: number, offsetY?: number) => void
  onCancel: () => void
  /** 是否啟用偏移選取功能 */
  enableOffsetPick?: boolean
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
  enableOffsetPick = false,
}) => {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [selection, setSelection] = useState<SelectionRect | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [imageName, setImageName] = useState('')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedSize, setCapturedSize] = useState<{ width: number; height: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // 偏移選取相關狀態
  const [clickOffset, setClickOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [hoverOffset, setHoverOffset] = useState<{ x: number; y: number } | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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
      setCapturedSize({ width: w, height: h })
      setClickOffset({ x: 0, y: 0 }) // 重置偏移
      setShowNameDialog(true)
    }
    img.src = screenshot
  }, [selection, screenshot])

  // 處理預覽圖片上的點擊（設定偏移）
  const handlePreviewClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableOffsetPick || !capturedSize || !previewRef.current) return
    
    const rect = previewRef.current.getBoundingClientRect()
    const img = previewRef.current.querySelector('img')
    if (!img) return
    
    const imgRect = img.getBoundingClientRect()
    
    // 計算點擊位置相對於圖片的座標
    const clickX = e.clientX - imgRect.left
    const clickY = e.clientY - imgRect.top
    
    // 計算縮放比例
    const scaleX = capturedSize.width / imgRect.width
    const scaleY = capturedSize.height / imgRect.height
    
    // 計算實際圖片座標
    const actualX = clickX * scaleX
    const actualY = clickY * scaleY
    
    // 計算相對於圖片中心的偏移
    const centerX = capturedSize.width / 2
    const centerY = capturedSize.height / 2
    const offsetX = Math.round(actualX - centerX)
    const offsetY = Math.round(actualY - centerY)
    
    setClickOffset({ x: offsetX, y: offsetY })
  }, [enableOffsetPick, capturedSize])

  // 處理預覽圖片上的滑鼠移動（顯示即時偏移）
  const handlePreviewMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableOffsetPick || !capturedSize || !previewRef.current) return
    
    const img = previewRef.current.querySelector('img')
    if (!img) return
    
    const imgRect = img.getBoundingClientRect()
    
    // 計算點擊位置相對於圖片的座標
    const clickX = e.clientX - imgRect.left
    const clickY = e.clientY - imgRect.top
    
    // 檢查是否在圖片範圍內
    if (clickX < 0 || clickX > imgRect.width || clickY < 0 || clickY > imgRect.height) {
      setHoverOffset(null)
      return
    }
    
    // 計算縮放比例
    const scaleX = capturedSize.width / imgRect.width
    const scaleY = capturedSize.height / imgRect.height
    
    // 計算實際圖片座標
    const actualX = clickX * scaleX
    const actualY = clickY * scaleY
    
    // 計算相對於圖片中心的偏移
    const centerX = capturedSize.width / 2
    const centerY = capturedSize.height / 2
    const offsetX = Math.round(actualX - centerX)
    const offsetY = Math.round(actualY - centerY)
    
    setHoverOffset({ x: offsetX, y: offsetY })
  }, [enableOffsetPick, capturedSize])

  // 確認儲存
  const handleSave = () => {
    if (capturedImage && imageName.trim()) {
      if (enableOffsetPick) {
        onCapture(capturedImage, imageName.trim(), clickOffset.x, clickOffset.y)
      } else {
        onCapture(capturedImage, imageName.trim())
      }
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
              {/* 預覽（支援偏移選取） */}
              {capturedImage && (
                <div 
                  ref={previewRef}
                  className={`rounded-lg overflow-hidden bg-surface-800 relative ${enableOffsetPick ? 'cursor-crosshair' : ''}`}
                  onClick={handlePreviewClick}
                  onMouseMove={handlePreviewMouseMove}
                  onMouseLeave={() => setHoverOffset(null)}
                >
                  <img
                    src={capturedImage}
                    alt="Preview"
                    className="w-full max-h-48 object-contain"
                    draggable={false}
                  />
                  
                  {/* 偏移選取提示 */}
                  {enableOffsetPick && (
                    <>
                      {/* 中心點標示 */}
                      <div 
                        className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white pointer-events-none"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: 'translate(-50%, -50%)',
                        }}
                      />
                      
                      {/* 選取的偏移點 */}
                      {(clickOffset.x !== 0 || clickOffset.y !== 0) && capturedSize && (
                        <div 
                          className="absolute w-3 h-3 bg-blue-500 rounded-full border-2 border-white pointer-events-none"
                          style={{
                            left: `calc(50% + ${clickOffset.x / capturedSize.width * 100}%)`,
                            top: `calc(50% + ${clickOffset.y / capturedSize.height * 100}%)`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 偏移選取說明和數值 */}
              {enableOffsetPick && (
                <div className="bg-surface-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-surface-400">
                    <span className="w-3 h-3 bg-green-500 rounded-full inline-block" />
                    <span>圖片中心</span>
                    <span className="w-3 h-3 bg-blue-500 rounded-full inline-block ml-2" />
                    <span>點擊位置</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-surface-300">偏移值：</span>
                    <span className="font-mono text-primary-400">
                      X: {hoverOffset?.x ?? clickOffset.x}, Y: {hoverOffset?.y ?? clickOffset.y}
                    </span>
                  </div>
                  <p className="text-xs text-surface-500">
                    點擊圖片上的位置來設定偏移（預設為中心）
                  </p>
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
