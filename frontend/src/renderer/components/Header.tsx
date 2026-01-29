/**
 * 頂部工具列元件
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
}) => {
  const isRunning = executionStatus?.status === 'running'
  const isPaused = executionStatus?.status === 'paused'
  const canExecute = currentScript && !isRunning && !isPaused

  return (
    <header className="h-14 bg-surface-900 border-b border-surface-700 flex items-center justify-between px-4">
      {/* Logo & 標題 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-display font-bold text-lg text-surface-100">
            RPA Builder
          </span>
        </div>

        {/* 當前腳本名稱 */}
        {currentScript && (
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-800 rounded-lg">
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-sm text-surface-300">{currentScript.name}</span>
          </div>
        )}
      </div>

      {/* 工具按鈕 */}
      <div className="flex items-center gap-2">
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

        <div className="w-px h-6 bg-surface-600 mx-2" />

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
            className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span className="text-xs text-surface-400">
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
  const statusConfig: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-surface-500', label: '等待中' },
    running: { color: 'bg-primary-500 animate-pulse', label: '執行中' },
    paused: { color: 'bg-amber-500', label: '已暫停' },
    success: { color: 'bg-emerald-500', label: '成功' },
    failed: { color: 'bg-red-500', label: '失敗' },
    stopped: { color: 'bg-surface-500', label: '已停止' },
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
      {config.label}
    </span>
  )
}

export default Header
