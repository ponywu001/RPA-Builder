/**
 * 程式碼預覽面板 - 即時顯示生成的 Python 代碼
 */

import React, { useState, useEffect, useRef } from 'react'
import { Script } from '../types'
import { api } from '../services/api'

interface CodePreviewPanelProps {
  script: Script | null
  isVisible: boolean
  onToggle: () => void
}

const CodePreviewPanel: React.FC<CodePreviewPanelProps> = ({
  script,
  isVisible,
  onToggle,
}) => {
  const [code, setCode] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const codeRef = useRef<HTMLPreElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 當腳本變更時重新生成代碼
  useEffect(() => {
    if (!script || !isVisible) return

    // 防抖
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const pythonCode = await api.exportScriptPython(script.id)
        setCode(pythonCode)
      } catch (err) {
        setError('無法生成代碼')
        console.error('生成代碼失敗:', err)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [script?.id, script?.blocks, isVisible])

  // 複製代碼
  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code)
        // 可以添加 toast 提示
      } catch (err) {
        console.error('複製失敗:', err)
      }
    }
  }

  // 下載代碼
  const handleDownload = () => {
    if (!code || !script) return

    const blob = new Blob([code], { type: 'text/x-python' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${script.name.replace(/[^a-zA-Z0-9_\-]/g, '_')}.py`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed right-64 bottom-48 z-10 p-2 rounded-l-lg transition-all hover:bg-surface-700"
        style={{
          background: 'rgba(30, 41, 59, 0.95)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRight: 'none',
        }}
        title="顯示程式碼預覽"
      >
        <svg className="w-5 h-5 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    )
  }

  return (
    <div 
      className="fixed right-64 top-14 bottom-48 w-80 flex flex-col z-10"
      style={{
        background: 'rgba(15, 23, 42, 0.98)',
        borderLeft: '1px solid rgba(71, 85, 105, 0.5)',
        boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* 標題列 */}
      <div 
        className="h-10 px-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          <span className="text-sm font-medium text-surface-300">Python 預覽</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!code}
            className="p-1.5 rounded hover:bg-surface-700 transition-colors disabled:opacity-50"
            title="複製代碼"
          >
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={handleDownload}
            disabled={!code}
            className="p-1.5 rounded hover:bg-surface-700 transition-colors disabled:opacity-50"
            title="下載檔案"
          >
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-surface-700 transition-colors"
            title="關閉"
          >
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 代碼內容 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm text-surface-500">生成中...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-surface-500">
              <svg className="w-8 h-8 mx-auto mb-2 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        ) : !script ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-surface-500">選擇一個腳本來預覽代碼</p>
          </div>
        ) : !code ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-surface-500">尚無內容</p>
          </div>
        ) : (
          <pre
            ref={codeRef}
            className="p-4 text-xs font-mono text-surface-300 whitespace-pre overflow-x-auto"
            style={{ tabSize: 4 }}
          >
            <code>{highlightPython(code)}</code>
          </pre>
        )}
      </div>

      {/* 底部狀態 */}
      <div 
        className="h-8 px-4 flex items-center justify-between text-xs"
        style={{ 
          borderTop: '1px solid rgba(71, 85, 105, 0.5)',
          background: 'rgba(30, 41, 59, 0.5)',
        }}
      >
        <span className="text-surface-500">Python 3</span>
        <span className="text-surface-500">
          {code ? `${code.split('\n').length} 行` : '-'}
        </span>
      </div>
    </div>
  )
}

// 簡單的 Python 語法高亮（使用純 React，不需要額外庫）
function highlightPython(code: string): React.ReactNode {
  const lines = code.split('\n')
  
  return lines.map((line, lineIndex) => {
    const highlighted = highlightLine(line)
    return (
      <span key={lineIndex}>
        {highlighted}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    )
  })
}

function highlightLine(line: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = line
  let key = 0

  // 註解
  const commentMatch = remaining.match(/^(.*?)(#.*)$/)
  if (commentMatch) {
    remaining = commentMatch[1]
    parts.push(
      <span key={key++} className="text-surface-500">{commentMatch[2]}</span>
    )
  }

  // 字串
  let result = remaining
  result = result.replace(/("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g, 
    (match) => `\x00STRING\x00${match}\x00/STRING\x00`
  )

  // 關鍵字
  const keywords = ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'finally', 
    'with', 'as', 'import', 'from', 'return', 'yield', 'raise', 'break', 'continue', 'pass', 
    'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'global', 'nonlocal']
  
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b(${kw})\\b`, 'g')
    result = result.replace(regex, `\x00KEYWORD\x00${kw}\x00/KEYWORD\x00`)
  })

  // 函數調用
  result = result.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g, 
    (match, name) => `\x00FUNC\x00${name}\x00/FUNC\x00(`
  )

  // 數字
  result = result.replace(/\b(\d+\.?\d*)\b/g, 
    (match) => `\x00NUM\x00${match}\x00/NUM\x00`
  )

  // 解析標記
  const tokens = result.split('\x00')
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token === 'STRING') {
      parts.unshift(<span key={key++} className="text-green-400">{tokens[++i]}</span>)
      i++ // skip /STRING
    } else if (token === 'KEYWORD') {
      parts.unshift(<span key={key++} className="text-purple-400">{tokens[++i]}</span>)
      i++ // skip /KEYWORD
    } else if (token === 'FUNC') {
      parts.unshift(<span key={key++} className="text-blue-400">{tokens[++i]}</span>)
      i++ // skip /FUNC
    } else if (token === 'NUM') {
      parts.unshift(<span key={key++} className="text-orange-400">{tokens[++i]}</span>)
      i++ // skip /NUM
    } else if (!token.startsWith('/')) {
      parts.unshift(<span key={key++}>{token}</span>)
    }
  }

  return parts.reverse()
}

export default CodePreviewPanel
