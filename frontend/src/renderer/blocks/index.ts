/**
 * Blockly 自定義 Blocks 定義
 */

import * as Blockly from 'blockly'

// Block 類型定義
interface BlockJson {
  type: string
  message0: string
  args0?: Array<{
    type: string
    name: string
    text?: string
    value?: number
    min?: number
    options?: string[][]
    check?: string
  }>
  message1?: string
  args1?: Array<any>
  message2?: string
  args2?: Array<any>
  previousStatement?: string | null
  nextStatement?: string | null
  colour: string
  tooltip: string
  helpUrl?: string
  inputsInline?: boolean
}

/**
 * 初始化所有自定義 Blocks
 */
export function initBlocks(): void {
  // ==================== 動作類 ====================
  
  // 點擊圖片
  Blockly.Blocks['click_image'] = {
    init: function() {
      this.jsonInit({
        type: 'click_image',
        message0: '點擊圖片 %1 信心度 %2',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        message1: '超時 %1 秒 偏移 X: %2 Y: %3',
        args1: [
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
          { type: 'field_number', name: 'OFFSET_X', value: 0 },
          { type: 'field_number', name: 'OFFSET_Y', value: 0 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '在螢幕上找到指定圖片並點擊（信心度越低越寬鬆）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 點擊座標
  Blockly.Blocks['click_position'] = {
    init: function() {
      this.jsonInit({
        type: 'click_position',
        message0: '點擊座標 X: %1 Y: %2 按鈕: %3',
        args0: [
          { type: 'field_number', name: 'X', value: 0 },
          { type: 'field_number', name: 'Y', value: 0 },
          { type: 'field_dropdown', name: 'BUTTON', options: [['左鍵', 'left'], ['右鍵', 'right'], ['中鍵', 'middle']] },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '點擊指定的螢幕座標',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 雙擊圖片
  Blockly.Blocks['double_click_image'] = {
    init: function() {
      this.jsonInit({
        type: 'double_click_image',
        message0: '雙擊圖片 %1 信心度 %2 超時 %3 秒',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '在螢幕上找到指定圖片並雙擊',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 右鍵圖片
  Blockly.Blocks['right_click_image'] = {
    init: function() {
      this.jsonInit({
        type: 'right_click_image',
        message0: '右鍵點擊圖片 %1 信心度 %2 超時 %3 秒',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '在螢幕上找到指定圖片並右鍵點擊',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 輸入文字
  Blockly.Blocks['type_text'] = {
    init: function() {
      this.jsonInit({
        type: 'type_text',
        message0: '輸入文字 %1',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '模擬鍵盤輸入文字（支援中文）',
      } as BlockJson)
    }
  }

  // 快捷鍵
  Blockly.Blocks['hotkey'] = {
    init: function() {
      this.jsonInit({
        type: 'hotkey',
        message0: '按下快捷鍵 %1',
        args0: [
          { type: 'field_input', name: 'KEYS', text: 'ctrl+c' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '執行鍵盤組合鍵（如 ctrl+c, alt+tab）',
      } as BlockJson)
    }
  }

  // 滾動
  Blockly.Blocks['scroll'] = {
    init: function() {
      this.jsonInit({
        type: 'scroll',
        message0: '滾動 %1 %2 格',
        args0: [
          { type: 'field_dropdown', name: 'DIRECTION', options: [['向上', 'up'], ['向下', 'down']] },
          { type: 'field_number', name: 'AMOUNT', value: 3, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '滾動滑鼠滾輪',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 拖放
  Blockly.Blocks['drag_drop'] = {
    init: function() {
      this.jsonInit({
        type: 'drag_drop',
        message0: '從圖片 %1 拖到圖片 %2 信心度 %3',
        args0: [
          { type: 'field_input', name: 'FROM_IMAGE', text: 'source.png' },
          { type: 'field_input', name: 'TO_IMAGE', text: 'target.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '從一個圖片位置拖曳到另一個圖片位置',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 等待
  Blockly.Blocks['wait'] = {
    init: function() {
      this.jsonInit({
        type: 'wait',
        message0: '等待 %1 秒',
        args0: [
          { type: 'field_number', name: 'SECONDS', value: 1, min: 0 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '等待指定的秒數',
      } as BlockJson)
    }
  }

  // 等待圖片出現
  Blockly.Blocks['wait_image'] = {
    init: function() {
      this.jsonInit({
        type: 'wait_image',
        message0: '等待圖片出現 %1 信心度 %2 超時 %3 秒',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '等待直到指定圖片出現在螢幕上',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 等待圖片消失
  Blockly.Blocks['wait_image_gone'] = {
    init: function() {
      this.jsonInit({
        type: 'wait_image_gone',
        message0: '等待圖片消失 %1 信心度 %2 超時 %3 秒',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#3B82F6',
        tooltip: '等待直到指定圖片從螢幕上消失',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 控制類 ====================

  // 如果圖片存在
  Blockly.Blocks['if_image_exists'] = {
    init: function() {
      this.jsonInit({
        type: 'if_image_exists',
        message0: '如果圖片 %1 存在 (信心度 %2)',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        message1: '執行 %1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        message2: '否則 %1',
        args2: [
          { type: 'input_statement', name: 'ELSE' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '根據圖片是否存在來執行不同的動作',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 重複 N 次
  Blockly.Blocks['loop_times'] = {
    init: function() {
      this.jsonInit({
        type: 'loop_times',
        message0: '重複 %1 次',
        args0: [
          { type: 'field_number', name: 'TIMES', value: 1, min: 1 },
        ],
        message1: '%1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '重複執行指定次數',
      } as BlockJson)
    }
  }

  // 當圖片存在時重複
  Blockly.Blocks['loop_while_image'] = {
    init: function() {
      this.jsonInit({
        type: 'loop_while_image',
        message0: '當圖片 %1 存在時重複 (信心度 %2)',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        message1: '%1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '當圖片存在時持續執行',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 重複直到圖片出現
  Blockly.Blocks['loop_until_image'] = {
    init: function() {
      this.jsonInit({
        type: 'loop_until_image',
        message0: '重複直到圖片 %1 出現 (信心度 %2)',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        message1: '%1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '重複執行直到圖片出現',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 跳出迴圈
  Blockly.Blocks['break_loop'] = {
    init: function() {
      this.jsonInit({
        type: 'break_loop',
        message0: '跳出迴圈',
        previousStatement: null,
        colour: '#8B5CF6',
        tooltip: '中斷當前迴圈',
      } as BlockJson)
    }
  }

  // 繼續下一輪
  Blockly.Blocks['continue_loop'] = {
    init: function() {
      this.jsonInit({
        type: 'continue_loop',
        message0: '繼續下一輪',
        previousStatement: null,
        colour: '#8B5CF6',
        tooltip: '跳過本輪迴圈，繼續下一輪',
      } as BlockJson)
    }
  }

  // ==================== 變數類 ====================

  // 設定變數
  Blockly.Blocks['set_variable'] = {
    init: function() {
      this.jsonInit({
        type: 'set_variable',
        message0: '設定變數 %1 = %2',
        args0: [
          { type: 'field_input', name: 'VAR_NAME', text: 'my_var' },
          { type: 'field_input', name: 'VALUE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '設定變數值',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 取得變數
  Blockly.Blocks['get_variable'] = {
    init: function() {
      this.jsonInit({
        type: 'get_variable',
        message0: '變數 %1',
        args0: [
          { type: 'field_input', name: 'VAR_NAME', text: 'my_var' },
        ],
        output: 'String',
        colour: '#F59E0B',
        tooltip: '取得變數值',
      } as BlockJson)
    }
  }

  // 儲存座標
  Blockly.Blocks['save_position'] = {
    init: function() {
      this.jsonInit({
        type: 'save_position',
        message0: '儲存圖片 %1 座標到變數 %2 (信心度 %3)',
        args0: [
          { type: 'field_input', name: 'IMAGE_PATH', text: 'image.png' },
          { type: 'field_input', name: 'VAR_NAME', text: 'position' },
          { type: 'field_number', name: 'CONFIDENCE', value: 0.8, min: 0.1, max: 1, precision: 0.05 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '找到圖片並將座標存入變數',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 進階類 ====================

  // 執行子腳本
  Blockly.Blocks['run_script'] = {
    init: function() {
      this.jsonInit({
        type: 'run_script',
        message0: '執行腳本 %1',
        args0: [
          { type: 'field_input', name: 'SCRIPT_ID', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '執行另一個腳本',
      } as BlockJson)
    }
  }

  // HTTP 請求
  Blockly.Blocks['http_request'] = {
    init: function() {
      this.jsonInit({
        type: 'http_request',
        message0: '發送 %1 請求到 %2',
        args0: [
          { type: 'field_dropdown', name: 'METHOD', options: [['GET', 'GET'], ['POST', 'POST'], ['PUT', 'PUT'], ['DELETE', 'DELETE']] },
          { type: 'field_input', name: 'URL', text: 'https://api.example.com' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '發送 HTTP 請求',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 執行命令
  Blockly.Blocks['run_command'] = {
    init: function() {
      this.jsonInit({
        type: 'run_command',
        message0: '執行命令 %1',
        args0: [
          { type: 'field_input', name: 'COMMAND', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '執行系統命令',
      } as BlockJson)
    }
  }

  // 記錄日誌
  Blockly.Blocks['log_message'] = {
    init: function() {
      this.jsonInit({
        type: 'log_message',
        message0: '記錄 %1 訊息 %2',
        args0: [
          { type: 'field_dropdown', name: 'LEVEL', options: [['資訊', 'info'], ['警告', 'warning'], ['錯誤', 'error'], ['除錯', 'debug']] },
          { type: 'field_input', name: 'MESSAGE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '輸出日誌訊息',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 截圖
  Blockly.Blocks['screenshot'] = {
    init: function() {
      this.jsonInit({
        type: 'screenshot',
        message0: '儲存截圖到 %1',
        args0: [
          { type: 'field_input', name: 'SAVE_PATH', text: 'screenshot.png' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '擷取當前螢幕並儲存',
      } as BlockJson)
    }
  }
}

/**
 * 將 Block 資料載入到 Workspace
 */
export function blocksToWorkspace(blocks: any[], workspace: Blockly.WorkspaceSvg): void {
  if (!blocks || blocks.length === 0) return

  // 使用 Blockly 的 JSON 序列化格式
  const xmlText = blocksToXml(blocks)
  const xml = Blockly.utils.xml.textToDom(xmlText)
  Blockly.Xml.domToWorkspace(xml, workspace)
}

/**
 * 從 Workspace 匯出 Block 資料
 */
export function workspaceToBlocks(workspace: Blockly.WorkspaceSvg): any[] {
  const blocks: any[] = []
  const topBlocks = workspace.getTopBlocks(true)

  console.log('[workspaceToBlocks] Top blocks count:', topBlocks.length)

  for (const block of topBlocks) {
    // 使用 collectChainedBlocks 來收集整個鏈上的所有 blocks
    const chainedBlocks = collectChainedBlocks(block)
    console.log('[workspaceToBlocks] Block chain:', block.type, '-> collected', chainedBlocks.length, 'blocks')
    blocks.push(...chainedBlocks)
  }

  console.log('[workspaceToBlocks] Total blocks to save:', blocks.length, blocks)

  return blocks
}

/**
 * 單一 Block 轉 JSON
 */
function blockToJson(block: Blockly.Block): any {
  const json: any = {
    id: getBackendBlockType(block.type),
    instance_id: block.id,
    params: {},
    children: [],
    else_children: [],
  }

  // 收集欄位值
  block.inputList.forEach(input => {
    input.fieldRow.forEach(field => {
      if (field.name) {
        const value = field.getValue()
        const paramName = fieldNameToParam(field.name)
        json.params[paramName] = value
      }
    })

    // 收集子 blocks
    if (input.name === 'DO' && input.connection) {
      const childBlock = input.connection.targetBlock()
      if (childBlock) {
        json.children = collectChainedBlocks(childBlock)
      }
    }
    
    if (input.name === 'ELSE' && input.connection) {
      const elseBlock = input.connection.targetBlock()
      if (elseBlock) {
        json.else_children = collectChainedBlocks(elseBlock)
      }
    }
  })

  return json
}

/**
 * 收集連鎖的 blocks
 */
function collectChainedBlocks(block: Blockly.Block): any[] {
  const blocks: any[] = []
  let current: Blockly.Block | null = block

  while (current) {
    blocks.push(blockToJson(current))
    current = current.getNextBlock()
  }

  return blocks
}

/**
 * Blocks 轉 XML
 */
function blocksToXml(blocks: any[]): string {
  let xml = '<xml xmlns="https://developers.google.com/blockly/xml">'

  // 使用 chaainedBlocksToXml 來正確串聯積木
  if (blocks.length > 0) {
    xml += chaainedBlocksToXml(blocks)
  }

  xml += '</xml>'
  return xml
}

/**
 * 單一 Block 轉 XML
 */
function blockToXml(block: any): string {
  const frontendType = getBlocklyBlockType(block.id)
  let xml = `<block type="${frontendType}" id="${block.instance_id}">`

  // 欄位值
  for (const [key, value] of Object.entries(block.params || {})) {
    const fieldName = paramToFieldName(key)
    xml += `<field name="${fieldName}">${value}</field>`
  }

  // 子 blocks
  if (block.children && block.children.length > 0) {
    xml += '<statement name="DO">'
    xml += chaainedBlocksToXml(block.children)
    xml += '</statement>'
  }

  // else blocks
  if (block.else_children && block.else_children.length > 0) {
    xml += '<statement name="ELSE">'
    xml += chaainedBlocksToXml(block.else_children)
    xml += '</statement>'
  }

  xml += '</block>'
  return xml
}

/**
 * 連鎖 blocks 轉 XML
 */
function chaainedBlocksToXml(blocks: any[]): string {
  let xml = ''

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const frontendType = getBlocklyBlockType(block.id)
    
    xml += `<block type="${frontendType}" id="${block.instance_id}">`

    // 欄位值
    for (const [key, value] of Object.entries(block.params || {})) {
      const fieldName = paramToFieldName(key)
      xml += `<field name="${fieldName}">${value}</field>`
    }

    // 子 blocks
    if (block.children && block.children.length > 0) {
      xml += '<statement name="DO">'
      xml += chaainedBlocksToXml(block.children)
      xml += '</statement>'
    }

    // else blocks
    if (block.else_children && block.else_children.length > 0) {
      xml += '<statement name="ELSE">'
      xml += chaainedBlocksToXml(block.else_children)
      xml += '</statement>'
    }

    // 下一個 block
    if (i < blocks.length - 1) {
      xml += '<next>'
    }
  }

  // 關閉標籤
  for (let i = blocks.length - 1; i >= 0; i--) {
    if (i < blocks.length - 1) {
      xml += '</next>'
    }
    xml += '</block>'
  }

  return xml
}

/**
 * 後端 Block ID 轉前端 Blockly 類型
 */
function getBlocklyBlockType(backendId: string): string {
  const mapping: Record<string, string> = {
    'break': 'break_loop',
    'continue': 'continue_loop',
    'log': 'log_message',
  }
  return mapping[backendId] || backendId
}

/**
 * 前端 Blockly 類型轉後端 Block ID
 */
function getBackendBlockType(blocklyType: string): string {
  const mapping: Record<string, string> = {
    'break_loop': 'break',
    'continue_loop': 'continue',
    'log_message': 'log',
  }
  return mapping[blocklyType] || blocklyType
}

/**
 * 欄位名轉參數名 (大寫 + 底線 -> 小寫 + 底線)
 */
function fieldNameToParam(fieldName: string): string {
  return fieldName.toLowerCase()
}

/**
 * 參數名轉欄位名
 */
function paramToFieldName(param: string): string {
  return param.toUpperCase()
}
