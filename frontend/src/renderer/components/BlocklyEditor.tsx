/**
 * Blockly 編輯器元件
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import * as Blockly from 'blockly'
import { Script } from '../types'
import { initBlocks, blocksToWorkspace, workspaceToBlocks } from '../blocks'

interface BlocklyEditorProps {
  script: Script | null
  onSave: (blocks: any[]) => void
  onBlockSelect: (block: any) => void
  onWorkspaceReady?: (updateBlock: (instanceId: string, fieldValues: Record<string, any>) => void) => void
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  script,
  onSave,
  onBlockSelect,
  onWorkspaceReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 使用 ref 保存最新的 callback，避免 stale closure 問題
  const onSaveRef = useRef(onSave)
  const onBlockSelectRef = useRef(onBlockSelect)
  
  // 每次 render 時更新 ref
  useEffect(() => {
    onSaveRef.current = onSave
    onBlockSelectRef.current = onBlockSelect
  })

  // 初始化 Blockly
  useEffect(() => {
    if (!containerRef.current || isInitialized) return

    // 初始化自定義 Blocks
    initBlocks()

    // Blockly 工具箱配置
    const toolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: '動作',
          colour: '#5b80a5',
          contents: [
            { kind: 'block', type: 'click_image' },
            { kind: 'block', type: 'click_position' },
            { kind: 'block', type: 'double_click_image' },
            { kind: 'block', type: 'right_click_image' },
            { kind: 'block', type: 'type_text' },
            { kind: 'block', type: 'hotkey' },
            { kind: 'block', type: 'scroll' },
            { kind: 'block', type: 'drag_drop' },
            { kind: 'block', type: 'wait' },
            { kind: 'block', type: 'wait_image' },
            { kind: 'block', type: 'wait_image_gone' },
          ],
        },
        {
          kind: 'category',
          name: '控制',
          colour: '#5ca65b',
          contents: [
            { kind: 'block', type: 'if_image_exists' },
            { kind: 'block', type: 'loop_times' },
            { kind: 'block', type: 'loop_while_image' },
            { kind: 'block', type: 'loop_until_image' },
            { kind: 'block', type: 'break_loop' },
            { kind: 'block', type: 'continue_loop' },
          ],
        },
        {
          kind: 'category',
          name: '變數',
          colour: '#a55b80',
          contents: [
            { kind: 'block', type: 'set_variable' },
            { kind: 'block', type: 'get_variable' },
            { kind: 'block', type: 'save_position' },
          ],
        },
        {
          kind: 'category',
          name: '進階',
          colour: '#a5805b',
          contents: [
            { kind: 'block', type: 'run_script' },
            { kind: 'block', type: 'http_request' },
            { kind: 'block', type: 'run_command' },
            { kind: 'block', type: 'log_message' },
            { kind: 'block', type: 'screenshot' },
          ],
        },
      ],
    }

    // 建立 Blockly Workspace
    workspaceRef.current = Blockly.inject(containerRef.current, {
      toolbox,
      media: '/blockly/',  // 使用本地 Blockly 媒體資源 (public/blockly/)
      grid: {
        spacing: 20,
        length: 3,
        colour: '#1e293b',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      trashcan: true,
      move: {
        scrollbars: true,
        drag: true,
        wheel: true,
      },
      theme: createDarkTheme(),
      renderer: 'zelos',
    })

    // 監聽變更事件
    workspaceRef.current.addChangeListener((event) => {
      if (event.type === Blockly.Events.BLOCK_CHANGE ||
          event.type === Blockly.Events.BLOCK_CREATE ||
          event.type === Blockly.Events.BLOCK_DELETE ||
          event.type === Blockly.Events.BLOCK_MOVE) {
        handleWorkspaceChange()
      }

      // Block 選擇事件
      if (event.type === Blockly.Events.SELECTED) {
        const selectedEvent = event as Blockly.Events.Selected
        if (selectedEvent.newElementId) {
          const block = workspaceRef.current?.getBlockById(selectedEvent.newElementId)
          if (block) {
            onBlockSelectRef.current(getBlockInfo(block))  // 使用 ref
          }
        } else {
          onBlockSelectRef.current(null)  // 使用 ref
        }
      }
    })

    setIsInitialized(true)

    // 提供更新 block 欄位的方法
    if (onWorkspaceReady) {
      onWorkspaceReady((instanceId: string, fieldValues: Record<string, any>) => {
        if (!workspaceRef.current) return
        
        const block = workspaceRef.current.getBlockById(instanceId)
        if (!block) return
        
        // 更新每個欄位
        Object.entries(fieldValues).forEach(([fieldName, value]) => {
          const field = block.getField(fieldName)
          if (field) {
            field.setValue(value)
          }
        })
      })
    }

    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose()
        workspaceRef.current = null
      }
    }
  }, [])

  // 載入腳本到 Workspace
  useEffect(() => {
    if (!workspaceRef.current || !isInitialized) return

    workspaceRef.current.clear()

    if (script && script.blocks && script.blocks.length > 0) {
      blocksToWorkspace(script.blocks, workspaceRef.current)
    }
  }, [script?.id, isInitialized])

  // 處理 Workspace 變更
  const handleWorkspaceChange = useCallback(() => {
    if (!workspaceRef.current) return

    // 防抖：延遲儲存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      const blocks = workspaceToBlocks(workspaceRef.current!)
      console.log('[handleWorkspaceChange] Calling onSave with blocks:', blocks.length)
      onSaveRef.current(blocks)  // 使用 ref 確保使用最新的 callback
    }, 500)
  }, [])  // 不再依賴 onSave，因為我們用 ref

  // 取得 Block 資訊
  const getBlockInfo = (block: Blockly.Block) => {
    const params: Record<string, any> = {}
    
    // 取得所有欄位值
    block.inputList.forEach(input => {
      input.fieldRow.forEach(field => {
        if (field.name) {
          params[field.name] = field.getValue()
        }
      })
    })

    return {
      id: block.type,
      instance_id: block.id,
      name: block.type,
      params: getBlockParams(block.type),
      values: params,
    }
  }

  // 取得 Block 參數定義
  const getBlockParams = (blockType: string): Record<string, any> => {
    const confidenceParam = { type: 'number', default: 0.8, min: 0.1, max: 1.0, step: 0.05, description: '匹配信心度 (0.1-1.0)' }
    
    const paramDefs: Record<string, Record<string, any>> = {
      click_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
        TIMEOUT: { type: 'number', default: 30, description: '超時時間（秒）' },
        OFFSET_X: { type: 'number', default: 0, description: 'X 偏移' },
        OFFSET_Y: { type: 'number', default: 0, description: 'Y 偏移' },
      },
      double_click_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
        TIMEOUT: { type: 'number', default: 30, description: '超時時間（秒）' },
      },
      right_click_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
        TIMEOUT: { type: 'number', default: 30, description: '超時時間（秒）' },
      },
      drag_drop: {
        FROM_IMAGE: { type: 'image', description: '起點圖片' },
        TO_IMAGE: { type: 'image', description: '終點圖片' },
        CONFIDENCE: confidenceParam,
      },
      wait_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
        TIMEOUT: { type: 'number', default: 30, description: '超時時間（秒）' },
      },
      wait_image_gone: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
        TIMEOUT: { type: 'number', default: 30, description: '超時時間（秒）' },
      },
      if_image_exists: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
      },
      loop_while_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
      },
      loop_until_image: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        CONFIDENCE: confidenceParam,
      },
      save_position: {
        IMAGE_PATH: { type: 'image', description: '圖片路徑' },
        VAR_NAME: { type: 'text', required: true, description: '變數名稱' },
        CONFIDENCE: confidenceParam,
      },
      click_position: {
        X: { type: 'number', required: true, description: 'X 座標' },
        Y: { type: 'number', required: true, description: 'Y 座標' },
        BUTTON: { type: 'select', options: ['left', 'right', 'middle'], default: 'left', description: '滑鼠按鈕' },
      },
      type_text: {
        TEXT: { type: 'text', required: true, description: '文字內容' },
      },
      hotkey: {
        KEYS: { type: 'text', required: true, description: '快捷鍵（如 ctrl+c）' },
      },
      scroll: {
        DIRECTION: { type: 'select', options: ['up', 'down'], default: 'down', description: '方向' },
        AMOUNT: { type: 'number', default: 3, description: '滾動量' },
      },
      wait: {
        SECONDS: { type: 'number', required: true, default: 1, description: '秒數' },
      },
      loop_times: {
        TIMES: { type: 'number', required: true, default: 1, description: '次數' },
      },
      set_variable: {
        VAR_NAME: { type: 'text', required: true, description: '變數名稱' },
        VALUE: { type: 'text', description: '變數值' },
      },
      get_variable: {
        VAR_NAME: { type: 'text', required: true, description: '變數名稱' },
      },
      run_script: {
        SCRIPT_ID: { type: 'text', description: '腳本 ID' },
      },
      http_request: {
        METHOD: { type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'], default: 'GET', description: 'HTTP 方法' },
        URL: { type: 'text', required: true, description: 'URL' },
      },
      run_command: {
        COMMAND: { type: 'text', required: true, description: '命令' },
      },
      log_message: {
        LEVEL: { type: 'select', options: ['info', 'warning', 'error', 'debug'], default: 'info', description: '日誌等級' },
        MESSAGE: { type: 'text', required: true, description: '訊息' },
      },
      screenshot: {
        SAVE_PATH: { type: 'text', description: '儲存路徑' },
      },
    }

    return paramDefs[blockType] || {}
  }

  // 視窗大小變更時重新渲染
  useEffect(() => {
    const handleResize = () => {
      if (workspaceRef.current) {
        Blockly.svgResize(workspaceRef.current)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="h-full w-full relative">
      {/* Blockly 容器 */}
      <div
        ref={containerRef}
        className="h-full w-full grid-bg"
      />

      {/* 空狀態提示 */}
      {!script && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <svg className="w-16 h-16 mx-auto text-surface-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-surface-500 font-display">
              選擇或建立一個腳本開始編輯
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// 建立深色主題
function createDarkTheme(): Blockly.Theme {
  return Blockly.Theme.defineTheme('dark', {
    name: 'dark',
    base: Blockly.Themes.Classic,
    componentStyles: {
      workspaceBackgroundColour: 'transparent',
      toolboxBackgroundColour: '#1e293b',
      toolboxForegroundColour: '#e2e8f0',
      flyoutBackgroundColour: '#0f172a',
      flyoutForegroundColour: '#e2e8f0',
      flyoutOpacity: 0.95,
      scrollbarColour: '#334155',
      insertionMarkerColour: '#0ea5e9',
      insertionMarkerOpacity: 0.5,
      scrollbarOpacity: 0.8,
      cursorColour: '#0ea5e9',
    },
    fontStyle: {
      family: 'JetBrains Mono, monospace',
      weight: 'normal',
      size: 11,
    },
    startHats: true,
  })
}

export default BlocklyEditor
