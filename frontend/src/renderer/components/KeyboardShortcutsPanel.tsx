/**
 * 快捷鍵提示面板
 */

import React from 'react'

interface KeyboardShortcutsPanelProps {
  isVisible: boolean
  onClose: () => void
}

const shortcuts = [
  { category: '編輯', items: [
    { keys: ['Ctrl', 'Z'], description: '復原' },
    { keys: ['Ctrl', 'Y'], description: '重做' },
    { keys: ['Ctrl', 'C'], description: '複製積木' },
    { keys: ['Ctrl', 'V'], description: '貼上積木' },
    { keys: ['Delete'], description: '刪除選中積木' },
    { keys: ['Ctrl', 'F'], description: '搜尋積木' },
  ]},
  { category: '選取', items: [
    { keys: ['Shift', '拖曳'], description: '框選多個積木' },
    { keys: ['Escape'], description: '取消選取 / 關閉面板' },
  ]},
  { category: '執行', items: [
    { keys: ['F5'], description: '執行腳本' },
    { keys: ['Shift', 'F5'], description: '停止執行' },
    { keys: ['F6'], description: '暫停/繼續' },
  ]},
  { category: '視圖', items: [
    { keys: ['Ctrl', '滾輪'], description: '縮放' },
    { keys: ['滑鼠中鍵'], description: '平移畫布' },
  ]},
  { category: '其他', items: [
    { keys: ['Ctrl', 'S'], description: '儲存（自動儲存）' },
    { keys: ['F1'], description: '顯示快捷鍵' },
  ]},
]

const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div 
        className="w-[500px] max-h-[80vh] rounded-xl overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.98)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 標題 */}
        <div 
          className="px-6 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(71, 85, 105, 0.5)' }}
        >
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            </svg>
            <h2 className="text-lg font-semibold text-surface-100">快捷鍵</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-700 transition-colors"
          >
            <svg className="w-4 h-4 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 內容 */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 80px)' }}>
          {shortcuts.map((section, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-medium text-primary-400 mb-3">{section.category}</h3>
              <div className="space-y-2">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-surface-300">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIdx) => (
                        <React.Fragment key={keyIdx}>
                          {keyIdx > 0 && <span className="text-surface-600 text-xs">+</span>}
                          <kbd 
                            className="px-2 py-1 text-xs rounded"
                            style={{
                              background: 'rgba(30, 41, 59, 0.8)',
                              border: '1px solid rgba(71, 85, 105, 0.5)',
                              color: '#e2e8f0',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            }}
                          >
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default KeyboardShortcutsPanel
