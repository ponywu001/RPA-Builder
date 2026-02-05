"""
動作錄製器 - 錄製滑鼠和鍵盤操作

功能：
- 錄製滑鼠點擊、移動、拖曳
- 錄製鍵盤輸入
- 自動生成 Block 腳本
- 智能截圖（點擊時自動截取目標區域）
"""

import asyncio
import time
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
from threading import Thread

try:
    from pynput import mouse, keyboard
    PYNPUT_AVAILABLE = True
except ImportError:
    PYNPUT_AVAILABLE = False

from .image_finder import image_finder
from .config import settings


class ActionType(str, Enum):
    """動作類型"""
    CLICK = "click"
    DOUBLE_CLICK = "double_click"
    RIGHT_CLICK = "right_click"
    DRAG = "drag"
    SCROLL = "scroll"
    KEY_PRESS = "key_press"
    TYPE_TEXT = "type_text"
    HOTKEY = "hotkey"
    WAIT = "wait"


@dataclass
class RecordedAction:
    """錄製的動作"""
    action_id: str
    action_type: ActionType
    timestamp: float
    params: Dict[str, Any] = field(default_factory=dict)
    screenshot_path: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "action_id": self.action_id,
            "action_type": self.action_type.value,
            "timestamp": self.timestamp,
            "params": self.params,
            "screenshot_path": self.screenshot_path,
        }
    
    def to_block(self) -> dict:
        """轉換為 Block 格式"""
        block = {
            "id": self._get_block_id(),
            "instance_id": self.action_id,
            "params": self._get_block_params(),
            "children": [],
            "else_children": [],
        }
        return block
    
    def _get_block_id(self) -> str:
        """取得對應的 Block ID"""
        mapping = {
            ActionType.CLICK: "click_position" if not self.screenshot_path else "click_image",
            ActionType.DOUBLE_CLICK: "double_click_image",
            ActionType.RIGHT_CLICK: "right_click_image",
            ActionType.SCROLL: "scroll",
            ActionType.KEY_PRESS: "hotkey",
            ActionType.TYPE_TEXT: "type_text",
            ActionType.HOTKEY: "hotkey",
            ActionType.WAIT: "wait",
        }
        return mapping.get(self.action_type, "log")
    
    def _get_block_params(self) -> dict:
        """取得 Block 參數"""
        if self.action_type == ActionType.CLICK:
            if self.screenshot_path:
                return {
                    "image_path": self.screenshot_path,
                    "confidence": 0.8,
                    "timeout": 30,
                    "offset_x": 0,
                    "offset_y": 0,
                }
            else:
                return {
                    "x": self.params.get("x", 0),
                    "y": self.params.get("y", 0),
                    "button": self.params.get("button", "left"),
                }
        elif self.action_type == ActionType.SCROLL:
            return {
                "direction": "up" if self.params.get("dy", 0) > 0 else "down",
                "amount": abs(self.params.get("dy", 3)),
            }
        elif self.action_type == ActionType.TYPE_TEXT:
            return {
                "text": self.params.get("text", ""),
            }
        elif self.action_type in (ActionType.KEY_PRESS, ActionType.HOTKEY):
            return {
                "keys": self.params.get("keys", ""),
            }
        elif self.action_type == ActionType.WAIT:
            return {
                "seconds": self.params.get("seconds", 1),
            }
        return self.params


class ActionRecorder:
    """動作錄製器"""
    
    _instance: Optional["ActionRecorder"] = None
    
    def __new__(cls):
        """單例模式"""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self._initialized = True
        self._recording = False
        self._actions: List[RecordedAction] = []
        self._start_time: float = 0
        self._last_action_time: float = 0
        self._auto_screenshot = True
        self._screenshot_region_size = 100  # 截圖區域大小
        self._min_wait_threshold = 0.5  # 最小等待時間閾值
        
        # 事件監聽器
        self._mouse_listener = None
        self._keyboard_listener = None
        
        # 文字輸入緩衝
        self._text_buffer = ""
        self._text_buffer_start_time = 0
        
        # 拖曳狀態
        self._drag_start = None
        
        # 回調
        self._on_action_recorded: Optional[Callable] = None
    
    @property
    def is_recording(self) -> bool:
        return self._recording
    
    @property
    def actions(self) -> List[RecordedAction]:
        return self._actions.copy()
    
    def set_on_action_recorded(self, callback: Callable) -> None:
        """設置動作錄製回調"""
        self._on_action_recorded = callback
    
    def start_recording(self, auto_screenshot: bool = True) -> bool:
        """開始錄製"""
        if not PYNPUT_AVAILABLE:
            raise RuntimeError("錄製功能需要安裝 pynput: pip install pynput")
        
        if self._recording:
            return False
        
        self._recording = True
        self._actions = []
        self._start_time = time.time()
        self._last_action_time = self._start_time
        self._auto_screenshot = auto_screenshot
        self._text_buffer = ""
        self._drag_start = None
        
        # 啟動監聽器
        self._mouse_listener = mouse.Listener(
            on_click=self._on_mouse_click,
            on_scroll=self._on_mouse_scroll,
        )
        self._keyboard_listener = keyboard.Listener(
            on_press=self._on_key_press,
            on_release=self._on_key_release,
        )
        
        self._mouse_listener.start()
        self._keyboard_listener.start()
        
        return True
    
    def stop_recording(self) -> List[RecordedAction]:
        """停止錄製"""
        if not self._recording:
            return []
        
        # 刷新文字緩衝
        self._flush_text_buffer()
        
        self._recording = False
        
        # 停止監聽器
        if self._mouse_listener:
            self._mouse_listener.stop()
            self._mouse_listener = None
        
        if self._keyboard_listener:
            self._keyboard_listener.stop()
            self._keyboard_listener = None
        
        return self._actions.copy()
    
    def pause_recording(self) -> None:
        """暫停錄製"""
        # 實際上是暫時忽略事件，保持監聽器運行
        pass
    
    def resume_recording(self) -> None:
        """繼續錄製"""
        pass
    
    def clear_recording(self) -> None:
        """清除錄製"""
        self._actions = []
    
    def get_blocks(self) -> List[dict]:
        """取得生成的 Blocks"""
        return [action.to_block() for action in self._actions]
    
    def _add_wait_if_needed(self) -> None:
        """如果需要，添加等待動作"""
        current_time = time.time()
        wait_time = current_time - self._last_action_time
        
        if wait_time >= self._min_wait_threshold:
            action = RecordedAction(
                action_id=str(uuid.uuid4()),
                action_type=ActionType.WAIT,
                timestamp=current_time,
                params={"seconds": round(wait_time, 1)},
            )
            self._actions.append(action)
    
    def _record_action(self, action: RecordedAction) -> None:
        """記錄動作"""
        self._add_wait_if_needed()
        self._actions.append(action)
        self._last_action_time = time.time()
        
        if self._on_action_recorded:
            self._on_action_recorded(action)
    
    def _capture_click_region(self, x: int, y: int) -> Optional[str]:
        """擷取點擊區域的截圖"""
        if not self._auto_screenshot:
            return None
        
        try:
            # 計算截圖區域
            half_size = self._screenshot_region_size // 2
            region_x = max(0, x - half_size)
            region_y = max(0, y - half_size)
            
            # 擷取區域
            screenshot_bytes = image_finder.capture_region(
                region_x, region_y,
                self._screenshot_region_size,
                self._screenshot_region_size,
            )
            
            # 儲存截圖
            filename = f"recorded_{int(time.time() * 1000)}.png"
            filepath = settings.images_dir / filename
            filepath.write_bytes(screenshot_bytes)
            
            return filename
        except Exception as e:
            print(f"[Recorder] 截圖失敗: {e}")
            return None
    
    def _flush_text_buffer(self) -> None:
        """刷新文字緩衝"""
        if self._text_buffer:
            action = RecordedAction(
                action_id=str(uuid.uuid4()),
                action_type=ActionType.TYPE_TEXT,
                timestamp=self._text_buffer_start_time,
                params={"text": self._text_buffer},
            )
            self._record_action(action)
            self._text_buffer = ""
    
    # ==================== 事件處理 ====================
    
    def _on_mouse_click(self, x: int, y: int, button, pressed: bool) -> None:
        """滑鼠點擊事件"""
        if not self._recording or not pressed:
            return
        
        # 刷新文字緩衝
        self._flush_text_buffer()
        
        # 判斷點擊類型
        button_name = button.name if hasattr(button, 'name') else str(button)
        
        if button_name == 'left':
            action_type = ActionType.CLICK
        elif button_name == 'right':
            action_type = ActionType.RIGHT_CLICK
        else:
            action_type = ActionType.CLICK
        
        # 擷取截圖
        screenshot_path = self._capture_click_region(x, y)
        
        action = RecordedAction(
            action_id=str(uuid.uuid4()),
            action_type=action_type,
            timestamp=time.time(),
            params={"x": x, "y": y, "button": button_name},
            screenshot_path=screenshot_path,
        )
        
        self._record_action(action)
    
    def _on_mouse_scroll(self, x: int, y: int, dx: int, dy: int) -> None:
        """滑鼠滾輪事件"""
        if not self._recording:
            return
        
        # 刷新文字緩衝
        self._flush_text_buffer()
        
        action = RecordedAction(
            action_id=str(uuid.uuid4()),
            action_type=ActionType.SCROLL,
            timestamp=time.time(),
            params={"x": x, "y": y, "dx": dx, "dy": dy},
        )
        
        self._record_action(action)
    
    def _on_key_press(self, key) -> None:
        """鍵盤按下事件"""
        if not self._recording:
            return
        
        try:
            # 一般字元
            if hasattr(key, 'char') and key.char:
                if not self._text_buffer:
                    self._text_buffer_start_time = time.time()
                self._text_buffer += key.char
            else:
                # 特殊按鍵
                key_name = key.name if hasattr(key, 'name') else str(key)
                
                # 檢查是否是修飾鍵
                if key_name in ('ctrl', 'ctrl_l', 'ctrl_r', 
                               'alt', 'alt_l', 'alt_r',
                               'shift', 'shift_l', 'shift_r',
                               'cmd', 'cmd_l', 'cmd_r'):
                    return  # 修飾鍵單獨按不記錄
                
                # 刷新文字緩衝
                self._flush_text_buffer()
                
                # 記錄特殊按鍵
                action = RecordedAction(
                    action_id=str(uuid.uuid4()),
                    action_type=ActionType.KEY_PRESS,
                    timestamp=time.time(),
                    params={"keys": key_name},
                )
                
                self._record_action(action)
                
        except Exception as e:
            print(f"[Recorder] 鍵盤事件處理錯誤: {e}")
    
    def _on_key_release(self, key) -> None:
        """鍵盤釋放事件"""
        pass  # 目前不處理


# 全域實例
recorder = ActionRecorder()
