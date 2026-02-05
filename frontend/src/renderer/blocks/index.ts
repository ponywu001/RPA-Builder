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

  // 發送 Email
  Blockly.Blocks['send_email'] = {
    init: function() {
      this.jsonInit({
        type: 'send_email',
        message0: '發送郵件 收件人 %1 主旨 %2',
        args0: [
          { type: 'field_input', name: 'TO', text: '' },
          { type: 'field_input', name: 'SUBJECT', text: '' },
        ],
        message1: '內容 %1',
        args1: [
          { type: 'field_input', name: 'BODY', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#EC4899',
        tooltip: '發送 Email 通知',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 錯誤重試
  Blockly.Blocks['retry'] = {
    init: function() {
      this.jsonInit({
        type: 'retry',
        message0: '重試 %1 次 (間隔 %2 秒)',
        args0: [
          { type: 'field_number', name: 'TIMES', value: 3 },
          { type: 'field_number', name: 'INTERVAL', value: 1 },
        ],
        message1: '執行 %1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '失敗時自動重試',
      } as BlockJson)
    }
  }

  // ==================== 檔案操作 ====================

  // 讀取檔案
  Blockly.Blocks['read_file'] = {
    init: function() {
      this.jsonInit({
        type: 'read_file',
        message0: '讀取檔案 %1',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: 'file.txt' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '讀取檔案內容',
      } as BlockJson)
    }
  }

  // 寫入檔案
  Blockly.Blocks['write_file'] = {
    init: function() {
      this.jsonInit({
        type: 'write_file',
        message0: '%1 到檔案 %2 內容: %3',
        args0: [
          { type: 'field_dropdown', name: 'APPEND', options: [['寫入', 'false'], ['附加', 'true']] },
          { type: 'field_input', name: 'FILE_PATH', text: 'file.txt' },
          { type: 'field_input', name: 'CONTENT', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '寫入或附加內容到檔案',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 複製檔案
  Blockly.Blocks['copy_file'] = {
    init: function() {
      this.jsonInit({
        type: 'copy_file',
        message0: '複製 %1 到 %2',
        args0: [
          { type: 'field_input', name: 'SOURCE', text: '' },
          { type: 'field_input', name: 'DESTINATION', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '複製檔案或資料夾',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 移動檔案
  Blockly.Blocks['move_file'] = {
    init: function() {
      this.jsonInit({
        type: 'move_file',
        message0: '移動 %1 到 %2',
        args0: [
          { type: 'field_input', name: 'SOURCE', text: '' },
          { type: 'field_input', name: 'DESTINATION', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '移動檔案或資料夾',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 刪除檔案
  Blockly.Blocks['delete_file'] = {
    init: function() {
      this.jsonInit({
        type: 'delete_file',
        message0: '刪除 %1',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '刪除檔案或資料夾',
      } as BlockJson)
    }
  }

  // 檔案存在
  Blockly.Blocks['file_exists'] = {
    init: function() {
      this.jsonInit({
        type: 'file_exists',
        message0: '如果檔案 %1 存在',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: '' },
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
        tooltip: '檢查檔案是否存在',
      } as BlockJson)
    }
  }

  // 列出檔案
  Blockly.Blocks['list_files'] = {
    init: function() {
      this.jsonInit({
        type: 'list_files',
        message0: '列出目錄 %1 的檔案 (模式: %2)',
        args0: [
          { type: 'field_input', name: 'DIRECTORY', text: '' },
          { type: 'field_input', name: 'PATTERN', text: '*' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '列出目錄下的檔案',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== Excel 操作 ====================

  // 讀取 Excel
  Blockly.Blocks['excel_read'] = {
    init: function() {
      this.jsonInit({
        type: 'excel_read',
        message0: '讀取 Excel %1 工作表 %2 存入 %3',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: 'data.xlsx' },
          { type: 'field_input', name: 'SHEET', text: 'Sheet1' },
          { type: 'field_input', name: 'VAR_NAME', text: 'data' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '讀取 Excel 檔案到變數（列表格式）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 寫入 Excel
  Blockly.Blocks['excel_write'] = {
    init: function() {
      this.jsonInit({
        type: 'excel_write',
        message0: '寫入 Excel %1 工作表 %2 資料 %3',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: 'output.xlsx' },
          { type: 'field_input', name: 'SHEET', text: 'Sheet1' },
          { type: 'field_input', name: 'DATA_VAR', text: 'data' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '將資料寫入 Excel 檔案',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 讀取 Excel 儲存格
  Blockly.Blocks['excel_read_cell'] = {
    init: function() {
      this.jsonInit({
        type: 'excel_read_cell',
        message0: '讀取 Excel %1 工作表 %2 儲存格 %3 存入 %4',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: 'data.xlsx' },
          { type: 'field_input', name: 'SHEET', text: 'Sheet1' },
          { type: 'field_input', name: 'CELL', text: 'A1' },
          { type: 'field_input', name: 'VAR_NAME', text: 'value' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '讀取 Excel 指定儲存格的值',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 寫入 Excel 儲存格
  Blockly.Blocks['excel_write_cell'] = {
    init: function() {
      this.jsonInit({
        type: 'excel_write_cell',
        message0: '寫入 Excel %1 工作表 %2 儲存格 %3 值 %4',
        args0: [
          { type: 'field_input', name: 'FILE_PATH', text: 'data.xlsx' },
          { type: 'field_input', name: 'SHEET', text: 'Sheet1' },
          { type: 'field_input', name: 'CELL', text: 'A1' },
          { type: 'field_input', name: 'VALUE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '寫入 Excel 指定儲存格',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 錯誤處理 ====================

  // Try-Catch
  Blockly.Blocks['try_catch'] = {
    init: function() {
      this.jsonInit({
        type: 'try_catch',
        message0: '嘗試執行',
        message1: '%1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        message2: '如果發生錯誤',
        message3: '%1',
        args3: [
          { type: 'input_statement', name: 'ELSE' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: 'Try-Catch 錯誤處理，錯誤資訊存入 _error 變數',
      } as BlockJson)
    }
  }

  // ==================== 迴圈增強 ====================

  // For Each
  Blockly.Blocks['for_each'] = {
    init: function() {
      this.jsonInit({
        type: 'for_each',
        message0: '遍歷列表 %1 (項目變數: %2)',
        args0: [
          { type: 'field_input', name: 'LIST', text: '["a", "b", "c"]' },
          { type: 'field_input', name: 'VARIABLE_NAME', text: 'item' },
        ],
        message1: '%1',
        args1: [
          { type: 'input_statement', name: 'DO' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#8B5CF6',
        tooltip: '遍歷列表中的每個項目',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 字串處理 ====================

  // 字串拼接（舊版，保留兼容）
  Blockly.Blocks['string_concat'] = {
    init: function() {
      this.jsonInit({
        type: 'string_concat',
        message0: '拼接 %1 + %2 (分隔符: %3) 存入 %4',
        args0: [
          { type: 'field_input', name: 'STRING1', text: '' },
          { type: 'field_input', name: 'STRING2', text: '' },
          { type: 'field_input', name: 'SEPARATOR', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '拼接兩個字串並存入變數',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 字串拼接 V2（可拖放變數）
  Blockly.Blocks['string_concat_v2'] = {
    init: function() {
      this.jsonInit({
        type: 'string_concat_v2',
        message0: '拼接 %1 + %2 存入 %3',
        args0: [
          { type: 'input_value', name: 'STRING1', check: ['String', 'Number'] },
          { type: 'input_value', name: 'STRING2', check: ['String', 'Number'] },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '拼接兩個值並存入變數（可拖入變數積木）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 文字值（可拖放）
  Blockly.Blocks['text_value'] = {
    init: function() {
      this.jsonInit({
        type: 'text_value',
        message0: '"%1"',
        args0: [
          { type: 'field_input', name: 'VALUE', text: '' },
        ],
        output: 'String',
        colour: '#F59E0B',
        tooltip: '文字值',
      } as BlockJson)
    }
  }

  // 數字值（可拖放）
  Blockly.Blocks['number_value'] = {
    init: function() {
      this.jsonInit({
        type: 'number_value',
        message0: '%1',
        args0: [
          { type: 'field_number', name: 'VALUE', value: 0 },
        ],
        output: 'Number',
        colour: '#F59E0B',
        tooltip: '數字值',
      } as BlockJson)
    }
  }

  // 字串分割
  Blockly.Blocks['string_split'] = {
    init: function() {
      this.jsonInit({
        type: 'string_split',
        message0: '分割 %1 (分隔符: %2) 存入 %3',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'SEPARATOR', text: ',' },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '分割字串為列表',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 字串分割 V2（可拖放變數）
  Blockly.Blocks['string_split_v2'] = {
    init: function() {
      this.jsonInit({
        type: 'string_split_v2',
        message0: '分割 %1 (分隔符: %2) 存入 %3',
        args0: [
          { type: 'input_value', name: 'TEXT', check: ['String', 'Number'] },
          { type: 'field_input', name: 'SEPARATOR', text: ',' },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '分割字串為列表（可拖入變數積木）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 字串替換
  Blockly.Blocks['string_replace'] = {
    init: function() {
      this.jsonInit({
        type: 'string_replace',
        message0: '在 %1 中將 %2 替換為 %3 存入 %4',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'SEARCH', text: '' },
          { type: 'field_input', name: 'REPLACE', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '替換字串內容並存入變數',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 字串替換 V2（可拖放變數）
  Blockly.Blocks['string_replace_v2'] = {
    init: function() {
      this.jsonInit({
        type: 'string_replace_v2',
        message0: '在 %1 中將 %2 替換為 %3 存入 %4',
        args0: [
          { type: 'input_value', name: 'TEXT', check: ['String', 'Number'] },
          { type: 'input_value', name: 'SEARCH', check: ['String', 'Number'] },
          { type: 'input_value', name: 'REPLACE', check: ['String', 'Number'] },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '替換字串內容並存入變數（可拖入變數積木）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 正則匹配
  Blockly.Blocks['string_match'] = {
    init: function() {
      this.jsonInit({
        type: 'string_match',
        message0: '在 %1 中匹配正則 %2 存入 %3',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'PATTERN', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'matches' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '正則表達式匹配',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 正則匹配 V2（可拖放變數）
  Blockly.Blocks['string_match_v2'] = {
    init: function() {
      this.jsonInit({
        type: 'string_match_v2',
        message0: '在 %1 中匹配正則 %2 存入 %3',
        args0: [
          { type: 'input_value', name: 'TEXT', check: ['String', 'Number'] },
          { type: 'field_input', name: 'PATTERN', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'matches' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '正則表達式匹配（可拖入變數積木）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 字串格式化
  Blockly.Blocks['string_format'] = {
    init: function() {
      this.jsonInit({
        type: 'string_format',
        message0: '格式化模板 %1',
        args0: [
          { type: 'field_input', name: 'TEMPLATE', text: '${var1} - ${var2}' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '格式化字串模板，使用 ${變數名} 引用變數',
      } as BlockJson)
    }
  }

  // ==================== 數學運算 ====================

  // 數學運算
  Blockly.Blocks['math_operation'] = {
    init: function() {
      this.jsonInit({
        type: 'math_operation',
        message0: '%1 %2 %3 存入 %4',
        args0: [
          { type: 'field_input', name: 'A', text: '' },
          { type: 'field_dropdown', name: 'OPERATION', options: [['＋', 'add'], ['－', 'subtract'], ['×', 'multiply'], ['÷', 'divide'], ['%', 'modulo'], ['^', 'power']] },
          { type: 'field_input', name: 'B', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'result' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '執行數學運算並存入變數（可使用 ${變數名} 引用變數）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 隨機數
  Blockly.Blocks['random_number'] = {
    init: function() {
      this.jsonInit({
        type: 'random_number',
        message0: '隨機數 (最小: %1 最大: %2 %3) 存入 %4',
        args0: [
          { type: 'field_number', name: 'MIN', value: 0 },
          { type: 'field_number', name: 'MAX', value: 100 },
          { type: 'field_dropdown', name: 'INTEGER', options: [['整數', 'true'], ['小數', 'false']] },
          { type: 'field_input', name: 'VAR_NAME', text: 'random' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '生成隨機數並存入變數',
        inputsInline: true,
      } as BlockJson)
    }
  }


  // ==================== 剪貼簿 ====================

  // 讀取剪貼簿
  Blockly.Blocks['clipboard_read'] = {
    init: function() {
      this.jsonInit({
        type: 'clipboard_read',
        message0: '讀取剪貼簿',
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '讀取剪貼簿內容',
      } as BlockJson)
    }
  }

  // 寫入剪貼簿
  Blockly.Blocks['clipboard_write'] = {
    init: function() {
      this.jsonInit({
        type: 'clipboard_write',
        message0: '寫入剪貼簿 %1',
        args0: [
          { type: 'field_input', name: 'CONTENT', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '寫入內容到剪貼簿',
      } as BlockJson)
    }
  }

  // ==================== JSON 操作 ====================

  // 解析 JSON
  Blockly.Blocks['json_parse'] = {
    init: function() {
      this.jsonInit({
        type: 'json_parse',
        message0: '解析 JSON %1',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '{}' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '解析 JSON 字串',
      } as BlockJson)
    }
  }

  // 轉換 JSON
  Blockly.Blocks['json_stringify'] = {
    init: function() {
      this.jsonInit({
        type: 'json_stringify',
        message0: '轉換為 JSON %1 %2',
        args0: [
          { type: 'field_input', name: 'DATA', text: '${data}' },
          { type: 'field_dropdown', name: 'PRETTY', options: [['壓縮', 'false'], ['美化', 'true']] },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '轉換為 JSON 字串',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 取得 JSON 值
  Blockly.Blocks['json_get_value'] = {
    init: function() {
      this.jsonInit({
        type: 'json_get_value',
        message0: '從 %1 取得 %2',
        args0: [
          { type: 'field_input', name: 'DATA', text: '${json}' },
          { type: 'field_input', name: 'PATH', text: 'key.subkey' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F59E0B',
        tooltip: '從 JSON 取得值（支援點號路徑如 user.name）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 視窗控制 ====================

  // 取得視窗
  Blockly.Blocks['get_window'] = {
    init: function() {
      this.jsonInit({
        type: 'get_window',
        message0: '取得視窗 %1',
        args0: [
          { type: 'field_input', name: 'TITLE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '取得視窗資訊',
      } as BlockJson)
    }
  }

  // 啟用視窗
  Blockly.Blocks['activate_window'] = {
    init: function() {
      this.jsonInit({
        type: 'activate_window',
        message0: '啟用視窗 %1',
        args0: [
          { type: 'field_input', name: 'TITLE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '啟用（聚焦）視窗',
      } as BlockJson)
    }
  }

  // 關閉視窗
  Blockly.Blocks['close_window'] = {
    init: function() {
      this.jsonInit({
        type: 'close_window',
        message0: '關閉視窗 %1',
        args0: [
          { type: 'field_input', name: 'TITLE', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '關閉視窗',
      } as BlockJson)
    }
  }

  // 調整視窗大小
  Blockly.Blocks['resize_window'] = {
    init: function() {
      this.jsonInit({
        type: 'resize_window',
        message0: '調整視窗 %1 大小為 %2 x %3',
        args0: [
          { type: 'field_input', name: 'TITLE', text: '' },
          { type: 'field_number', name: 'WIDTH', value: 800 },
          { type: 'field_number', name: 'HEIGHT', value: 600 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '調整視窗大小',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 移動視窗
  Blockly.Blocks['move_window'] = {
    init: function() {
      this.jsonInit({
        type: 'move_window',
        message0: '移動視窗 %1 到 X: %2 Y: %3',
        args0: [
          { type: 'field_input', name: 'TITLE', text: '' },
          { type: 'field_number', name: 'X', value: 0 },
          { type: 'field_number', name: 'Y', value: 0 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#10B981',
        tooltip: '移動視窗位置',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== OCR ====================

  // OCR 讀取文字
  Blockly.Blocks['ocr_read_text'] = {
    init: function() {
      this.jsonInit({
        type: 'ocr_read_text',
        message0: 'OCR 讀取螢幕文字 (語言: %1)',
        args0: [
          { type: 'field_input', name: 'LANGUAGE', text: 'eng+chi_tra' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#EC4899',
        tooltip: '使用 OCR 讀取螢幕上的所有文字',
      } as BlockJson)
    }
  }

  // OCR 尋找文字
  Blockly.Blocks['ocr_find_text'] = {
    init: function() {
      this.jsonInit({
        type: 'ocr_find_text',
        message0: 'OCR 尋找文字 %1 (語言: %2)',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'LANGUAGE', text: 'eng+chi_tra' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#EC4899',
        tooltip: '使用 OCR 尋找文字位置',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // OCR 點擊文字
  Blockly.Blocks['ocr_click_text'] = {
    init: function() {
      this.jsonInit({
        type: 'ocr_click_text',
        message0: 'OCR 點擊文字 %1 (語言: %2 超時: %3 秒)',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'LANGUAGE', text: 'eng+chi_tra' },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#EC4899',
        tooltip: '使用 OCR 尋找並點擊文字',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // OCR 等待文字
  Blockly.Blocks['ocr_wait_text'] = {
    init: function() {
      this.jsonInit({
        type: 'ocr_wait_text',
        message0: 'OCR 等待文字 %1 出現 (語言: %2 超時: %3 秒)',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'LANGUAGE', text: 'eng+chi_tra' },
          { type: 'field_number', name: 'TIMEOUT', value: 30, min: 1 },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#EC4899',
        tooltip: '等待直到指定文字出現',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // 如果 OCR 文字存在
  Blockly.Blocks['if_ocr_text_exists'] = {
    init: function() {
      this.jsonInit({
        type: 'if_ocr_text_exists',
        message0: '如果 OCR 文字 %1 存在 (語言: %2)',
        args0: [
          { type: 'field_input', name: 'TEXT', text: '' },
          { type: 'field_input', name: 'LANGUAGE', text: 'eng+chi_tra' },
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
        colour: '#EC4899',
        tooltip: '使用 OCR 檢查文字是否存在',
        inputsInline: true,
      } as BlockJson)
    }
  }

  // ==================== 瀏覽器自動化 ====================

  Blockly.Blocks['browser_open'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_open',
        message0: '開啟瀏覽器 %1 儲存為 %2',
        args0: [
          { type: 'field_dropdown', name: 'BROWSER', options: [['Chrome', 'chromium'], ['Firefox', 'firefox'], ['Edge', 'webkit']] },
          { type: 'field_input', name: 'VAR_NAME', text: 'browser' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '開啟瀏覽器（需要 Playwright）',
        inputsInline: true,
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_goto'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_goto',
        message0: '前往網址 %1',
        args0: [
          { type: 'field_input', name: 'URL', text: 'https://' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '前往指定網址',
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_click'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_click',
        message0: '點擊元素 %1',
        args0: [
          { type: 'field_input', name: 'SELECTOR', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '點擊網頁元素（CSS 選擇器）',
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_type'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_type',
        message0: '在元素 %1 輸入 %2',
        args0: [
          { type: 'field_input', name: 'SELECTOR', text: '' },
          { type: 'field_input', name: 'TEXT', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '在網頁元素中輸入文字',
        inputsInline: true,
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_get_text'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_get_text',
        message0: '取得元素 %1 的文字 存入 %2',
        args0: [
          { type: 'field_input', name: 'SELECTOR', text: '' },
          { type: 'field_input', name: 'VAR_NAME', text: 'text' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '取得網頁元素的文字內容',
        inputsInline: true,
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_screenshot'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_screenshot',
        message0: '瀏覽器截圖 儲存到 %1',
        args0: [
          { type: 'field_input', name: 'PATH', text: 'screenshot.png' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '擷取瀏覽器畫面',
      } as BlockJson)
    }
  }

  Blockly.Blocks['browser_close'] = {
    init: function() {
      this.jsonInit({
        type: 'browser_close',
        message0: '關閉瀏覽器',
        previousStatement: null,
        nextStatement: null,
        colour: '#06B6D4',
        tooltip: '關閉瀏覽器',
      } as BlockJson)
    }
  }

  // ==================== 資料庫操作 ====================

  Blockly.Blocks['db_connect'] = {
    init: function() {
      this.jsonInit({
        type: 'db_connect',
        message0: '連接資料庫 %1 路徑 %2 儲存為 %3',
        args0: [
          { type: 'field_dropdown', name: 'TYPE', options: [['SQLite', 'sqlite'], ['MySQL', 'mysql'], ['PostgreSQL', 'postgresql']] },
          { type: 'field_input', name: 'CONNECTION', text: 'database.db' },
          { type: 'field_input', name: 'VAR_NAME', text: 'db' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F97316',
        tooltip: '連接資料庫',
        inputsInline: true,
      } as BlockJson)
    }
  }

  Blockly.Blocks['db_query'] = {
    init: function() {
      this.jsonInit({
        type: 'db_query',
        message0: '查詢 SQL %1 結果存入 %2',
        args0: [
          { type: 'field_input', name: 'SQL', text: 'SELECT * FROM table' },
          { type: 'field_input', name: 'VAR_NAME', text: 'results' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F97316',
        tooltip: '執行 SQL 查詢',
        inputsInline: true,
      } as BlockJson)
    }
  }

  Blockly.Blocks['db_execute'] = {
    init: function() {
      this.jsonInit({
        type: 'db_execute',
        message0: '執行 SQL %1',
        args0: [
          { type: 'field_input', name: 'SQL', text: '' },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: '#F97316',
        tooltip: '執行 SQL 語句（INSERT/UPDATE/DELETE）',
      } as BlockJson)
    }
  }

  Blockly.Blocks['db_close'] = {
    init: function() {
      this.jsonInit({
        type: 'db_close',
        message0: '關閉資料庫連接',
        previousStatement: null,
        nextStatement: null,
        colour: '#F97316',
        tooltip: '關閉資料庫連接',
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
