"""
桌面控制模組 - 封裝 PyAutoGUI

功能：
- 滑鼠控制：點擊、移動、拖曳、滾動
- 鍵盤控制：輸入文字、快捷鍵
- 螢幕資訊：取得滑鼠位置、螢幕尺寸

安全設定：
- FAILSAFE = True (滑鼠移到左上角可中斷)
- 每個動作之間預設 0.1 秒間隔
"""

import time
from typing import Tuple, List, Optional

import pyautogui
import pyperclip

from .config import settings


class DesktopController:
    """桌面控制器"""
    
    def __init__(self):
        # 安全設定
        pyautogui.FAILSAFE = settings.failsafe
        pyautogui.PAUSE = settings.action_delay
        
        # 預設設定
        self.type_interval = settings.type_interval
        self.move_duration = 0.25
        self.drag_duration = 0.5
    
    # ==================== 滑鼠控制 ====================
    
    def click(
        self,
        x: int,
        y: int,
        button: str = "left",
        clicks: int = 1,
        interval: float = 0.0,
    ) -> None:
        """
        點擊指定座標
        
        Args:
            x: X 座標
            y: Y 座標
            button: 滑鼠按鈕 ('left', 'middle', 'right')
            clicks: 點擊次數
            interval: 多次點擊之間的間隔
        """
        pyautogui.click(x, y, clicks=clicks, interval=interval, button=button)
    
    def double_click(self, x: int, y: int) -> None:
        """雙擊指定座標"""
        pyautogui.doubleClick(x, y)
    
    def right_click(self, x: int, y: int) -> None:
        """右鍵點擊指定座標"""
        pyautogui.rightClick(x, y)
    
    def triple_click(self, x: int, y: int) -> None:
        """三擊指定座標（通常用於選取整行）"""
        pyautogui.tripleClick(x, y)
    
    def move_to(
        self,
        x: int,
        y: int,
        duration: float = None,
    ) -> None:
        """
        移動滑鼠到指定座標
        
        Args:
            x: X 座標
            y: Y 座標
            duration: 移動時間（秒）
        """
        if duration is None:
            duration = self.move_duration
        pyautogui.moveTo(x, y, duration=duration)
    
    def move_relative(
        self,
        x_offset: int,
        y_offset: int,
        duration: float = None,
    ) -> None:
        """
        相對移動滑鼠
        
        Args:
            x_offset: X 偏移量
            y_offset: Y 偏移量
            duration: 移動時間（秒）
        """
        if duration is None:
            duration = self.move_duration
        pyautogui.moveRel(x_offset, y_offset, duration=duration)
    
    def drag_to(
        self,
        start_x: int,
        start_y: int,
        end_x: int,
        end_y: int,
        duration: float = None,
        button: str = "left",
    ) -> None:
        """
        從起點拖曳到終點
        
        Args:
            start_x: 起點 X 座標
            start_y: 起點 Y 座標
            end_x: 終點 X 座標
            end_y: 終點 Y 座標
            duration: 拖曳時間（秒）
            button: 滑鼠按鈕
        """
        if duration is None:
            duration = self.drag_duration
        
        # 先移動到起點
        pyautogui.moveTo(start_x, start_y)
        time.sleep(0.1)
        
        # 拖曳到終點
        pyautogui.drag(
            end_x - start_x,
            end_y - start_y,
            duration=duration,
            button=button,
        )
    
    def drag_relative(
        self,
        x_offset: int,
        y_offset: int,
        duration: float = None,
        button: str = "left",
    ) -> None:
        """
        相對拖曳
        
        Args:
            x_offset: X 偏移量
            y_offset: Y 偏移量
            duration: 拖曳時間（秒）
            button: 滑鼠按鈕
        """
        if duration is None:
            duration = self.drag_duration
        pyautogui.drag(x_offset, y_offset, duration=duration, button=button)
    
    def scroll(
        self,
        clicks: int,
        x: Optional[int] = None,
        y: Optional[int] = None,
    ) -> None:
        """
        滾動滑鼠滾輪
        
        Args:
            clicks: 滾動量（正數向上，負數向下）
            x: 滾動時的 X 座標（可選）
            y: 滾動時的 Y 座標（可選）
        """
        if x is not None and y is not None:
            pyautogui.scroll(clicks, x, y)
        else:
            pyautogui.scroll(clicks)
    
    def mouse_down(self, button: str = "left") -> None:
        """按下滑鼠按鈕"""
        pyautogui.mouseDown(button=button)
    
    def mouse_up(self, button: str = "left") -> None:
        """釋放滑鼠按鈕"""
        pyautogui.mouseUp(button=button)
    
    # ==================== 鍵盤控制 ====================
    
    def type_text(
        self,
        text: str,
        interval: float = None,
    ) -> None:
        """
        輸入英文文字
        
        注意：此方法不支援中文，中文請使用 type_text_chinese
        
        Args:
            text: 要輸入的文字
            interval: 每個字元之間的間隔
        """
        if interval is None:
            interval = self.type_interval
        pyautogui.typewrite(text, interval=interval)
    
    def type_text_chinese(self, text: str) -> None:
        """
        輸入文字（支援中文）
        
        使用剪貼簿方式輸入，適用於所有語言
        
        Args:
            text: 要輸入的文字
        """
        # 備份剪貼簿
        original_clipboard = ""
        try:
            original_clipboard = pyperclip.paste()
        except Exception:
            pass
        
        try:
            # 複製文字到剪貼簿
            pyperclip.copy(text)
            time.sleep(0.05)
            
            # 貼上
            pyautogui.hotkey("ctrl", "v")
            time.sleep(0.1)
        finally:
            # 還原剪貼簿
            try:
                pyperclip.copy(original_clipboard)
            except Exception:
                pass
    
    def press(self, key: str) -> None:
        """
        按下並釋放單一按鍵
        
        Args:
            key: 按鍵名稱（如 'enter', 'tab', 'escape'）
        """
        pyautogui.press(key)
    
    def hotkey(self, *keys: str) -> None:
        """
        執行組合鍵
        
        Args:
            keys: 按鍵序列（如 'ctrl', 'c'）
        
        Example:
            hotkey('ctrl', 'c')  # 複製
            hotkey('ctrl', 'shift', 's')  # 另存新檔
        """
        pyautogui.hotkey(*keys)
    
    def key_down(self, key: str) -> None:
        """按住按鍵"""
        pyautogui.keyDown(key)
    
    def key_up(self, key: str) -> None:
        """釋放按鍵"""
        pyautogui.keyUp(key)
    
    def write(self, text: str) -> None:
        """
        智能輸入文字
        
        統一使用剪貼簿方式輸入，避免被中文輸入法攔截
        
        Args:
            text: 要輸入的文字
        """
        # 統一使用剪貼簿方式，避免輸入法問題
        self.type_text_chinese(text)
    
    # ==================== 資訊取得 ====================
    
    def get_mouse_position(self) -> Tuple[int, int]:
        """取得目前滑鼠位置"""
        pos = pyautogui.position()
        return (pos.x, pos.y)
    
    def get_screen_size(self) -> Tuple[int, int]:
        """取得螢幕尺寸"""
        size = pyautogui.size()
        return (size.width, size.height)
    
    # ==================== 工具方法 ====================
    
    def wait(self, seconds: float) -> None:
        """等待指定秒數"""
        time.sleep(seconds)
    
    def alert(self, text: str, title: str = "RPA Builder") -> None:
        """顯示提示對話框"""
        pyautogui.alert(text, title)
    
    def confirm(self, text: str, title: str = "RPA Builder") -> bool:
        """
        顯示確認對話框
        
        Returns:
            True 表示確認，False 表示取消
        """
        result = pyautogui.confirm(text, title)
        return result == "OK"
    
    def prompt(
        self,
        text: str,
        title: str = "RPA Builder",
        default: str = "",
    ) -> Optional[str]:
        """
        顯示輸入對話框
        
        Returns:
            輸入的文字，取消則返回 None
        """
        return pyautogui.prompt(text, title, default)
    
    # ==================== 進階功能 ====================
    
    def screenshot(self, region: Tuple[int, int, int, int] = None):
        """
        擷取螢幕截圖
        
        Args:
            region: 擷取區域 (x, y, width, height)
            
        Returns:
            PIL Image 物件
        """
        if region:
            return pyautogui.screenshot(region=region)
        return pyautogui.screenshot()
    
    def locate_on_screen(
        self,
        image_path: str,
        confidence: float = 0.8,
    ) -> Optional[Tuple[int, int, int, int]]:
        """
        在螢幕上找到圖片位置
        
        注意：建議使用 ImageFinder 模組的 find_on_screen 方法，功能更完整
        
        Args:
            image_path: 圖片路徑
            confidence: 匹配信心度
            
        Returns:
            (left, top, width, height) 或 None
        """
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                return (location.left, location.top, location.width, location.height)
        except Exception:
            pass
        return None


# 全域實例
desktop = DesktopController()
