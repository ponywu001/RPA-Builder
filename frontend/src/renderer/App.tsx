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
import { Script, ExecutionStatus, Template } from './types'
import { api } from './services/api'

const App: React.FC = () => {
  // 狀態
  const [scripts, setScripts] = useState<Script[]>([])
  const [currentScript, setCurrentScript] = useState<Script | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<any>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [executionStatus, setExecutionStatus] = useState<ExecutionStatus | null>(null)
  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string }>>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Block 更新函數（由 BlocklyEditor 提供）
  const [updateBlockFn, setUpdateBlockFn] = useState<((instanceId: string, fieldValues: Record<string, any>) => void) | null>(null)

  // 初始化
  useEffect(() => {
    loadData()
    setupEventListeners()
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

  // 執行操作
  const handleExecute = async () => {
    if (!currentScript) return

    setLogs([])
    try {
      const result = await api.executeScript(currentScript.id)
      setExecutionStatus(result)
      setLogs(result.logs || [])
    } catch (error) {
      console.error('執行腳本失敗:', error)
    }
  }

  const handleExecuteAsync = async () => {
    if (!currentScript) return

    setLogs([])
    try {
      const { execution_id } = await api.executeScriptAsync(currentScript.id)
      
      // 輪詢狀態
      const pollStatus = async () => {
        try {
          const status = await api.getExecutionStatus(execution_id)
          setExecutionStatus(status)
          
          const logs = await api.getExecutionLogs(execution_id)
          setLogs(logs)

          if (status.status === 'running' || status.status === 'paused') {
            setTimeout(pollStatus, 500)
          }
        } catch (error) {
          console.error('取得狀態失敗:', error)
        }
      }

      pollStatus()
    } catch (error) {
      console.error('執行腳本失敗:', error)
    }
  }

  const handleStop = async () => {
    if (!executionStatus) return

    try {
      await api.stopExecution(executionStatus.execution_id)
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
  const handleCaptureComplete = async (imageData: string, name: string) => {
    try {
      // 移除 data URL 前綴
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
      await api.saveTemplate(base64Data, name)
      
      // 重新載入模板
      const templatesData = await api.getTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('儲存截圖失敗:', error)
    }
    
    setIsCapturing(false)
  }

  // Block 選擇
  const handleBlockSelect = useCallback((block: any) => {
    setSelectedBlock(block)
  }, [])

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
              onWorkspaceReady={(updateFn) => setUpdateBlockFn(() => updateFn)}
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
            if (selectedBlock && updateBlockFn) {
              updateBlockFn(selectedBlock.instance_id, fieldValues)
            }
          }}
        />
      </div>

      {/* 截圖覆蓋層 */}
      {isCapturing && (
        <ImageCapture
          onCapture={handleCaptureComplete}
          onCancel={() => setIsCapturing(false)}
        />
      )}
    </div>
  )
}

export default App
