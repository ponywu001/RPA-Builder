/**
 * Blockly 編輯器元件
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import * as Blockly from 'blockly'
import { Script } from '../types'
import { initBlocks, blocksToWorkspace, workspaceToBlocks } from '../blocks'

interface WorkspaceActions {
  updateBlock: (instanceId: string, fieldValues: Record<string, any>) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  highlightBlock: (instanceId: string | null) => void
}

interface BlocklyEditorProps {
  script: Script | null
  onSave: (blocks: any[]) => void
  onBlockSelect: (block: any) => void
  onWorkspaceReady?: (actions: WorkspaceActions) => void
  currentExecutingBlockId?: string | null
}

const BlocklyEditor: React.FC<BlocklyEditorProps> = ({
  script,
  onSave,
  onBlockSelect,
  onWorkspaceReady,
  currentExecutingBlockId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 框選相關狀態
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [isBoxSelecting, setIsBoxSelecting] = useState(false)
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null)
  const [boxEnd, setBoxEnd] = useState<{ x: number; y: number } | null>(null)
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([])
  
  // 搜尋功能
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  // 積木名稱映射
  const blockNameMap: Record<string, string> = {
    click_image: '點擊圖片',
    click_position: '點擊座標',
    double_click_image: '雙擊圖片',
    right_click_image: '右鍵點擊圖片',
    type_text: '輸入文字',
    hotkey: '快捷鍵',
    scroll: '滾動',
    drag_drop: '拖放',
    wait: '等待',
    wait_image: '等待圖片出現',
    wait_image_gone: '等待圖片消失',
    if_image_exists: '如果圖片存在',
    file_exists: '如果檔案存在',
    try_catch: '錯誤處理',
    loop_times: '重複次數',
    for_each: '迴圈遍歷',
    loop_while_image: '當圖片存在時重複',
    loop_until_image: '重複直到圖片出現',
    break_loop: '中斷迴圈',
    continue_loop: '繼續迴圈',
    set_variable: '設定變數',
    get_variable: '取得變數',
    save_position: '儲存座標',
    text_value: '文字',
    string_concat_v2: '拼接字串',
    string_split_v2: '分割字串',
    string_replace_v2: '替換字串',
    string_match_v2: '正則匹配',
    string_format: '格式化字串',
    number_value: '數字',
    math_operation: '數學運算',
    random_number: '隨機數',
    clipboard_read: '讀取剪貼簿',
    clipboard_write: '寫入剪貼簿',
    json_parse: '解析 JSON',
    json_stringify: '轉為 JSON',
    json_get_value: '取得 JSON 值',
    read_file: '讀取檔案',
    write_file: '寫入檔案',
    copy_file: '複製檔案',
    move_file: '移動檔案',
    delete_file: '刪除檔案',
    list_files: '列出檔案',
    get_window: '取得視窗',
    activate_window: '啟用視窗',
    close_window: '關閉視窗',
    resize_window: '調整視窗大小',
    move_window: '移動視窗',
    ocr_read_text: 'OCR 讀取文字',
    ocr_find_text: 'OCR 尋找文字',
    ocr_click_text: 'OCR 點擊文字',
    ocr_wait_text: 'OCR 等待文字',
    if_ocr_text_exists: '如果 OCR 文字存在',
    run_script: '執行腳本',
    http_request: 'HTTP 請求',
    run_command: '執行命令',
    log_message: '記錄訊息',
    screenshot: '截圖',
    send_email: '發送郵件',
    retry: '重試',
    excel_read: '讀取 Excel',
    excel_write: '寫入 Excel',
    excel_read_cell: '讀取 Excel 儲存格',
    excel_write_cell: '寫入 Excel 儲存格',
    browser_open: '開啟瀏覽器',
    browser_goto: '前往網址',
    browser_click: '點擊元素',
    browser_type: '輸入文字',
    browser_get_text: '取得文字',
    browser_screenshot: '瀏覽器截圖',
    browser_close: '關閉瀏覽器',
    db_connect: '連接資料庫',
    db_query: '查詢資料庫',
    db_execute: '執行 SQL',
    db_close: '關閉資料庫',
  }
  
  // 過濾積木
  const filteredBlocks = Object.entries(blockNameMap).filter(([type, name]) => {
    if (!searchQuery) return false
    return name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           type.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // 監聽 Shift 鍵和快捷鍵
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(true)
      }
      // Ctrl+F 開啟搜尋
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => searchInputRef.current?.focus(), 100)
      }
      // Escape 關閉搜尋
      if (e.key === 'Escape' && showSearch) {
        setShowSearch(false)
        setSearchQuery('')
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
        if (isBoxSelecting) {
          setIsBoxSelecting(false)
          setBoxStart(null)
          setBoxEnd(null)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isBoxSelecting, showSearch])
  
  // 插入積木到工作區
  const insertBlockToWorkspace = useCallback((blockType: string) => {
    if (!workspaceRef.current) return
    
    const block = workspaceRef.current.newBlock(blockType)
    block.initSvg()
    block.render()
    
    // 放置在工作區中央
    const metrics = workspaceRef.current.getMetrics()
    const x = metrics.viewWidth / 2 - 50
    const y = metrics.viewHeight / 2 - 25
    block.moveBy(x, y)
    
    setShowSearch(false)
    setSearchQuery('')
  }, [])
  
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
          colour: '#3B82F6',
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
          colour: '#8B5CF6',
          contents: [
            { kind: 'block', type: 'if_image_exists' },
            { kind: 'block', type: 'file_exists' },
            { kind: 'block', type: 'try_catch' },
            { kind: 'block', type: 'loop_times' },
            { kind: 'block', type: 'for_each' },
            { kind: 'block', type: 'loop_while_image' },
            { kind: 'block', type: 'loop_until_image' },
            { kind: 'block', type: 'break_loop' },
            { kind: 'block', type: 'continue_loop' },
          ],
        },
        {
          kind: 'category',
          name: '變數',
          colour: '#F59E0B',
          contents: [
            { kind: 'block', type: 'set_variable' },
            { kind: 'block', type: 'get_variable' },
            { kind: 'block', type: 'save_position' },
          ],
        },
        {
          kind: 'category',
          name: '字串',
          colour: '#F59E0B',
          contents: [
            { kind: 'block', type: 'text_value' },
            { kind: 'block', type: 'string_concat_v2' },
            { kind: 'block', type: 'string_split_v2' },
            { kind: 'block', type: 'string_replace_v2' },
            { kind: 'block', type: 'string_match_v2' },
            { kind: 'block', type: 'string_format' },
          ],
        },
        {
          kind: 'category',
          name: '數學',
          colour: '#F59E0B',
          contents: [
            { kind: 'block', type: 'number_value' },
            { kind: 'block', type: 'math_operation' },
            { kind: 'block', type: 'random_number' },
          ],
        },
        {
          kind: 'category',
          name: '資料',
          colour: '#F59E0B',
          contents: [
            { kind: 'block', type: 'clipboard_read' },
            { kind: 'block', type: 'clipboard_write' },
            { kind: 'block', type: 'json_parse' },
            { kind: 'block', type: 'json_stringify' },
            { kind: 'block', type: 'json_get_value' },
          ],
        },
        {
          kind: 'category',
          name: '檔案',
          colour: '#10B981',
          contents: [
            { kind: 'block', type: 'read_file' },
            { kind: 'block', type: 'write_file' },
            { kind: 'block', type: 'copy_file' },
            { kind: 'block', type: 'move_file' },
            { kind: 'block', type: 'delete_file' },
            { kind: 'block', type: 'list_files' },
          ],
        },
        {
          kind: 'category',
          name: 'Excel',
          colour: '#10B981',
          contents: [
            { kind: 'block', type: 'excel_read' },
            { kind: 'block', type: 'excel_write' },
            { kind: 'block', type: 'excel_read_cell' },
            { kind: 'block', type: 'excel_write_cell' },
          ],
        },
        {
          kind: 'category',
          name: '視窗',
          colour: '#10B981',
          contents: [
            { kind: 'block', type: 'get_window' },
            { kind: 'block', type: 'activate_window' },
            { kind: 'block', type: 'close_window' },
            { kind: 'block', type: 'resize_window' },
            { kind: 'block', type: 'move_window' },
          ],
        },
        {
          kind: 'category',
          name: 'OCR',
          colour: '#EC4899',
          contents: [
            { kind: 'block', type: 'ocr_read_text' },
            { kind: 'block', type: 'ocr_find_text' },
            { kind: 'block', type: 'ocr_click_text' },
            { kind: 'block', type: 'ocr_wait_text' },
            { kind: 'block', type: 'if_ocr_text_exists' },
          ],
        },
        {
          kind: 'category',
          name: '瀏覽器',
          colour: '#06B6D4',
          contents: [
            { kind: 'block', type: 'browser_open' },
            { kind: 'block', type: 'browser_goto' },
            { kind: 'block', type: 'browser_click' },
            { kind: 'block', type: 'browser_type' },
            { kind: 'block', type: 'browser_get_text' },
            { kind: 'block', type: 'browser_screenshot' },
            { kind: 'block', type: 'browser_close' },
          ],
        },
        {
          kind: 'category',
          name: '資料庫',
          colour: '#F97316',
          contents: [
            { kind: 'block', type: 'db_connect' },
            { kind: 'block', type: 'db_query' },
            { kind: 'block', type: 'db_execute' },
            { kind: 'block', type: 'db_close' },
          ],
        },
        {
          kind: 'category',
          name: '進階',
          colour: '#10B981',
          contents: [
            { kind: 'block', type: 'run_script' },
            { kind: 'block', type: 'http_request' },
            { kind: 'block', type: 'run_command' },
            { kind: 'block', type: 'log_message' },
            { kind: 'block', type: 'screenshot' },
            { kind: 'block', type: 'send_email' },
            { kind: 'block', type: 'retry' },
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
      comments: true,  // 啟用積木註解
      theme: createDarkTheme(),
      renderer: 'zelos',
    })
    
    // 為所有積木啟用右鍵選單和註解
    Blockly.ContextMenuRegistry.registry.register({
      displayText: () => '新增註解',
      preconditionFn: (scope) => {
        if (scope.block && !scope.block.getCommentIcon()) {
          return 'enabled'
        }
        return 'hidden'
      },
      callback: (scope) => {
        if (scope.block) {
          scope.block.setCommentText('在此輸入註解...')
        }
      },
      scopeType: Blockly.ContextMenuRegistry.ScopeType.BLOCK,
      id: 'add_comment',
      weight: 100,
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

    // 提供 workspace 操作方法
    if (onWorkspaceReady) {
      const actions: WorkspaceActions = {
        updateBlock: (instanceId: string, fieldValues: Record<string, any>) => {
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
        },
        undo: () => {
          if (workspaceRef.current) {
            workspaceRef.current.undo(false)
          }
        },
        redo: () => {
          if (workspaceRef.current) {
            workspaceRef.current.undo(true)
          }
        },
        canUndo: () => {
          if (!workspaceRef.current) return false
          const undoStack = workspaceRef.current.getUndoStack()
          return undoStack.length > 0
        },
        canRedo: () => {
          if (!workspaceRef.current) return false
          const redoStack = workspaceRef.current.getRedoStack()
          return redoStack.length > 0
        },
        highlightBlock: (instanceId: string | null) => {
          if (!workspaceRef.current) return
          workspaceRef.current.highlightBlock(instanceId || '')
        },
      }
      onWorkspaceReady(actions)
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

  // 執行時高亮當前 Block
  useEffect(() => {
    if (!workspaceRef.current || !isInitialized) return
    
    // 高亮當前執行的 block
    workspaceRef.current.highlightBlock(currentExecutingBlockId || '')
  }, [currentExecutingBlockId, isInitialized])

  // 框選開始
  const handleBoxSelectStart = useCallback((e: React.MouseEvent) => {
    // 左鍵啟用框選（覆蓋層只在 Shift 按下時顯示）
    if (e.button === 0) {
      e.preventDefault()
      e.stopPropagation()
      const rect = wrapperRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setBoxStart({ x, y })
      setBoxEnd({ x, y })
      setIsBoxSelecting(true)
      
      // 清除之前的選取
      if (workspaceRef.current) {
        workspaceRef.current.getAllBlocks(false).forEach(block => {
          block.removeSelect()
        })
      }
      setSelectedBlocks([])
    }
  }, [])

  // 框選移動
  const handleBoxSelectMove = useCallback((e: React.MouseEvent) => {
    if (!isBoxSelecting || !boxStart) return
    
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setBoxEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }, [isBoxSelecting, boxStart])

  // 框選結束
  const handleBoxSelectEnd = useCallback(() => {
    if (!isBoxSelecting || !boxStart || !boxEnd || !workspaceRef.current) {
      setIsBoxSelecting(false)
      return
    }

    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) {
      setIsBoxSelecting(false)
      return
    }

    // 計算選取框範圍
    const minX = Math.min(boxStart.x, boxEnd.x)
    const maxX = Math.max(boxStart.x, boxEnd.x)
    const minY = Math.min(boxStart.y, boxEnd.y)
    const maxY = Math.max(boxStart.y, boxEnd.y)

    // 選取框太小則忽略
    if (maxX - minX < 10 || maxY - minY < 10) {
      setIsBoxSelecting(false)
      setBoxStart(null)
      setBoxEnd(null)
      return
    }

    // 找出在選取框內的積木
    const blocks = workspaceRef.current.getAllBlocks(false)
    const selected: string[] = []

    blocks.forEach(block => {
      const blockSvg = block.getSvgRoot()
      if (!blockSvg) return

      const blockRect = blockSvg.getBoundingClientRect()
      const blockX = blockRect.left - rect.left
      const blockY = blockRect.top - rect.top
      const blockRight = blockX + blockRect.width
      const blockBottom = blockY + blockRect.height

      // 檢查積木是否與選取框相交
      if (blockX < maxX && blockRight > minX && blockY < maxY && blockBottom > minY) {
        selected.push(block.id)
        block.addSelect()
      }
    })

    setSelectedBlocks(selected)
    setIsBoxSelecting(false)
    setBoxStart(null)
    setBoxEnd(null)
  }, [isBoxSelecting, boxStart, boxEnd])

  // 刪除選中的積木
  const handleDeleteSelected = useCallback(() => {
    if (!workspaceRef.current || selectedBlocks.length === 0) return

    selectedBlocks.forEach(blockId => {
      const block = workspaceRef.current?.getBlockById(blockId)
      if (block && !block.isDeadOrDying()) {
        block.dispose(true, true)
      }
    })

    setSelectedBlocks([])
  }, [selectedBlocks])

  // 取消選取
  const handleCancelSelection = useCallback(() => {
    if (!workspaceRef.current) return
    
    selectedBlocks.forEach(blockId => {
      const block = workspaceRef.current?.getBlockById(blockId)
      if (block && !block.isDeadOrDying()) {
        block.removeSelect()
      }
    })
    setSelectedBlocks([])
  }, [selectedBlocks])

  // 計算選取框樣式
  const getBoxStyle = (): React.CSSProperties | undefined => {
    if (!isBoxSelecting || !boxStart || !boxEnd) return undefined

    return {
      position: 'absolute',
      left: Math.min(boxStart.x, boxEnd.x),
      top: Math.min(boxStart.y, boxEnd.y),
      width: Math.abs(boxEnd.x - boxStart.x),
      height: Math.abs(boxEnd.y - boxStart.y),
      border: '2px dashed #3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.15)',
      pointerEvents: 'none',
      zIndex: 1000,
    }
  }

  return (
    <div 
      ref={wrapperRef}
      className="h-full w-full relative overflow-hidden"
    >
      {/* Blockly 容器 */}
      <div
        ref={containerRef}
        className="h-full w-full grid-bg"
      />

      {/* 框選透明覆蓋層 - 只在按住 Shift 時出現 */}
      {isShiftPressed && (
        <div 
          className="absolute inset-0 z-40"
          style={{ cursor: 'crosshair' }}
          onMouseDown={handleBoxSelectStart}
          onMouseMove={handleBoxSelectMove}
          onMouseUp={handleBoxSelectEnd}
          onMouseLeave={() => {
            if (isBoxSelecting) {
              setIsBoxSelecting(false)
              setBoxStart(null)
              setBoxEnd(null)
            }
          }}
        />
      )}

      {/* 框選框 */}
      {isBoxSelecting && boxStart && boxEnd && (
        <div style={getBoxStyle()} />
      )}

      {/* 選中積木工具列 */}
      {selectedBlocks.length > 0 && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-xl"
          style={{
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-sm text-surface-300">
            已選取 <span className="text-primary-400 font-bold">{selectedBlocks.length}</span> 個積木
          </span>
          <div className="w-px h-5 bg-surface-600" />
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 text-sm rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            刪除選取
          </button>
          <button
            onClick={handleCancelSelection}
            className="px-3 py-1.5 text-sm rounded-md bg-surface-700 text-surface-300 hover:bg-surface-600 transition-colors"
          >
            取消
          </button>
        </div>
      )}

      {/* 搜尋面板 */}
      {showSearch && (
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-80"
          style={{
            background: 'rgba(15, 23, 42, 0.98)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋積木... (Ctrl+F)"
                className="flex-1 bg-transparent text-sm text-surface-200 outline-none placeholder-surface-500"
              />
              <button
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                }}
                className="p-1 hover:bg-surface-700 rounded"
              >
                <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* 搜尋結果 */}
          {filteredBlocks.length > 0 && (
            <div className="max-h-64 overflow-y-auto border-t border-surface-700">
              {filteredBlocks.map(([type, name]) => (
                <button
                  key={type}
                  onClick={() => insertBlockToWorkspace(type)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface-700 transition-colors flex items-center gap-3"
                >
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ 
                      background: type.includes('click') || type.includes('wait') || type.includes('scroll') 
                        ? '#3B82F6' 
                        : type.includes('loop') || type.includes('if') || type.includes('try')
                        ? '#8B5CF6'
                        : type.includes('var') || type.includes('string') || type.includes('math') || type.includes('text') || type.includes('number')
                        ? '#F59E0B'
                        : type.includes('file')
                        ? '#10B981'
                        : type.includes('window')
                        ? '#10B981'
                        : type.includes('ocr')
                        ? '#EC4899'
                        : '#64748B'
                    }}
                  />
                  <span className="text-surface-200">{name}</span>
                  <span className="text-xs text-surface-500 ml-auto">{type}</span>
                </button>
              ))}
            </div>
          )}
          
          {searchQuery && filteredBlocks.length === 0 && (
            <div className="p-4 text-center text-sm text-surface-500 border-t border-surface-700">
              找不到符合的積木
            </div>
          )}
        </div>
      )}

      {/* 框選提示 */}
      {script && selectedBlocks.length === 0 && !isBoxSelecting && !showSearch && (
        <div className="absolute bottom-4 right-4 px-2 py-1 rounded bg-surface-800/80 text-xs text-surface-400 pointer-events-none">
          按住 Shift + 拖曳框選積木 | Ctrl+F 搜尋積木
        </div>
      )}

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
