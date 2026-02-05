/**
 * RPA Builder 主應用程式元件
 */

import React, { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import BlocklyEditor from './components/BlocklyEditor'
import PropertiesPanel from './components/PropertiesPanel'
import ExecutionPanel from './components/ExecutionPanel'
import ImageCapture from './components/ImageCapture'
import CodePreviewPanel from './components/CodePreviewPanel'
import RecorderPanel from './components/RecorderPanel'
import { Script, ExecutionStatus, Template } from './types'
import { api } from './services/api'
import { wsService } from './services/websocket'

const App: React.FC = () => {
  // 狀態
  const [scripts, setScripts] = useState<Script[]>([])
  const [currentScript, setCurrentScript] = useState<Script | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<any>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureConfig, setCaptureConfig] = useState<{
    enableOffsetPick: boolean
    targetBlockInstanceId?: string
  }>({ enableOffsetPick: false })
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null)
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Workspace 操作函數（由 BlocklyEditor 提供）
  const [workspaceActions, setWorkspaceActions] = useState<{
    updateBlock: (instanceId: string, fieldValues: Record<string, any>) => void
    undo: () => void
    redo: () => void
    canUndo: () => boolean
    canRedo: () => boolean
    highlightBlock: (instanceId: string | null) => void
  } | null>(null)
  
  // Undo/Redo 狀態（需要定期更新）
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  
  // 當前執行的 Block ID
  const [currentExecutingBlockId, setCurrentExecutingBlockId] = useState<string | null>(null)
  
  // 程式碼預覽面板顯示狀態
  const [showCodePreview, setShowCodePreview] = useState(false)
  
  // 錄製面板顯示狀態
  const [showRecorder, setShowRecorder] = useState(false)
  
  // 錄製狀態
  const [isRecording, setIsRecording] = useState(false)
  
  // 定期檢查錄製狀態
  useEffect(() => {
    const checkRecordingStatus = async () => {
      try {
        const status = await api.getRecorderStatus()
        setIsRecording(status.is_recording)
      } catch {
        // 忽略錯誤
      }
    }
    
    checkRecordingStatus()
    const interval = setInterval(checkRecordingStatus, 2000)
    return () => clearInterval(interval)
  }, [])

  // 初始化
  useEffect(() => {
    loadData()
    setupEventListeners()
    
    // 初始化 WebSocket 連接
    wsService.connect()
    
    // 訂閱 WebSocket 事件
    const unsubUpdate = wsService.on('execution_update', (data) => {
      setExecutionStatus(prev => prev ? {
        ...prev,
        status: data.status,
        progress: {
          current_step: data.progress.current_step,
          total_steps: data.progress.total_steps,
          current_block_id: data.current_block_id,
        },
        error: data.error,
      } : null)
      
      setCurrentExecutingBlockId(data.current_block_id || null)
      
      // 執行結束時清除高亮並恢復視窗
      if (!['running', 'paused'].includes(data.status)) {
        setCurrentExecutingBlockId(null)
        if (window.electronAPI) {
          window.electronAPI.restoreWindow()
        }
      }
      
      // 如果有日誌更新
      if (data.logs) {
        setLogs(data.logs)
      }
    })
    
    const unsubLog = wsService.on('log', (logEntry) => {
      setLogs(prev => [...prev, logEntry])
    })
    
    return () => {
      unsubUpdate()
      unsubLog()
      wsService.disconnect()
    }
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [scriptsData, templatesData] = await Promise.all([
        api.getScripts(),
        api.getTemplates(),
      ])
      setScripts(scriptsData)
      setTemplates(templatesData)
    } catch (error) {
      console.error('載入資料失敗:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const setupEventListeners = () => {
    // 監聽截圖快捷鍵
    if (window.electronAPI) {
      window.electronAPI.onStartCapture(() => {
        setIsCapturing(true)
      })
      window.electronAPI.onCancelCapture(() => {
        setIsCapturing(false)
      })
    }
  }

  // 腳本操作
  const handleNewScript = async () => {
    const name = `新腳本 ${scripts.length + 1}`
    try {
      const script = await api.createScript({ name, blocks: [] })
      setScripts([script, ...scripts])
      setCurrentScript(script)
    } catch (error) {
      console.error('建立腳本失敗:', error)
    }
  }

  const handleSelectScript = async (scriptId: string) => {
    try {
      const script = await api.getScript(scriptId)
      setCurrentScript(script)
    } catch (error) {
      console.error('載入腳本失敗:', error)
    }
  }

  const handleSaveScript = async (blocks: any[]) => {
    if (!currentScript) return

    console.log('[handleSaveScript] Saving blocks:', blocks.length, 'blocks', blocks)

    try {
      const updated = await api.updateScript(currentScript.id, { blocks })
      console.log('[handleSaveScript] Saved successfully, response:', updated)
      setCurrentScript(updated)
      setScripts(scripts.map(s => s.id === updated.id ? updated : s))
    } catch (error) {
      console.error('儲存腳本失敗:', error)
    }
  }

  const handleDeleteScript = async (scriptId: string) => {
    try {
      await api.deleteScript(scriptId)
      setScripts(scripts.filter(s => s.id !== scriptId))
      if (currentScript?.id === scriptId) {
        setCurrentScript(null)
      }
    } catch (error) {
      console.error('刪除腳本失敗:', error)
    }
  }

  const handleRenameScript = async (scriptId: string, newName: string) => {
    try {
      const updated = await api.updateScript(scriptId, { name: newName })
      setScripts(scripts.map(s => s.id === updated.id ? updated : s))
      if (currentScript?.id === scriptId) {
        setCurrentScript(updated)
      }
    } catch (error) {
      console.error('重新命名腳本失敗:', error)
    }
  }

  const handleExportScript = async (scriptId: string) => {
    try {
      const pythonCode = await api.exportScriptPython(scriptId)
      const script = scripts.find(s => s.id === scriptId)
      const scriptName = script?.name || 'script'
      
      // 建立並下載檔案
      const blob = new Blob([pythonCode], { type: 'text/x-python' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${scriptName.replace(/[^a-zA-Z0-9_\-]/g, '_')}.py`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('匯出腳本失敗:', error)
      alert('匯出失敗，請確認後端服務正在運行')
    }
  }

  const handleDuplicateScript = async (scriptId: string) => {
    try {
      const originalScript = scripts.find(s => s.id === scriptId)
      if (!originalScript) return
      
      // 複製腳本
      const newScript = await api.createScript({
        name: `${originalScript.name} (複製)`,
        blocks: originalScript.blocks,
      })
      
      setScripts([newScript, ...scripts])
      setCurrentScript(newScript)
    } catch (error) {
      console.error('複製腳本失敗:', error)
    }
  }

  // 執行操作（同步）
  const handleExecute = async () => {
    if (!currentScript) return

    setLogs([])
    
    // 執行前最小化視窗
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow()
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    try {
      const result = await api.executeScript(currentScript.id)
      setExecutionStatus(result)
      setLogs(result.logs || [])
    } catch (error) {
      console.error('執行腳本失敗:', error)
    } finally {
      // 執行結束，恢復視窗
      if (window.electronAPI) {
        window.electronAPI.restoreWindow()
      }
    }
  }

  const handleExecuteAsync = async () => {
    if (!currentScript) return

    setLogs([])
    
    // 執行前最小化視窗
    if (window.electronAPI) {
      window.electronAPI.minimizeWindow()
      // 等待視窗最小化動畫
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    try {
      const { execution_id } = await api.executeScriptAsync(currentScript.id)
      
      // 訂閱 WebSocket 更新
      wsService.subscribe(execution_id)
      
      // 設置初始狀態
      setExecutionStatus({
        execution_id,
        script_id: currentScript.id,
        script_name: currentScript.name,
        status: 'running',
        progress: {
          current_step: 0,
          total_steps: currentScript.blocks?.length || 0,
        },
        variables: {},
      })
      
      // 備用：輪詢狀態（如果 WebSocket 不可用）
      const pollStatus = async () => {
        try {
          const status = await api.getExecutionStatus(execution_id)
          setExecutionStatus(status)
          
          // 更新當前執行的 Block ID
          setCurrentExecutingBlockId(status.progress?.current_block_id || null)
          
          const logs = await api.getExecutionLogs(execution_id)
          setLogs(logs)

          if (status.status === 'running' || status.status === 'paused') {
            setTimeout(pollStatus, 500)
          } else {
            // 執行結束
            wsService.unsubscribe(execution_id)
            setCurrentExecutingBlockId(null)
            if (window.electronAPI) {
              window.electronAPI.restoreWindow()
            }
          }
        } catch (error) {
          console.error('取得狀態失敗:', error)
          wsService.unsubscribe(execution_id)
          setCurrentExecutingBlockId(null)
          if (window.electronAPI) {
            window.electronAPI.restoreWindow()
          }
        }
      }

      // 如果 WebSocket 未連接，使用輪詢作為備用
      if (!wsService.isConnected) {
        pollStatus()
      } else {
        // 仍然輪詢日誌，因為 WebSocket 可能不發送完整日誌
        const pollLogs = async () => {
          try {
            const status = await api.getExecutionStatus(execution_id)
            if (status.status === 'running' || status.status === 'paused') {
              const logs = await api.getExecutionLogs(execution_id)
              setLogs(logs)
              setTimeout(pollLogs, 1000)
            }
          } catch (error) {
            // 忽略錯誤
          }
        }
        setTimeout(pollLogs, 500)
      }
    } catch (error) {
      console.error('執行腳本失敗:', error)
      if (window.electronAPI) {
        window.electronAPI.restoreWindow()
      }
    }
  }

  const handleStop = async () => {
    if (!executionStatus) return

    try {
      await api.stopExecution(executionStatus.execution_id)
      // 停止後恢復視窗
      if (window.electronAPI) {
        window.electronAPI.restoreWindow()
      }
    } catch (error) {
      console.error('停止執行失敗:', error)
    }
  }

  const handlePause = async () => {
    if (!executionStatus) return

    try {
      await api.pauseExecution(executionStatus.execution_id)
    } catch (error) {
      console.error('暫停執行失敗:', error)
    }
  }

  const handleResume = async () => {
    if (!executionStatus) return

    try {
      await api.resumeExecution(executionStatus.execution_id)
    } catch (error) {
      console.error('繼續執行失敗:', error)
    }
  }

  // 截圖操作
  const handleCaptureComplete = async (imageData: string, name: string, offsetX?: number, offsetY?: number) => {
    try {
      // 移除 data URL 前綴
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      const result = await api.saveTemplate(base64Data, name)
      
      // 重新載入模板
      const templatesData = await api.getTemplates()
      setTemplates(templatesData)
      
      // 如果有目標 block，更新其圖片路徑和偏移值
      if (captureConfig.targetBlockInstanceId && workspaceActions) {
        const fieldValues: Record<string, any> = {
          IMAGE_PATH: result.path || `${name}.png`,
        }
        if (captureConfig.enableOffsetPick && offsetX !== undefined && offsetY !== undefined) {
          fieldValues.OFFSET_X = offsetX
          fieldValues.OFFSET_Y = offsetY
        }
        workspaceActions.updateBlock(captureConfig.targetBlockInstanceId, fieldValues)
      }
    } catch (error) {
      console.error('儲存截圖失敗:', error)
    }
    
    setIsCapturing(false)
    setCaptureConfig({ enableOffsetPick: false })
  }
  
  // 開始截圖（支援偏移選取）
  const handleStartCapture = useCallback((enableOffsetPick: boolean = false, targetBlockInstanceId?: string) => {
    setCaptureConfig({ enableOffsetPick, targetBlockInstanceId })
    setIsCapturing(true)
  }, [])

  // Block 選擇
  const handleBlockSelect = useCallback((block: any) => {
    setSelectedBlock(block)
  }, [])

  // Undo/Redo 處理
  const handleUndo = useCallback(() => {
    if (workspaceActions) {
      workspaceActions.undo()
      // 延遲更新狀態
      setTimeout(() => {
        setCanUndo(workspaceActions.canUndo())
        setCanRedo(workspaceActions.canRedo())
      }, 10)
    }
  }, [workspaceActions])

  const handleRedo = useCallback(() => {
    if (workspaceActions) {
      workspaceActions.redo()
      // 延遲更新狀態
      setTimeout(() => {
        setCanUndo(workspaceActions.canUndo())
        setCanRedo(workspaceActions.canRedo())
      }, 10)
    }
  }, [workspaceActions])

  // 定期更新 undo/redo 狀態
  useEffect(() => {
    if (!workspaceActions) return
    
    const updateUndoRedoState = () => {
      setCanUndo(workspaceActions.canUndo())
      setCanRedo(workspaceActions.canRedo())
    }
    
    // 初始更新
    updateUndoRedoState()
    
    // 定期更新
    const interval = setInterval(updateUndoRedoState, 500)
    return () => clearInterval(interval)
  }, [workspaceActions])

  // 載入中
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-surface-400 font-display">載入中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-surface-950">
      {/* 頂部工具列 */}
      <Header
        currentScript={currentScript}
        executionStatus={executionStatus}
        onExecute={handleExecuteAsync}
        onStop={handleStop}
        onPause={handlePause}
        onResume={handleResume}
        onNewScript={handleNewScript}
        onCapture={() => setIsCapturing(true)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onRecord={() => setShowRecorder(!showRecorder)}
        isRecording={isRecording}
        onToggleCodePreview={() => setShowCodePreview(!showCodePreview)}
      />

      {/* 主要內容區 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左側邊欄 - 腳本列表 & 模板 */}
        <Sidebar
          scripts={scripts}
          templates={templates}
          currentScriptId={currentScript?.id}
          onSelectScript={handleSelectScript}
          onDeleteScript={handleDeleteScript}
          onRenameScript={handleRenameScript}
          onExportScript={handleExportScript}
          onDuplicateScript={handleDuplicateScript}
          onNewScript={handleNewScript}
          onRefreshTemplates={loadData}
        />

        {/* 中間 - Blockly 編輯器 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative">
            <BlocklyEditor
              script={currentScript}
              onSave={handleSaveScript}
              onBlockSelect={handleBlockSelect}
              onWorkspaceReady={(actions) => setWorkspaceActions(actions)}
              currentExecutingBlockId={currentExecutingBlockId}
            />
          </div>

          {/* 底部 - 執行日誌 */}
          <ExecutionPanel
            logs={logs}
            status={executionStatus}
          />
        </div>

        {/* 右側 - 屬性面板 */}
        <PropertiesPanel
          selectedBlock={selectedBlock}
          templates={templates}
          onUpdate={(fieldValues) => {
            // 更新 Blockly 積木的欄位值
            if (selectedBlock && workspaceActions) {
              workspaceActions.updateBlock(selectedBlock.instance_id, fieldValues)
            }
          }}
          onStartCapture={handleStartCapture}
        />
      </div>

      {/* 程式碼預覽面板 */}
      <CodePreviewPanel
        script={currentScript}
        isVisible={showCodePreview}
        onToggle={() => setShowCodePreview(!showCodePreview)}
      />

      {/* 錄製面板 */}
      <RecorderPanel
        isVisible={showRecorder}
        onToggle={() => setShowRecorder(!showRecorder)}
        onInsertBlocks={async (blocks) => {
          if (!currentScript) return
          // 將錄製的 blocks 添加到當前腳本
          const updatedBlocks = [...(currentScript.blocks || []), ...blocks]
          try {
            const updatedScript = await api.updateScript(currentScript.id, { blocks: updatedBlocks })
            setCurrentScript(updatedScript)
            setScripts(scripts.map(s => s.id === updatedScript.id ? updatedScript : s))
          } catch (error) {
            console.error('插入錄製動作失敗:', error)
          }
        }}
      />

      {/* 截圖覆蓋層 */}
      {isCapturing && (
        <ImageCapture
          onCapture={handleCaptureComplete}
          onCancel={() => {
            setIsCapturing(false)
            setCaptureConfig({ enableOffsetPick: false })
          }}
          enableOffsetPick={captureConfig.enableOffsetPick}
        />
      )}
    </div>
  )
}

export default App
