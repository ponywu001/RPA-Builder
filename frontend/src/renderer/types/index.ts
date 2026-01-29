/**
 * TypeScript 類型定義
 */

// 腳本相關
export interface Script {
  id: string
  name: string
  description?: string
  blocks: Block[]
  created_at: string
  updated_at: string
}

export interface Block {
  id: string           // Block 類型 ID
  instance_id: string  // 唯一實例 ID
  params: Record<string, any>
  children?: Block[]
  else_children?: Block[]
}

export interface BlockDefinition {
  id: string
  name: string
  category: 'action' | 'control' | 'variable' | 'advanced'
  description: string
  params: Record<string, BlockParam>
  has_children: boolean
  has_else: boolean
  color: string
}

export interface BlockParam {
  type: 'text' | 'number' | 'image' | 'select' | 'keys' | 'json' | 'script' | 'any'
  required?: boolean
  default?: any
  description?: string
  options?: string[]
}

// 執行相關
export interface ExecutionStatus {
  execution_id: string
  script_id: string
  script_name: string
  status: 'pending' | 'running' | 'paused' | 'success' | 'failed' | 'stopped'
  progress: {
    current_step: number
    total_steps: number
    current_block_id?: string
  }
  started_at?: string
  finished_at?: string
  error?: string
  variables: Record<string, any>
  logs?: LogEntry[]
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warning' | 'error'
  message: string
}

// 截圖相關
export interface Template {
  name: string
  path: string
  size: number
  created_at: string
  modified_at: string
}

export interface Position {
  x: number
  y: number
  width: number
  height: number
  confidence: number
}

// 系統相關
export interface ScreenInfo {
  width: number
  height: number
  displays: DisplayInfo[]
}

export interface DisplayInfo {
  index: number
  left: number
  top: number
  width: number
  height: number
}

export interface MousePosition {
  x: number
  y: number
}

// API 請求/回應
export interface CreateScriptRequest {
  name: string
  description?: string
  blocks?: Block[]
}

export interface UpdateScriptRequest {
  name?: string
  description?: string
  blocks?: Block[]
}

export interface ExecuteRequest {
  variables?: Record<string, any>
}

export interface CaptureTestResult {
  found: boolean
  position?: Position
}
