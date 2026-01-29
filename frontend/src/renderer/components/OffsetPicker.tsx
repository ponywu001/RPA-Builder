/**
 * 偏移選取元件 - 選取相對於圖片中心的偏移位置
 */

import React, { useState, useRef, useEffect, useCallback } from 'react'

interface OffsetPickerProps {
  imagePath: string  // 圖片路徑（用於在螢幕上找到圖片）
  onPick: (offsetX: number, offsetY: number) => void
  onCancel: () => void
}

interface ImagePosition {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

const OffsetPicker: React.FC<OffsetPickerProps> = ({
  imagePath,
  onPick,
  onCancel,
}) => {
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [screenshotImg, setScreenshotImg] = useState<HTMLImageElement | null>(null)
  const [imagePosition, setImagePosition] = useState<ImagePosition | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const magnifierRef = useRef<HTMLCanvasElement>(null)
  
  // 放大鏡設定
  const MAGNIFIER_SIZE = 150  // 放大鏡大小
  const ZOOM_LEVEL = 4        // 放大倍率

  // 載入螢幕截圖並尋找圖片
  useEffect(() => {
    const loadScreenshotAndFindImage = async () => {
      try {
        setLoading(true)
        
        // 先最小化視窗，避免擋住目標圖片
        if (window.electronAPI) {
          window.electronAPI.minimizeWindow()
          // 等待視窗最小化動畫
          await new Promise(resolve => setTimeout(resolve, 500))
        }
        
        // 1. 尋找圖片位置（在擷取螢幕之前，確保能找到圖片）
        const findResponse = await fetch(`/api/capture/find?image_path=${encodeURIComponent(imagePath)}`)
        
        let position = null
        if (findResponse.ok) {
          position = await findResponse.json()
        }
        
        // 2. 擷取螢幕
        let screenshotData: string | null = null
        
        if (window.electronAPI) {
          screenshotData = await window.electronAPI.captureScreen()
        } else {
          const response = await fetch('/api/capture/screen')
          if (response.ok) {
            const blob = await response.blob()
            screenshotData = await blobToDataUrl(blob)
          }
        }
        
        // 恢復視窗（不需要，因為 OffsetPicker 會覆蓋整個螢幕）
        
        if (!screenshotData) {
          if (window.electronAPI) {
            window.electronAPI.restoreWindow()
          }
          throw new Error('無法擷取螢幕')
        }
        
        setScreenshot(screenshotData)
        
        if (position) {
          setImagePosition(position)
        } else {
          setError(`螢幕上找不到圖片: ${imagePath}\n請確保圖片在目前螢幕上可見`)
        }
        
      } catch (err) {
        console.error('載入失敗:', err)
        setError('載入失敗，請確認後端服務運行中')
        if (window.electronAPI) {
          window.electronAPI.restoreWindow()
        }
      } finally {
        setLoading(false)
      }
    }

    loadScreenshotAndFindImage()
  }, [imagePath])

  // Blob 轉 Data URL
  const blobToDataUrl = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // 載入截圖為 Image 物件
  useEffect(() => {
    if (!screenshot) return
    
    const img = new Image()
    img.onload = () => {
      setScreenshotImg(img)
    }
    img.src = screenshot
  }, [screenshot])

  // 繪製主畫面
  useEffect(() => {
    if (!screenshotImg || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = screenshotImg.width
    canvas.height = screenshotImg.height

    // 繪製原圖（稍微變暗）
    ctx.drawImage(screenshotImg, 0, 0)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 繪製找到的圖片位置
    if (imagePosition) {
      const imgX = imagePosition.x - imagePosition.width / 2
      const imgY = imagePosition.y - imagePosition.height / 2
      
      // 高亮圖片區域
      ctx.save()
      ctx.beginPath()
      ctx.rect(imgX, imgY, imagePosition.width, imagePosition.height)
      ctx.clip()
      ctx.drawImage(screenshotImg, 0, 0)
      ctx.restore()
      
      // 繪製圖片邊框
      ctx.strokeStyle = '#22c55e'
      ctx.lineWidth = 3
      ctx.strokeRect(imgX, imgY, imagePosition.width, imagePosition.height)
      
      // 繪製圖片中心點
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(imagePosition.x, imagePosition.y, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(imagePosition.x, imagePosition.y, 4, 0, Math.PI * 2)
      ctx.fill()
      
      // 標註「圖片中心」
      ctx.font = 'bold 12px JetBrains Mono'
      ctx.fillStyle = '#22c55e'
      ctx.fillText('圖片中心', imagePosition.x + 12, imagePosition.y + 4)
    }

    // 繪製滑鼠位置和偏移線
    if (mousePos && imagePosition) {
      const offsetX = mousePos.x - imagePosition.x
      const offsetY = mousePos.y - imagePosition.y
      
      // 繪製從圖片中心到滑鼠位置的線
      ctx.strokeStyle = '#0ea5e9'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(imagePosition.x, imagePosition.y)
      ctx.lineTo(mousePos.x, mousePos.y)
      ctx.stroke()
      ctx.setLineDash([])
      
      // 繪製滑鼠位置點
      ctx.fillStyle = '#0ea5e9'
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(mousePos.x, mousePos.y, 3, 0, Math.PI * 2)
      ctx.fill()

      // 繪製偏移資訊
      const text = `偏移: (${offsetX >= 0 ? '+' : ''}${offsetX}, ${offsetY >= 0 ? '+' : ''}${offsetY})`
      ctx.font = 'bold 14px JetBrains Mono'
      const textWidth = ctx.measureText(text).width
      
      let labelX = mousePos.x + 15
      let labelY = mousePos.y - 15
      
      if (labelX + textWidth + 10 > canvas.width) {
        labelX = mousePos.x - textWidth - 25
      }
      if (labelY < 30) {
        labelY = mousePos.y + 30
      }
      
      ctx.fillStyle = '#0ea5e9'
      ctx.fillRect(labelX - 5, labelY - 18, textWidth + 10, 24)
      ctx.fillStyle = '#fff'
      ctx.fillText(text, labelX, labelY)
    }
  }, [screenshotImg, imagePosition, mousePos])

  // 繪製放大鏡
  useEffect(() => {
    if (!screenshotImg || !magnifierRef.current || !mousePos) return

    const magnifier = magnifierRef.current
    const ctx = magnifier.getContext('2d')
    if (!ctx) return

    magnifier.width = MAGNIFIER_SIZE
    magnifier.height = MAGNIFIER_SIZE

    // 計算要擷取的區域（以滑鼠位置為中心）
    const sourceSize = MAGNIFIER_SIZE / ZOOM_LEVEL
    const sourceX = mousePos.x - sourceSize / 2
    const sourceY = mousePos.y - sourceSize / 2

    // 填充背景
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE)

    // 繪製放大的圖片區域
    ctx.drawImage(
      screenshotImg,
      sourceX, sourceY, sourceSize, sourceSize,
      0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE
    )

    // 繪製網格線（幫助對齊）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    const gridSize = ZOOM_LEVEL * 10
    for (let i = gridSize; i < MAGNIFIER_SIZE; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, MAGNIFIER_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(MAGNIFIER_SIZE, i)
      ctx.stroke()
    }

    // 繪製十字準心
    const center = MAGNIFIER_SIZE / 2
    ctx.strokeStyle = '#f43f5e'
    ctx.lineWidth = 2
    
    // 水平線
    ctx.beginPath()
    ctx.moveTo(0, center)
    ctx.lineTo(center - 8, center)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(center + 8, center)
    ctx.lineTo(MAGNIFIER_SIZE, center)
    ctx.stroke()
    
    // 垂直線
    ctx.beginPath()
    ctx.moveTo(center, 0)
    ctx.lineTo(center, center - 8)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(center, center + 8)
    ctx.lineTo(center, MAGNIFIER_SIZE)
    ctx.stroke()

    // 繪製邊框
    ctx.strokeStyle = '#0ea5e9'
    ctx.lineWidth = 3
    ctx.strokeRect(0, 0, MAGNIFIER_SIZE, MAGNIFIER_SIZE)
  }, [screenshotImg, mousePos])

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
    if (!imagePosition) return
    
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)

    const offsetX = x - imagePosition.x
    const offsetY = y - imagePosition.y

    onPick(offsetX, offsetY)
  }, [imagePosition, onPick])

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

  // 載入中
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-white text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>正在擷取螢幕並尋找圖片...</p>
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-2">⚠</div>
          <p className="text-white mb-4">{error}</p>
          <button
            onClick={onCancel}
            className="btn btn-secondary"
          >
            關閉
          </button>
        </div>
      </div>
    )
  }

  // 計算放大鏡位置（避免超出螢幕邊界）
  const getMagnifierPosition = () => {
    if (!mousePos || !canvasRef.current) return { left: 0, top: 0 }
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = rect.width / canvas.width
    const scaleY = rect.height / canvas.height
    
    // 將 canvas 座標轉換為螢幕座標
    const screenX = mousePos.x * scaleX
    const screenY = mousePos.y * scaleY
    
    // 預設放在滑鼠右下方
    let left = screenX + 20
    let top = screenY + 20
    
    // 如果超出右邊界，放到左邊
    if (left + MAGNIFIER_SIZE > window.innerWidth) {
      left = screenX - MAGNIFIER_SIZE - 20
    }
    
    // 如果超出下邊界，放到上面
    if (top + MAGNIFIER_SIZE > window.innerHeight - 60) {
      top = screenY - MAGNIFIER_SIZE - 20
    }
    
    // 確保不會超出左邊和上邊
    left = Math.max(10, left)
    top = Math.max(10, top)
    
    return { left, top }
  }

  const magnifierPos = getMagnifierPosition()

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

      {/* 放大鏡 */}
      {mousePos && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: magnifierPos.left,
            top: magnifierPos.top,
          }}
        >
          <canvas
            ref={magnifierRef}
            className="rounded-lg shadow-2xl"
            style={{
              width: MAGNIFIER_SIZE,
              height: MAGNIFIER_SIZE,
            }}
          />
          {/* 放大鏡標籤 */}
          <div className="absolute -bottom-6 left-0 right-0 text-center text-xs text-surface-400">
            {ZOOM_LEVEL}x 放大
          </div>
        </div>
      )}

      {/* 說明文字 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-surface-900/90 rounded-lg text-sm text-surface-300">
        <span className="text-green-400">綠點</span> = 圖片中心 · 
        點擊選取偏移位置 · 按 ESC 取消
      </div>

      {/* 當前偏移顯示 */}
      {mousePos && imagePosition && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-primary-500 rounded-lg text-white font-mono">
          偏移 X: {mousePos.x - imagePosition.x} · Y: {mousePos.y - imagePosition.y}
        </div>
      )}
    </div>
  )
}

export default OffsetPicker
