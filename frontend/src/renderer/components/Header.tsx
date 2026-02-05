/**
 * 頂部工具列元件 - 未來科技風格
 */

import React from 'react'
import { Script, ExecutionStatus } from '../types'

interface HeaderProps {
  currentScript: Script | null
  executionStatus: ExecutionStatus | null
  onExecute: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onNewScript: () => void
  onCapture: () => void
  // Undo/Redo
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  // 錄製
  onRecord?: () => void
  isRecording?: boolean
  // 程式碼預覽
  onToggleCodePreview?: () => void
}

const Header: React.FC<HeaderProps> = ({
  currentScript,
  executionStatus,
  onExecute,
  onStop,
  onPause,
  onResume,
  onNewScript,
  onCapture,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onRecord,
  isRecording = false,
  onToggleCodePreview,
}) => {
  const isRunning = executionStatus?.status === 'running'
  const isPaused = executionStatus?.status === 'paused'
  const canExecute = currentScript && !isRunning && !isPaused

  return (
    <header className="h-14 flex items-center justify-between px-4 relative"
      style={{
        background: 'linear-gradient(90deg, #0f172a, #1e293b)',
        borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
        boxShadow: '0 2px 15px rgba(0, 0, 0, 0.2)'
      }}
    >
      {/* 頂部裝飾線 */}
      <div className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: 'linear-gradient(90deg, #3B82F6, #8B5CF6, #10B981)'
        }}
      />

      {/* Logo & 標題 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="relative w-9 h-9 flex items-center justify-center">
            <div className="relative w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
              }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-lg tracking-wide" style={{ color: '#f1f5f9' }}>
            RPA Builder
          </span>
        </div>

        {/* 當前腳本名稱 */}
        {currentScript && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)'
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: '#3B82F6' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm" style={{ color: '#e2e8f0' }}>{currentScript.name}</span>
          </div>
        )}
      </div>

      {/* 工具按鈕 */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo 按鈕 */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-700"
            title="復原 (Ctrl+Z)"
          >
            <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-700"
            title="重做 (Ctrl+Y)"
          >
            <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* 分隔線 */}
        <div className="w-px h-6 mx-1" style={{ background: 'rgba(71, 85, 105, 0.5)' }} />

        {/* 截圖按鈕 */}
        <button
          onClick={onCapture}
          className="btn btn-secondary flex items-center gap-2"
          title="截圖 (Ctrl+Shift+S)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>截圖</span>
        </button>

        {/* 新增腳本 */}
        <button
          onClick={onNewScript}
          className="btn btn-secondary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>新增</span>
        </button>

        {/* 錄製按鈕 */}
        {onRecord && (
          <button
            onClick={onRecord}
            className={`btn flex items-center gap-2 ${isRecording ? 'btn-danger animate-pulse' : 'btn-secondary'}`}
            title="錄製操作"
          >
            <svg className="w-4 h-4" fill={isRecording ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth={2} />
              {isRecording ? (
                <rect x="8" y="8" width="8" height="8" rx="1" />
              ) : (
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              )}
            </svg>
            <span>{isRecording ? '停止錄製' : '錄製'}</span>
          </button>
        )}

        {/* 程式碼預覽 */}
        {onToggleCodePreview && (
          <button
            onClick={onToggleCodePreview}
            className="btn btn-secondary flex items-center gap-2"
            title="程式碼預覽"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span>程式碼</span>
          </button>
        )}

        {/* 分隔線 */}
        <div className="w-px h-6 mx-2"
          style={{ background: 'rgba(71, 85, 105, 0.5)' }}
        />

        {/* 執行控制 */}
        {isRunning ? (
          <>
            <button
              onClick={onPause}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>暫停</span>
            </button>
            <button
              onClick={onStop}
              className="btn btn-danger flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>停止</span>
            </button>
          </>
        ) : isPaused ? (
          <>
            <button
              onClick={onResume}
              className="btn btn-success flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>繼續</span>
            </button>
            <button
              onClick={onStop}
              className="btn btn-danger flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              <span>停止</span>
            </button>
          </>
        ) : (
          <button
            onClick={onExecute}
            disabled={!canExecute}
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed glow-pulse"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>執行</span>
          </button>
        )}

        {/* 執行狀態指示 */}
        {executionStatus && (
          <div className="flex items-center gap-2 ml-2">
            <StatusBadge status={executionStatus.status} />
            {(isRunning || isPaused) && (
              <span className="text-xs" style={{ color: '#94a3b8' }}>
                {executionStatus.progress.current_step} / {executionStatus.progress.total_steps}
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

// 狀態標籤
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    pending: { 
      bg: 'rgba(100, 116, 139, 0.2)',
      color: '#94a3b8',
      label: '等待中' 
    },
    running: { 
      bg: 'rgba(59, 130, 246, 0.2)',
      color: '#3B82F6',
      label: '執行中' 
    },
    paused: { 
      bg: 'rgba(245, 158, 11, 0.2)',
      color: '#F59E0B',
      label: '已暫停' 
    },
    success: { 
      bg: 'rgba(16, 185, 129, 0.2)',
      color: '#10B981',
      label: '成功' 
    },
    failed: { 
      bg: 'rgba(239, 68, 68, 0.2)',
      color: '#EF4444',
      label: '失敗' 
    },
    stopped: { 
      bg: 'rgba(100, 116, 139, 0.2)',
      color: '#94a3b8',
      label: '已停止' 
    },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span 
      className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'running' ? 'animate-pulse' : ''}`}
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}40`
      }}
    >
      {config.label}
    </span>
  )
}

export default Header
