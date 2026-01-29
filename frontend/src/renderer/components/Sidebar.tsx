/**
 * 左側邊欄元件 - 腳本列表與模板管理
 */

import React, { useState } from 'react'
import { Script, Template } from '../types'
import { api } from '../services/api'

interface SidebarProps {
  scripts: Script[]
  templates: Template[]
  currentScriptId?: string
  onSelectScript: (scriptId: string) => void
  onDeleteScript: (scriptId: string) => void
  onRenameScript: (scriptId: string, newName: string) => void
  onExportScript: (scriptId: string) => void
  onNewScript: () => void
  onRefreshTemplates: () => void
}

const Sidebar: React.FC<SidebarProps> = ({
  scripts,
  templates,
  currentScriptId,
  onSelectScript,
  onDeleteScript,
  onRenameScript,
  onExportScript,
  onNewScript,
  onRefreshTemplates,
}) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'templates'>('scripts')
  const [hoveredScript, setHoveredScript] = useState<string | null>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleStartRename = (script: Script, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingScriptId(script.id)
    setEditingName(script.name)
  }

  const handleFinishRename = () => {
    if (editingScriptId && editingName.trim()) {
      onRenameScript(editingScriptId, editingName.trim())
    }
    setEditingScriptId(null)
    setEditingName('')
  }

  const handleCancelRename = () => {
    setEditingScriptId(null)
    setEditingName('')
  }

  const handleDeleteTemplate = async (name: string) => {
    if (!confirm(`確定要刪除模板「${name}」？`)) return
    
    try {
      await api.deleteTemplate(name)
      onRefreshTemplates()
    } catch (error) {
      console.error('刪除模板失敗:', error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <aside className="w-64 bg-surface-900 border-r border-surface-700 flex flex-col">
      {/* Tab 選擇 */}
      <div className="flex border-b border-surface-700">
        <button
          onClick={() => setActiveTab('scripts')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'scripts'
              ? 'text-primary-400 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          腳本
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'text-primary-400 border-b-2 border-primary-500'
              : 'text-surface-400 hover:text-surface-200'
          }`}
        >
          模板圖片
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'scripts' ? (
          <div className="p-2">
            {/* 新增腳本按鈕 */}
            <button
              onClick={onNewScript}
              className="w-full mb-2 px-3 py-2 flex items-center gap-2 rounded-lg border border-dashed border-surface-600 text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">新增腳本</span>
            </button>

            {/* 腳本列表 */}
            {scripts.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-sm">
                尚無腳本
              </div>
            ) : (
              <div className="space-y-1">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    onClick={() => editingScriptId !== script.id && onSelectScript(script.id)}
                    onMouseEnter={() => setHoveredScript(script.id)}
                    onMouseLeave={() => setHoveredScript(null)}
                    className={`group px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      currentScriptId === script.id
                        ? 'bg-primary-500/20 text-primary-300'
                        : 'hover:bg-surface-800 text-surface-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        
                        {/* 編輯模式或顯示模式 */}
                        {editingScriptId === script.id ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={handleFinishRename}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleFinishRename()
                              if (e.key === 'Escape') handleCancelRename()
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm bg-surface-700 border border-primary-500 rounded px-1 py-0.5 text-surface-100 outline-none"
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="text-sm truncate"
                            onDoubleClick={(e) => handleStartRename(script, e)}
                          >
                            {script.name}
                          </span>
                        )}
                      </div>
                      
                      {/* 操作按鈕 */}
                      {hoveredScript === script.id && editingScriptId !== script.id && (
                        <div className="flex items-center gap-1">
                          {/* 匯出按鈕 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onExportScript(script.id)
                            }}
                            className="p-1 rounded hover:bg-surface-600 text-surface-400 hover:text-green-400 transition-colors"
                            title="匯出為 Python"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          {/* 重新命名按鈕 */}
                          <button
                            onClick={(e) => handleStartRename(script, e)}
                            className="p-1 rounded hover:bg-surface-600 text-surface-400 hover:text-surface-200 transition-colors"
                            title="重新命名"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {/* 刪除按鈕 */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`確定要刪除腳本「${script.name}」？`)) {
                                onDeleteScript(script.id)
                              }
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-surface-400 hover:text-red-400 transition-colors"
                            title="刪除"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-xs text-surface-500">
                      {formatDate(script.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            {/* 重新載入按鈕 */}
            <button
              onClick={onRefreshTemplates}
              className="w-full mb-2 px-3 py-2 flex items-center gap-2 rounded-lg border border-dashed border-surface-600 text-surface-400 hover:border-primary-500 hover:text-primary-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">重新載入</span>
            </button>

            {/* 模板列表 */}
            {templates.length === 0 ? (
              <div className="text-center py-8 text-surface-500 text-sm">
                尚無模板圖片<br />
                <span className="text-xs">按 Ctrl+Shift+S 截圖</span>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.name}
                    onMouseEnter={() => setHoveredTemplate(template.name)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className="group p-2 rounded-lg bg-surface-800 hover:bg-surface-700 transition-colors"
                  >
                    {/* 預覽圖 */}
                    <div className="relative aspect-video rounded overflow-hidden bg-surface-900 mb-2">
                      <img
                        src={api.getTemplateUrl(template.name)}
                        alt={template.name}
                        className="w-full h-full object-contain"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('template', template.path)
                        }}
                      />
                      
                      {/* 刪除按鈕 */}
                      {hoveredTemplate === template.name && (
                        <button
                          onClick={() => handleDeleteTemplate(template.name)}
                          className="absolute top-1 right-1 p-1 rounded bg-red-500/80 hover:bg-red-500 text-white transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    {/* 資訊 */}
                    <div className="text-xs">
                      <div className="text-surface-300 truncate">{template.name}</div>
                      <div className="text-surface-500">{formatFileSize(template.size)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
