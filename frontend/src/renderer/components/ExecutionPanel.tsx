/**
 * 執行面板元件 - 顯示執行日誌與狀態
 */

import React, { useRef, useEffect, useState } from 'react'
import { ExecutionStatus, LogEntry } from '../types'

interface ExecutionPanelProps {
  logs: LogEntry[]
  status: ExecutionStatus | null
}

const ExecutionPanel: React.FC<ExecutionPanelProps> = ({
  logs,
  status,
}) => {
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)

  // 自動滾動到底部
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return (
          <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      case 'debug':
        return (
          <svg className="w-3 h-3 text-surface-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        )
      default:
        return (
          <svg className="w-3 h-3 text-primary-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-TW', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className={`bg-surface-900 border-t border-surface-700 flex flex-col transition-all duration-300 ${isExpanded ? 'h-48' : 'h-10'}`}>
      {/* 標題列 */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 px-4 flex items-center justify-between cursor-pointer hover:bg-surface-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-surface-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span className="text-sm font-medium text-surface-300">執行日誌</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-700 text-xs text-surface-400">
            {logs.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status && (
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <span>{status.script_name}</span>
              <span>•</span>
              <span>{status.progress.current_step}/{status.progress.total_steps} 步</span>
            </div>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              setAutoScroll(!autoScroll)
            }}
            className={`p-1 rounded transition-colors ${
              autoScroll ? 'text-primary-400' : 'text-surface-500'
            }`}
            title={autoScroll ? '自動滾動已開啟' : '自動滾動已關閉'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 13l-7 7-7-7m14-8l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 日誌內容 */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto px-4 py-2 font-mono text-xs space-y-0.5">
          {logs.length === 0 ? (
            <div className="text-surface-500 text-center py-4">
              尚無執行日誌
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 py-0.5 ${
                  log.level === 'error' ? 'text-red-400' :
                  log.level === 'warning' ? 'text-amber-400' :
                  log.level === 'debug' ? 'text-surface-500' :
                  'text-surface-300'
                }`}
              >
                {getLevelIcon(log.level)}
                <span className="text-surface-500 select-none">
                  [{formatTimestamp(log.timestamp)}]
                </span>
                <span className="flex-1 break-all">{log.message}</span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  )
}

export default ExecutionPanel
