/**
 * 屬性面板元件 - 編輯 Block 參數
 */

import React, { useState, useEffect } from 'react'
import { Template } from '../types'
import { api } from '../services/api'

interface PropertiesPanelProps {
  selectedBlock: any
  templates: Template[]
  onUpdate: (params: Record<string, any>) => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  templates,
  onUpdate,
}) => {
  const [params, setParams] = useState<Record<string, any>>({})

  useEffect(() => {
    if (selectedBlock) {
      setParams(selectedBlock.params || {})
    } else {
      setParams({})
    }
  }, [selectedBlock])

  const handleChange = (key: string, value: any) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    onUpdate(newParams)
  }

  if (!selectedBlock) {
    return (
      <aside className="w-72 bg-surface-900 border-l border-surface-700 flex flex-col">
        <div className="p-4 border-b border-surface-700">
          <h2 className="font-display font-semibold text-surface-200">屬性面板</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-surface-500 text-sm text-center">
            選擇一個 Block<br />來編輯其屬性
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-72 bg-surface-900 border-l border-surface-700 flex flex-col">
      {/* 標題 */}
      <div className="p-4 border-b border-surface-700">
        <h2 className="font-display font-semibold text-surface-200">
          屬性面板
        </h2>
        <p className="text-sm text-surface-400 mt-1">
          {selectedBlock.name || selectedBlock.id}
        </p>
      </div>

      {/* 參數編輯區 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {Object.entries(selectedBlock.params || {}).map(([key, paramDef]: [string, any]) => (
          <ParamField
            key={key}
            name={key}
            definition={paramDef}
            value={params[key]}
            templates={templates}
            onChange={(value) => handleChange(key, value)}
          />
        ))}

        {Object.keys(selectedBlock.params || {}).length === 0 && (
          <p className="text-surface-500 text-sm">
            此 Block 沒有可編輯的參數
          </p>
        )}
      </div>
    </aside>
  )
}

// 參數欄位元件
interface ParamFieldProps {
  name: string
  definition: any
  value: any
  templates: Template[]
  onChange: (value: any) => void
}

const ParamField: React.FC<ParamFieldProps> = ({
  name,
  definition,
  value,
  templates,
  onChange,
}) => {
  const type = definition?.type || 'text'
  const label = definition?.description || name
  const required = definition?.required
  const defaultValue = definition?.default
  const options = definition?.options
  const min = definition?.min
  const max = definition?.max
  const step = definition?.step

  const currentValue = value ?? defaultValue ?? ''

  const renderInput = () => {
    switch (type) {
      case 'number':
        return (
          <div className="space-y-1">
            <input
              type="number"
              value={currentValue}
              min={min}
              max={max}
              step={step}
              onChange={(e) => {
                let val = parseFloat(e.target.value)
                if (isNaN(val)) val = defaultValue ?? 0
                if (min !== undefined && val < min) val = min
                if (max !== undefined && val > max) val = max
                onChange(val)
              }}
              className="input"
            />
            {(min !== undefined || max !== undefined) && (
              <p className="text-xs text-surface-500">
                {min !== undefined && max !== undefined
                  ? `範圍: ${min} - ${max}`
                  : min !== undefined
                  ? `最小值: ${min}`
                  : `最大值: ${max}`}
              </p>
            )}
          </div>
        )

      case 'select':
        return (
          <select
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="input"
          >
            {options?.map((opt: string) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        )

      case 'image':
        return (
          <div className="space-y-2">
            <select
              value={currentValue}
              onChange={(e) => onChange(e.target.value)}
              className="input"
            >
              <option value="">選擇圖片...</option>
              {templates.map((template) => (
                <option key={template.name} value={template.path}>
                  {template.name}
                </option>
              ))}
            </select>
            
            {currentValue && (
              <div className="relative aspect-video rounded overflow-hidden bg-surface-800">
                <img
                  src={api.getTemplateUrl(currentValue)}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </div>
        )

      case 'keys':
        return (
          <input
            type="text"
            value={Array.isArray(currentValue) ? currentValue.join('+') : currentValue}
            onChange={(e) => onChange(e.target.value)}
            placeholder="例如: ctrl+c"
            className="input"
          />
        )

      case 'json':
        return (
          <textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                onChange(JSON.parse(e.target.value))
              } catch {
                onChange(e.target.value)
              }
            }}
            rows={4}
            className="input font-mono text-xs"
          />
        )

      case 'text':
      default:
        return (
          <input
            type="text"
            value={currentValue}
            onChange={(e) => onChange(e.target.value)}
            className="input"
          />
        )
    }
  }

  return (
    <div>
      <label className="block text-sm text-surface-300 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  )
}

export default PropertiesPanel
