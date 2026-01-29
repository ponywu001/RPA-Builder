/**
 * 位置選取元件 - 在螢幕上點選位置取得座標
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface PositionPickerProps {
  onPick: (x: number, y: number) => void
  onCancel: () => void
}

const PositionPicker: React.FC<PositionPickerProps> = ({
  onPick,
  onCancel,
}) => {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
        
        // 備用：使用後端 API
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

      // 繪製原圖
      ctx.drawImage(img, 0, 0)

      // 繪製十字準心
      if (mousePos) {
        const { x, y } = mousePos
        
        // 半透明遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 清除十字區域
        ctx.clearRect(x - 1, 0, 2, canvas.height)
        ctx.clearRect(0, y - 1, canvas.width, 2)
        ctx.drawImage(img, x - 1, 0, 2, canvas.height, x - 1, 0, 2, canvas.height)
        ctx.drawImage(img, 0, y - 1, canvas.width, 2, 0, y - 1, canvas.width, 2)
        
        // 繪製十字線
        ctx.strokeStyle = '#0ea5e9'
        ctx.lineWidth = 1
        ctx.setLineDash([5, 5])
        
        // 垂直線
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
        
        // 水平線
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
        
        ctx.setLineDash([])
        
        // 繪製中心點
        ctx.fillStyle = '#0ea5e9'
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fill()
        
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fill()

        // 繪製座標資訊
        const text = `(${x}, ${y})`
        ctx.font = 'bold 14px JetBrains Mono'
        const textWidth = ctx.measureText(text).width
        
        // 座標標籤位置
        let labelX = x + 15
        let labelY = y - 15
        
        // 確保標籤在螢幕內
        if (labelX + textWidth + 10 > canvas.width) {
          labelX = x - textWidth - 25
        }
        if (labelY < 30) {
          labelY = y + 30
        }
        
        // 標籤背景
        ctx.fillStyle = '#0ea5e9'
        ctx.fillRect(labelX - 5, labelY - 18, textWidth + 10, 24)
        
        // 標籤文字
        ctx.fillStyle = '#fff'
        ctx.fillText(text, labelX, labelY)
      }
    }
    img.src = screenshot
  }, [screenshot, mousePos])

  // 滑鼠移動
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)

    setMousePos({ x, y })
  }, [])

  // 點擊選取
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)

    onPick(x, y)
  }, [onPick])

  // 鍵盤事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

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
    <div className="fixed inset-0 z-[9999] cursor-crosshair overflow-hidden">
      {/* 截圖畫布 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        style={{ width: '100vw', height: '100vh' }}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* 說明文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-900/90 rounded-lg text-sm text-surface-300">
        點擊螢幕選取座標 · 按 ESC 取消
      </div>

      {/* 當前座標顯示 */}
      {mousePos && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary-500 rounded-lg text-white font-mono">
          X: {mousePos.x} · Y: {mousePos.y}
        </div>
      )}
    </div>
  )
}

export default PositionPicker
