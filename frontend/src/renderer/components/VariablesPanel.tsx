/**
 * 變數監控面板
 */

import React, { useState, useEffect } from 'react'
import { api } from '../services/api'

interface VariablesPanelProps {
  executionId: string | null
  isVisible: boolean
}

const VariablesPanel: React.FC<VariablesPanelProps> = ({
  executionId,
  isVisible,
}) => {
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isVisible && executionId) {
      loadVariables()
      const interval = setInterval(loadVariables, 1000)
      return () => clearInterval(interval)
    }
  }, [isVisible, executionId])

  const loadVariables = async () => {
    if (!executionId) return
    
    try {
      const result = await api.getVariables(executionId)
      setVariables(result.variables || {})
    } catch (error) {
      // 執行可能已結束
    }
  }

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const getValueType = (value: any): string => {
    if (value === null || value === undefined) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  if (!isVisible) return null

  const entries = Object.entries(variables)

  return (
    <div 
      className="w-64 flex flex-col"
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderLeft: '1px solid rgba(71, 85, 105, 0.5)',
      }}
    >
      {/* 標題 */}
      <div 
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
      >
        <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        <span className="text-sm font-medium text-surface-200">變數監控</span>
        {loading && (
          <div className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin ml-auto" />
        )}
      </div>

      {/* 變數列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-sm text-surface-500">
            {executionId ? '尚無變數' : '未執行腳本'}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map(([name, value]) => (
              <div 
                key={name}
                className="p-2 rounded-lg"
                style={{ background: 'rgba(30, 41, 59, 0.5)' }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-primary-400">{name}</span>
                  <span 
                    className="text-xs px-1.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      color: '#A78BFA',
                    }}
                  >
                    {getValueType(value)}
                  </span>
                </div>
                <pre className="text-xs text-surface-300 overflow-x-auto whitespace-pre-wrap break-all">
                  {formatValue(value)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default VariablesPanel
