/**
 * WebSocket 服務 - 即時執行狀態推送
 */

type MessageHandler = (data: any) => void

interface WebSocketMessage {
  type: string
  data?: any
  execution_id?: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private url: string = ''
  private handlers: Map<string, Set<MessageHandler>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false
  private subscribedExecutions: Set<string> = new Set()

  /**
   * 初始化 WebSocket 連接
   */
  connect(url?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true

    // 根據當前頁面協議決定 ws 或 wss
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname || 'localhost'
    const port = '8000' // 後端端口
    this.url = url || `${protocol}//${host}:${port}/api/ws`

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('[WebSocket] Connected')
        this.isConnecting = false
        this.reconnectAttempts = 0

        // 重新訂閱之前的執行
        this.subscribedExecutions.forEach(executionId => {
          this.subscribe(executionId)
        })

        this.emit('connected', {})
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('[WebSocket] Disconnected')
        this.isConnecting = false
        this.ws = null
        this.emit('disconnected', {})

        // 嘗試重連
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`[WebSocket] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
          setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts)
        }
      }

      this.ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
        this.isConnecting = false
      }
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error)
      this.isConnecting = false
    }
  }

  /**
   * 斷開連接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.subscribedExecutions.clear()
  }

  /**
   * 訂閱執行狀態更新
   */
  subscribe(executionId: string): void {
    this.subscribedExecutions.add(executionId)
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        execution_id: executionId,
      }))
    }
  }

  /**
   * 取消訂閱
   */
  unsubscribe(executionId: string): void {
    this.subscribedExecutions.delete(executionId)
    
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        execution_id: executionId,
      }))
    }
  }

  /**
   * 發送心跳
   */
  ping(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'ping' }))
    }
  }

  /**
   * 註冊事件處理器
   */
  on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)

    // 返回取消註冊函數
    return () => {
      this.handlers.get(event)?.delete(handler)
    }
  }

  /**
   * 觸發事件
   */
  private emit(event: string, data: any): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error('[WebSocket] Handler error:', error)
        }
      })
    }
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(message: WebSocketMessage): void {
    const { type, data } = message

    switch (type) {
      case 'execution_update':
        this.emit('execution_update', data)
        break

      case 'log':
        this.emit('log', data)
        break

      case 'subscribed':
        console.log('[WebSocket] Subscribed to:', message.execution_id)
        break

      case 'unsubscribed':
        console.log('[WebSocket] Unsubscribed from:', message.execution_id)
        break

      case 'pong':
        // 心跳響應
        break

      case 'error':
        console.error('[WebSocket] Server error:', data)
        break

      default:
        console.log('[WebSocket] Unknown message type:', type)
    }
  }

  /**
   * 連接狀態
   */
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 導出單例
export const wsService = new WebSocketService()
