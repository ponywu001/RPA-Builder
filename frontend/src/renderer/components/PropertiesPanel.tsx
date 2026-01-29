/**
 * 屬性面板元件 - 編輯 Block 參數
 */

import React, { useState, useEffect } from 'react'
import { Template } from '../types'
import { api } from '../services/api'
import PositionPicker from './PositionPicker'
import OffsetPicker from './OffsetPicker'

interface PropertiesPanelProps {
  selectedBlock: any
  templates: Template[]
  onUpdate: (params: Record<string, any>) => void
  /** 開始截圖回調 (enableOffsetPick, targetBlockInstanceId) */
  onStartCapture?: (enableOffsetPick: boolean, targetBlockInstanceId?: string) => void
}

// 支援偏移選取的 block 類型
const OFFSET_ENABLED_BLOCKS = ['click_image', 'double_click_image', 'right_click_image', 'drag_drop']

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedBlock,
  templates,
  onUpdate,
  onStartCapture,
}) => {
  const [values, setValues] = useState<Record<string, any>>({})
  const [showPositionPicker, setShowPositionPicker] = useState(false)
  const [showOffsetPicker, setShowOffsetPicker] = useState(false)

  useEffect(() => {
    if (selectedBlock) {
      // 使用 values（實際欄位值）而不是 params（參數定義）
      setValues(selectedBlock.values || {})
    } else {
      setValues({})
    }
  }, [selectedBlock])

  const handleChange = (key: string, value: any) => {
    const newValues = { ...values, [key]: value }
    setValues(newValues)
    onUpdate(newValues)
  }

  // 處理位置選取
  const handlePositionPick = (x: number, y: number) => {
    setShowPositionPicker(false)
    const newValues = { ...values, X: x, Y: y }
    setValues(newValues)
    onUpdate(newValues)
  }

  // 處理偏移選取
  const handleOffsetPick = (offsetX: number, offsetY: number) => {
    setShowOffsetPicker(false)
    const newValues = { ...values, OFFSET_X: offsetX, OFFSET_Y: offsetY }
    setValues(newValues)
    onUpdate(newValues)
    // 恢復視窗
    if (window.electronAPI) {
      window.electronAPI.restoreWindow()
    }
  }

  // 面板樣式
  const panelStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, #0f172a, #1e293b)',
    borderLeft: '1px solid rgba(71, 85, 105, 0.5)',
    boxShadow: '-2px 0 20px rgba(0, 0, 0, 0.15)'
  }

  const headerStyle: React.CSSProperties = {
    borderBottom: '1px solid rgba(71, 85, 105, 0.5)',
    background: 'rgba(255, 255, 255, 0.02)'
  }

  if (!selectedBlock) {
    return (
      <aside className="w-72 flex flex-col" style={panelStyle}>
        <div className="p-4" style={headerStyle}>
          <h2 className="font-semibold" style={{ color: '#f1f5f9' }}>
            屬性面板
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-center" style={{ color: '#64748b' }}>
            選擇一個 Block<br />來編輯其屬性
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-72 flex flex-col" style={panelStyle}>
      {/* 標題 */}
      <div className="p-4" style={headerStyle}>
        <h2 className="font-semibold" style={{ color: '#f1f5f9' }}>
          屬性面板
        </h2>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {selectedBlock.name || selectedBlock.id}
        </p>
      </div>

      {/* 參數編輯區 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 座標選取按鈕（僅用於 click_position） */}
        {selectedBlock.id === 'click_position' && (
          <div>
            <button
              onClick={() => setShowPositionPicker(true)}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              在畫面上選取位置
            </button>
            <p className="text-xs text-surface-500 mt-1 text-center">
              點擊後在螢幕上選取座標
            </p>
          </div>
        )}

        {/* 截圖 + 偏移選取按鈕（用於 click_image 等） */}
        {OFFSET_ENABLED_BLOCKS.includes(selectedBlock.id) && onStartCapture && (
          <div className="space-y-2">
            <button
              onClick={() => onStartCapture(true, selectedBlock.instance_id)}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              截圖並選取點擊位置
            </button>
            <p className="text-xs text-surface-500 text-center">
              截取目標圖片，並選擇實際點擊位置
            </p>
          </div>
        )}

        {/* 已有圖片時的偏移選取按鈕 */}
        {OFFSET_ENABLED_BLOCKS.includes(selectedBlock.id) && values.IMAGE_PATH && (
          <div>
            <button
              onClick={() => setShowOffsetPicker(true)}
              className="btn btn-secondary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              重新選取偏移位置
            </button>
            <p className="text-xs text-surface-500 mt-1 text-center">
              在現有圖片上重新選取點擊位置
            </p>
          </div>
        )}

        {Object.entries(selectedBlock.params || {}).map(([key, paramDef]: [string, any]) => (
          <ParamField
            key={key}
            name={key}
            definition={paramDef}
            value={values[key]}
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

      {/* 位置選取器 */}
      {showPositionPicker && (
        <PositionPicker
          onPick={handlePositionPick}
          onCancel={() => setShowPositionPicker(false)}
        />
      )}

      {/* 偏移選取器 */}
      {showOffsetPicker && values.IMAGE_PATH && (
        <OffsetPicker
          imagePath={values.IMAGE_PATH}
          onPick={handleOffsetPick}
          onCancel={() => {
            setShowOffsetPicker(false)
            // 恢復視窗（OffsetPicker 會最小化視窗來擷取螢幕）
            if (window.electronAPI) {
              window.electronAPI.restoreWindow()
            }
          }}
        />
      )}
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
