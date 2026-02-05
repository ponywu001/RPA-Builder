/**
 * 錄製面板 - 控制動作錄製
 */

import React, { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'

interface RecorderPanelProps {
  isVisible: boolean
  onToggle: () => void
  onInsertBlocks: (blocks: any[]) => void
}

interface RecordedAction {
  action_id: string
  action_type: string
  timestamp: number
  params: Record<string, any>
  screenshot_path?: string
}

const RecorderPanel: React.FC<RecorderPanelProps> = ({
  isVisible,
  onToggle,
  onInsertBlocks,
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [actions, setActions] = useState<RecordedAction[]>([])
  const [actionCount, setActionCount] = useState(0)
  const [autoScreenshot, setAutoScreenshot] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 定期更新狀態
  useEffect(() => {
    if (!isVisible) return

    const updateStatus = async () => {
      try {
        const status = await api.getRecorderStatus()
        setIsRecording(status.is_recording)
        setActionCount(status.action_count)
      } catch (err) {
        // 忽略錯誤
      }
    }

    updateStatus()
    const interval = setInterval(updateStatus, 1000)

    return () => clearInterval(interval)
  }, [isVisible])

  // 開始錄製
  const handleStart = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await api.startRecording(autoScreenshot)
      setIsRecording(true)
      setActions([])
    } catch (err: any) {
      setError(err.message || '開始錄製失敗')
    } finally {
      setIsLoading(false)
    }
  }

  // 停止錄製
  const handleStop = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await api.stopRecording()
      setIsRecording(false)
      
      // 取得錄製的動作
      const recordedActions = await api.getRecordedActions()
      setActions(recordedActions)
    } catch (err: any) {
      setError(err.message || '停止錄製失敗')
    } finally {
      setIsLoading(false)
    }
  }

  // 清除錄製
  const handleClear = async () => {
    try {
      await api.clearRecording()
      setActions([])
      setActionCount(0)
    } catch (err: any) {
      setError(err.message || '清除失敗')
    }
  }

  // 插入到腳本
  const handleInsert = async () => {
    try {
      const blocks = await api.getRecordedBlocks()
      onInsertBlocks(blocks)
      onToggle()
    } catch (err: any) {
      setError(err.message || '取得 Blocks 失敗')
    }
  }

  // 動作類型名稱
  const getActionTypeName = (type: string): string => {
    const names: Record<string, string> = {
      click: '點擊',
      double_click: '雙擊',
      right_click: '右鍵點擊',
      drag: '拖曳',
      scroll: '滾動',
      key_press: '按鍵',
      type_text: '輸入文字',
      hotkey: '快捷鍵',
      wait: '等待',
    }
    return names[type] || type
  }

  if (!isVisible) {
    return null // 不顯示浮動按鈕，由 Header 控制
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onToggle}
      />
      
      {/* 錄製面板 - 居中彈窗 */}
      <div
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 max-h-[80vh] flex flex-col z-50 rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
      {/* 標題列 */}
      <div
        className="h-10 px-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
      >
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${isRecording ? 'text-red-400 animate-pulse' : 'text-primary-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium text-surface-300">
            {isRecording ? '錄製中' : '動作錄製'}
          </span>
          {isRecording && (
            <span className="text-xs text-surface-500">({actionCount} 個動作)</span>
          )}
        </div>

        <button
          onClick={onToggle}
          className="p-1.5 rounded hover:bg-surface-700 transition-colors"
          title="關閉"
        >
          <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 控制區 */}
      <div className="p-4 space-y-4" style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}>
        {/* 設置 */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoScreenshot}
            onChange={(e) => setAutoScreenshot(e.target.checked)}
            disabled={isRecording}
            className="w-4 h-4 rounded border-surface-600 bg-surface-800 text-primary-500 focus:ring-primary-500"
          />
          <span className="text-sm text-surface-300">自動截圖（點擊時）</span>
        </label>

        {/* 按鈕 */}
        <div className="flex gap-2">
          {!isRecording ? (
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>開始錄製</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={isLoading}
              className="flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all bg-surface-700 hover:bg-surface-600 text-white disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>停止錄製</span>
            </button>
          )}
          
          <button
            onClick={handleClear}
            disabled={isRecording || actions.length === 0}
            className="py-2 px-3 rounded-lg transition-all bg-surface-700 hover:bg-surface-600 text-surface-300 disabled:opacity-50"
            title="清除錄製"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* 錯誤訊息 */}
        {error && (
          <div className="p-2 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* 動作列表 */}
      <div className="flex-1 overflow-auto p-4">
        {actions.length === 0 ? (
          <div className="text-center text-surface-500 py-8">
            {isRecording ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">等待動作...</p>
                <p className="text-xs text-surface-600">點擊、輸入或滾動將被記錄</p>
              </div>
            ) : (
              <>
                <p className="text-sm">尚無錄製的動作</p>
                <p className="text-xs mt-1">點擊「開始錄製」開始記錄</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {actions.map((action, index) => (
              <div
                key={action.action_id}
                className="p-2 rounded-lg bg-surface-800/50 border border-surface-700"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-surface-500 w-6">{index + 1}</span>
                  <span className="text-sm text-surface-300">{getActionTypeName(action.action_type)}</span>
                  {action.screenshot_path && (
                    <span className="text-xs text-green-400">📷</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-surface-500">
                  {JSON.stringify(action.params).slice(0, 50)}
                  {JSON.stringify(action.params).length > 50 && '...'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部操作 */}
      {actions.length > 0 && !isRecording && (
        <div
          className="p-4"
          style={{ borderTop: '1px solid rgba(71, 85, 105, 0.5)' }}
        >
          <button
            onClick={handleInsert}
            className="w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all bg-primary-500 hover:bg-primary-600 text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>插入到腳本 ({actions.length} 個動作)</span>
          </button>
        </div>
      )}
    </div>
    </>
  )
}

export default RecorderPanel
