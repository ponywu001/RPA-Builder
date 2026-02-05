/**
 * 執行歷史面板
 */

import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { ExecutionStatus } from '../types'

interface ExecutionHistoryPanelProps {
  isVisible: boolean
  onClose: () => void
}

const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({
  isVisible,
  onClose,
}) => {
  const [executions, setExecutions] = useState<ExecutionStatus[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isVisible) {
      loadExecutions()
    }
  }, [isVisible])

  const loadExecutions = async () => {
    setLoading(true)
    try {
      const result = await api.getExecutions({ limit: 50 })
      setExecutions(result)
    } catch (error) {
      console.error('載入執行歷史失敗:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10B981'
      case 'failed': return '#EF4444'
      case 'running': return '#3B82F6'
      case 'paused': return '#F59E0B'
      case 'stopped': return '#64748B'
      default: return '#94A3B8'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return '成功'
      case 'failed': return '失敗'
      case 'running': return '執行中'
      case 'paused': return '已暫停'
      case 'stopped': return '已停止'
      case 'pending': return '等待中'
      default: return status
    }
  }

  const formatTime = (isoString: string | null) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleString('zh-TW', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getDuration = (start: string | null, end: string | null) => {
    if (!start) return '-'
    const startTime = new Date(start).getTime()
    const endTime = end ? new Date(end).getTime() : Date.now()
    const duration = Math.round((endTime - startTime) / 1000)
    
    if (duration < 60) return `${duration}秒`
    if (duration < 3600) return `${Math.floor(duration / 60)}分${duration % 60}秒`
    return `${Math.floor(duration / 3600)}時${Math.floor((duration % 3600) / 60)}分`
  }

  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className="w-[800px] max-h-[80vh] rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-lg font-semibold text-surface-100">執行歷史</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadExecutions}
              className="p-2 rounded-lg hover:bg-surface-700 transition-colors"
              title="重新載入"
            >
              <svg className={`w-4 h-4 text-surface-400 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface-700 transition-colors"
            >
              <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : executions.length === 0 ? (
            <div className="text-center py-12 text-surface-500">
              尚無執行記錄
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-surface-500 uppercase" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                  <th className="px-6 py-3">腳本</th>
                  <th className="px-4 py-3">狀態</th>
                  <th className="px-4 py-3">進度</th>
                  <th className="px-4 py-3">開始時間</th>
                  <th className="px-4 py-3">耗時</th>
                </tr>
              </thead>
              <tbody>
                {executions.map((exec, index) => (
                  <tr 
                    key={exec.execution_id || index}
                    className="border-t border-surface-700 hover:bg-surface-800/50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm text-surface-200">{exec.script_name || '未知腳本'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          background: `${getStatusColor(exec.status)}20`,
                          color: getStatusColor(exec.status),
                        }}
                      >
                        {getStatusLabel(exec.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-400">
                        {exec.progress?.current_step || 0} / {exec.progress?.total_steps || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-400">
                        {formatTime(exec.started_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-400">
                        {getDuration(exec.started_at, exec.finished_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExecutionHistoryPanel
