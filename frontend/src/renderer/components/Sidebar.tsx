/**
 * 左側邊欄元件 - 未來科技風格
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
  onDuplicateScript: (scriptId: string) => void
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
  onDuplicateScript,
  onNewScript,
  onRefreshTemplates,
}) => {
  const [activeTab, setActiveTab] = useState<'scripts' | 'templates'>('scripts')
  const [hoveredScript, setHoveredScript] = useState<string | null>(null)
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null)
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  
  // 多選模板
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set())
  const [isSelectMode, setIsSelectMode] = useState(false)
  
  // 腳本操作選單
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // 點擊外部關閉選單
  React.useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openMenuId])

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

  const handleToggleSelectTemplate = (name: string) => {
    const newSelected = new Set(selectedTemplates)
    if (newSelected.has(name)) {
      newSelected.delete(name)
    } else {
      newSelected.add(name)
    }
    setSelectedTemplates(newSelected)
  }

  const handleSelectAllTemplates = () => {
    if (selectedTemplates.size === templates.length) {
      setSelectedTemplates(new Set())
    } else {
      setSelectedTemplates(new Set(templates.map(t => t.name)))
    }
  }

  const handleDeleteSelectedTemplates = async () => {
    if (selectedTemplates.size === 0) return
    
    if (!confirm(`確定要刪除選中的 ${selectedTemplates.size} 個模板？`)) return
    
    try {
      for (const name of selectedTemplates) {
        await api.deleteTemplate(name)
      }
      setSelectedTemplates(new Set())
      setIsSelectMode(false)
      onRefreshTemplates()
    } catch (error) {
      console.error('批量刪除模板失敗:', error)
    }
  }

  const handleCancelSelect = () => {
    setSelectedTemplates(new Set())
    setIsSelectMode(false)
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
    <aside 
      className="w-64 flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0f172a, #1e293b)',
        borderRight: '1px solid rgba(71, 85, 105, 0.5)',
        boxShadow: '2px 0 20px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Tab 選擇 */}
      <div 
        className="flex"
        style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
      >
        <button
          onClick={() => setActiveTab('scripts')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative"
          style={{
            color: activeTab === 'scripts' ? '#3B82F6' : '#94a3b8',
            background: activeTab === 'scripts' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
          }}
        >
          腳本
          {activeTab === 'scripts' && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: '#3B82F6' }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className="flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 relative"
          style={{
            color: activeTab === 'templates' ? '#3B82F6' : '#94a3b8',
            background: activeTab === 'templates' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
          }}
        >
          模板圖片
          {activeTab === 'templates' && (
            <div 
              className="absolute bottom-0 left-0 right-0 h-0.5"
              style={{ background: '#3B82F6' }}
            />
          )}
        </button>
      </div>

      {/* 內容區 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'scripts' ? (
          <div className="p-3">
            {/* 新增腳本按鈕 */}
            <button
              onClick={onNewScript}
              className="w-full mb-3 px-3 py-2.5 flex items-center gap-2 rounded-lg transition-all duration-300"
              style={{
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px dashed rgba(59, 130, 246, 0.3)',
                color: '#94a3b8'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#3B82F6'
                e.currentTarget.style.color = '#3B82F6'
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                e.currentTarget.style.color = '#94a3b8'
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'
              }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">新增腳本</span>
            </button>

            {/* 腳本列表 */}
            {scripts.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: '#64748b' }}>
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
                    className="group px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-300"
                    style={{
                      background: currentScriptId === script.id 
                        ? 'rgba(59, 130, 246, 0.15)'
                        : hoveredScript === script.id 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'transparent',
                      border: currentScriptId === script.id 
                        ? '1px solid rgba(59, 130, 246, 0.4)'
                        : '1px solid transparent',
                      borderRadius: '8px'
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <svg 
                          className="w-4 h-4 flex-shrink-0" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                          style={{ 
                            color: currentScriptId === script.id ? '#3B82F6' : '#94a3b8'
                          }}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        
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
                            className="flex-1 text-sm rounded px-2 py-0.5 outline-none"
                            style={{
                              background: 'rgba(15, 23, 42, 0.9)',
                              border: '1px solid #3B82F6',
                              color: '#e2e8f0'
                            }}
                            autoFocus
                          />
                        ) : (
                          <span 
                            className="text-sm truncate"
                            style={{ 
                              color: currentScriptId === script.id ? '#3B82F6' : '#e2e8f0'
                            }}
                            onDoubleClick={(e) => handleStartRename(script, e)}
                          >
                            {script.name}
                          </span>
                        )}
                      </div>
                      
                      {/* 操作選單按鈕 */}
                      {(hoveredScript === script.id || openMenuId === script.id) && editingScriptId !== script.id && (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === script.id ? null : script.id)
                            }}
                            className="p-1.5 rounded transition-all duration-200 hover:bg-surface-600"
                            style={{ color: '#94a3b8' }}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                          
                          {/* 下拉選單 */}
                          {openMenuId === script.id && (
                            <div 
                              className="absolute right-0 top-full mt-1 py-1 rounded-lg shadow-xl z-50 min-w-[140px]"
                              style={{
                                background: 'rgba(15, 23, 42, 0.98)',
                                border: '1px solid rgba(71, 85, 105, 0.5)',
                                backdropFilter: 'blur(8px)',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  onDuplicateScript(script.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-surface-700 transition-colors"
                                style={{ color: '#e2e8f0' }}
                              >
                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                複製
                              </button>
                              <button
                                onClick={() => {
                                  onExportScript(script.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-surface-700 transition-colors"
                                style={{ color: '#e2e8f0' }}
                              >
                                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                匯出
                              </button>
                              <button
                                onClick={(e) => {
                                  handleStartRename(script, e)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-surface-700 transition-colors"
                                style={{ color: '#e2e8f0' }}
                              >
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                重新命名
                              </button>
                              <div className="my-1 border-t border-surface-600" />
                              <button
                                onClick={() => {
                                  if (confirm(`確定要刪除腳本「${script.name}」？`)) {
                                    onDeleteScript(script.id)
                                  }
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-500/10 transition-colors"
                                style={{ color: '#EF4444' }}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                刪除
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 text-xs" style={{ color: '#64748b' }}>
                      {formatDate(script.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* 工具列 - 固定在頂部 */}
            <div className="sticky top-0 z-10 p-3 pb-2" style={{ background: 'linear-gradient(180deg, #0f172a 85%, transparent)' }}>
              <div className="flex gap-2">
                {isSelectMode ? (
                <>
                  {/* 多選模式工具列 */}
                  <button
                    onClick={handleSelectAllTemplates}
                    className="flex-1 px-2 py-2 flex items-center justify-center gap-1 rounded-lg transition-all text-xs"
                    style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      color: '#3B82F6'
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{selectedTemplates.size === templates.length ? '取消全選' : '全選'}</span>
                  </button>
                  <button
                    onClick={handleDeleteSelectedTemplates}
                    disabled={selectedTemplates.size === 0}
                    className="flex-1 px-2 py-2 flex items-center justify-center gap-1 rounded-lg transition-all text-xs disabled:opacity-50"
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#EF4444'
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>刪除 ({selectedTemplates.size})</span>
                  </button>
                  <button
                    onClick={handleCancelSelect}
                    className="px-2 py-2 rounded-lg transition-all"
                    style={{
                      background: 'rgba(100, 116, 139, 0.1)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      color: '#94a3b8'
                    }}
                    title="取消"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              ) : (
                <>
                  {/* 一般模式工具列 */}
                  <button
                    onClick={onRefreshTemplates}
                    className="flex-1 px-3 py-2 flex items-center justify-center gap-2 rounded-lg transition-all duration-300"
                    style={{
                      background: 'rgba(59, 130, 246, 0.05)',
                      border: '1px dashed rgba(59, 130, 246, 0.3)',
                      color: '#94a3b8'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3B82F6'
                      e.currentTarget.style.color = '#3B82F6'
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)'
                      e.currentTarget.style.color = '#94a3b8'
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="text-sm">重新載入</span>
                  </button>
                  {templates.length > 0 && (
                    <button
                      onClick={() => setIsSelectMode(true)}
                      className="px-3 py-2 rounded-lg transition-all duration-300"
                      style={{
                        background: 'rgba(100, 116, 139, 0.05)',
                        border: '1px dashed rgba(100, 116, 139, 0.3)',
                        color: '#94a3b8'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#94a3b8'
                        e.currentTarget.style.color = '#e2e8f0'
                        e.currentTarget.style.background = 'rgba(100, 116, 139, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(100, 116, 139, 0.3)'
                        e.currentTarget.style.color = '#94a3b8'
                        e.currentTarget.style.background = 'rgba(100, 116, 139, 0.05)'
                      }}
                      title="多選模式"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                    </button>
                  )}
                </>
              )}
              </div>
            </div>

            {/* 模板列表 */}
            <div className="flex-1 overflow-auto px-3 pb-3">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-sm" style={{ color: '#64748b' }}>
                尚無模板圖片<br />
                <span className="text-xs" style={{ color: '#475569' }}>按 Ctrl+Shift+S 截圖</span>
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => {
                  const isSelected = selectedTemplates.has(template.name)
                  
                  return (
                    <div
                      key={template.name}
                      onClick={() => isSelectMode && handleToggleSelectTemplate(template.name)}
                      onMouseEnter={() => setHoveredTemplate(template.name)}
                      onMouseLeave={() => setHoveredTemplate(null)}
                      className={`group p-2 rounded-lg transition-all duration-300 ${isSelectMode ? 'cursor-pointer' : ''}`}
                      style={{
                        background: isSelected 
                          ? 'rgba(59, 130, 246, 0.15)'
                          : hoveredTemplate === template.name 
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid',
                        borderColor: isSelected
                          ? 'rgba(59, 130, 246, 0.5)'
                          : hoveredTemplate === template.name 
                            ? 'rgba(71, 85, 105, 0.5)'
                            : 'rgba(71, 85, 105, 0.3)',
                        borderRadius: '8px'
                      }}
                    >
                      {/* 預覽圖 */}
                      <div 
                        className="relative aspect-video rounded overflow-hidden mb-2"
                        style={{ background: 'rgba(15, 23, 42, 0.8)' }}
                      >
                        <img
                          src={api.getTemplateUrl(template.name)}
                          alt={template.name}
                          className="w-full h-full object-contain"
                          draggable={!isSelectMode}
                          onDragStart={(e) => {
                            if (!isSelectMode) {
                              e.dataTransfer.setData('template', template.path)
                            }
                          }}
                        />
                        
                        {/* 多選模式的勾選框 */}
                        {isSelectMode && (
                          <div 
                            className="absolute top-1 left-1 w-5 h-5 rounded flex items-center justify-center"
                            style={{
                              background: isSelected ? '#3B82F6' : 'rgba(15, 23, 42, 0.8)',
                              border: isSelected ? 'none' : '2px solid rgba(148, 163, 184, 0.5)'
                            }}
                          >
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        )}
                        
                        {/* 刪除按鈕（非多選模式） */}
                        {!isSelectMode && hoveredTemplate === template.name && (
                          <button
                            onClick={() => handleDeleteTemplate(template.name)}
                            className="absolute top-1 right-1 p-1 rounded transition-all duration-200"
                            style={{
                              background: '#EF4444',
                              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                            }}
                          >
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* 資訊 */}
                      <div className="text-xs">
                        <div className="truncate" style={{ color: '#e2e8f0' }}>{template.name}</div>
                        <div style={{ color: '#64748b' }}>{formatFileSize(template.size)}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
