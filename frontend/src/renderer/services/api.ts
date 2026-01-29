/**
 * API 服務
 */

import {
  Script,
  BlockDefinition,
  ExecutionStatus,
  LogEntry,
  Template,
  CreateScriptRequest,
  UpdateScriptRequest,
  ExecuteRequest,
  CaptureTestResult,
  ScreenInfo,
  MousePosition,
} from '../types'

// 後端 API URL - 使用相對路徑讓 Vite 代理處理
let API_BASE = '/api'

// 初始化 API URL（生產環境從 Electron 取得）
async function initApiUrl(): Promise<void> {
  // 檢查是否為生產環境（非 localhost）
  const isProduction = !window.location.hostname.includes('localhost')
  
  if (isProduction && window.electronAPI) {
    try {
      const url = await window.electronAPI.getBackendUrl()
      API_BASE = `${url}/api`
    } catch (error) {
      console.warn('無法取得後端 URL，使用預設值')
    }
  }
  // 開發環境使用相對路徑，讓 Vite 代理處理
}

// 初始化
initApiUrl()

/**
 * HTTP 請求封裝
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(error.detail || error.error || '請求失敗')
  }

  // 處理圖片回應
  if (response.headers.get('content-type')?.startsWith('image/')) {
    const blob = await response.blob()
    return URL.createObjectURL(blob) as any
  }

  return response.json()
}

/**
 * API 方法
 */
export const api = {
  // ==================== 腳本管理 ====================
  
  async getScripts(): Promise<Script[]> {
    const data = await request<{ scripts: Script[] }>('/scripts')
    return data.scripts
  },

  async getScript(scriptId: string): Promise<Script> {
    return request<Script>(`/scripts/${scriptId}`)
  },

  async createScript(data: CreateScriptRequest): Promise<Script> {
    return request<Script>('/scripts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async updateScript(scriptId: string, data: UpdateScriptRequest): Promise<Script> {
    return request<Script>(`/scripts/${scriptId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  async deleteScript(scriptId: string): Promise<void> {
    await request(`/scripts/${scriptId}`, {
      method: 'DELETE',
    })
  },

  async exportScript(scriptId: string): Promise<string> {
    const data = await request<{ data: string }>(`/scripts/${scriptId}/export`)
    return data.data
  },

  async exportScriptPython(scriptId: string): Promise<string> {
    const url = `/api/scripts/${scriptId}/export/python`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('匯出失敗')
    }
    return response.text()
  },

  async importScript(json: string): Promise<Script> {
    return request<Script>('/scripts/import', {
      method: 'POST',
      body: JSON.stringify({ json }),
    })
  },

  // ==================== 執行控制 ====================

  async executeScript(scriptId: string, variables?: Record<string, any>): Promise<ExecutionStatus> {
    return request<ExecutionStatus>(`/execute/${scriptId}`, {
      method: 'POST',
      body: JSON.stringify({ variables: variables || {} }),
    })
  },

  async executeScriptAsync(scriptId: string, variables?: Record<string, any>): Promise<{ execution_id: string }> {
    return request<{ execution_id: string }>(`/execute/${scriptId}/async`, {
      method: 'POST',
      body: JSON.stringify({ variables: variables || {} }),
    })
  },

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    return request<ExecutionStatus>(`/executions/${executionId}`)
  },

  async getExecutionLogs(executionId: string): Promise<LogEntry[]> {
    const data = await request<{ logs: LogEntry[] }>(`/executions/${executionId}/logs`)
    return data.logs
  },

  async stopExecution(executionId: string): Promise<void> {
    await request(`/executions/${executionId}/stop`, {
      method: 'POST',
    })
  },

  async pauseExecution(executionId: string): Promise<void> {
    await request(`/executions/${executionId}/pause`, {
      method: 'POST',
    })
  },

  async resumeExecution(executionId: string): Promise<void> {
    await request(`/executions/${executionId}/resume`, {
      method: 'POST',
    })
  },

  async getExecutions(params?: {
    script_id?: string
    status?: string
    limit?: number
  }): Promise<ExecutionStatus[]> {
    const searchParams = new URLSearchParams()
    if (params?.script_id) searchParams.set('script_id', params.script_id)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    
    const query = searchParams.toString()
    const data = await request<{ executions: ExecutionStatus[] }>(
      `/executions${query ? `?${query}` : ''}`
    )
    return data.executions
  },

  // ==================== 截圖工具 ====================

  async captureScreen(): Promise<string> {
    return request<string>('/capture/screen')
  },

  async captureRegion(x: number, y: number, width: number, height: number): Promise<string> {
    return request<string>('/capture/region', {
      method: 'POST',
      body: JSON.stringify({ x, y, width, height }),
    })
  },

  async saveTemplate(image: string, name: string): Promise<string> {
    const data = await request<{ path: string }>('/capture/save', {
      method: 'POST',
      body: JSON.stringify({ image, name }),
    })
    return data.path
  },

  async getTemplates(): Promise<Template[]> {
    const data = await request<{ templates: Template[] }>('/capture/templates')
    return data.templates
  },

  async deleteTemplate(name: string): Promise<void> {
    await request(`/capture/templates/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    })
  },

  async testTemplate(templatePath: string, confidence?: number): Promise<CaptureTestResult> {
    return request<CaptureTestResult>('/capture/test', {
      method: 'POST',
      body: JSON.stringify({
        template_path: templatePath,
        confidence: confidence || 0.8,
      }),
    })
  },

  getTemplateUrl(name: string): string {
    return `${API_BASE}/capture/templates/${encodeURIComponent(name)}`
  },

  // ==================== 系統 ====================

  async getHealth(): Promise<{ status: string; version: string }> {
    return request('/health')
  },

  async getScreenInfo(): Promise<ScreenInfo> {
    return request<ScreenInfo>('/system/screen')
  },

  async getMousePosition(): Promise<MousePosition> {
    return request<MousePosition>('/system/mouse')
  },

  async getBlockDefinitions(): Promise<BlockDefinition[]> {
    const data = await request<{ blocks: BlockDefinition[] }>('/blocks')
    return data.blocks
  },

  async getBlockDefinitionsByCategory(category: string): Promise<BlockDefinition[]> {
    const data = await request<{ blocks: BlockDefinition[] }>(`/blocks/${category}`)
    return data.blocks
  },
}
