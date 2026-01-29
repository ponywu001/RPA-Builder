"""
圖像辨識模組 - 使用 OpenCV 進行模板匹配

功能：
- find_on_screen: 在螢幕上找到圖片
- find_all_on_screen: 找到所有匹配的圖片
- wait_for_image: 等待圖片出現
- wait_until_disappear: 等待圖片消失
- capture_region: 擷取指定區域
- capture_screen: 擷取全螢幕
"""

import io
import time
import asyncio
from pathlib import Path
from typing import Optional, List, Tuple
from dataclasses import dataclass

import cv2
import numpy as np
from PIL import Image
import mss

from .config import settings


@dataclass
class Position:
    """位置資訊"""
    x: int           # 中心點 X
    y: int           # 中心點 Y
    width: int       # 匹配區域寬度
    height: int      # 匹配區域高度
    confidence: float  # 匹配信心度 0-1
    
    def to_dict(self) -> dict:
        return {
            "x": self.x,
            "y": self.y,
            "width": self.width,
            "height": self.height,
            "confidence": self.confidence,
        }
    
    @property
    def center(self) -> Tuple[int, int]:
        """取得中心點座標"""
        return (self.x, self.y)
    
    @property
    def top_left(self) -> Tuple[int, int]:
        """取得左上角座標"""
        return (self.x - self.width // 2, self.y - self.height // 2)
    
    @property
    def bottom_right(self) -> Tuple[int, int]:
        """取得右下角座標"""
        return (self.x + self.width // 2, self.y + self.height // 2)


class ImageFinder:
    """圖像辨識器"""
    
    def __init__(self):
        self.sct = mss.mss()
        self._template_cache: dict[str, np.ndarray] = {}
    
    def _load_template(self, template_path: str) -> np.ndarray:
        """載入模板圖片（帶快取）"""
        path = Path(template_path)
        
        # 如果是相對路徑，從 images 目錄載入
        if not path.is_absolute():
            path = settings.images_dir / path
        
        path_str = str(path)
        
        # 檢查快取
        if path_str in self._template_cache:
            return self._template_cache[path_str]
        
        # 載入圖片
        if not path.exists():
            raise FileNotFoundError(f"模板圖片不存在: {path}")
        
        template = cv2.imread(str(path), cv2.IMREAD_COLOR)
        if template is None:
            raise ValueError(f"無法載入圖片: {path}")
        
        self._template_cache[path_str] = template
        return template
    
    def clear_cache(self):
        """清除模板快取"""
        self._template_cache.clear()
    
    def invalidate_cache(self, template_path: str):
        """使特定模板快取失效"""
        path = Path(template_path)
        if not path.is_absolute():
            path = settings.images_dir / path
        path_str = str(path)
        self._template_cache.pop(path_str, None)
    
    def capture_screen(self, monitor: int = 0) -> bytes:
        """
        擷取全螢幕
        
        Args:
            monitor: 螢幕編號，0 表示所有螢幕
            
        Returns:
            PNG 格式的圖片 bytes
        """
        with mss.mss() as sct:
            if monitor == 0:
                # 擷取所有螢幕
                screenshot = sct.grab(sct.monitors[0])
            else:
                # 擷取指定螢幕
                if monitor >= len(sct.monitors):
                    raise ValueError(f"螢幕 {monitor} 不存在")
                screenshot = sct.grab(sct.monitors[monitor])
            
            # 轉換為 PNG bytes
            img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            return buffer.getvalue()
    
    def capture_region(self, x: int, y: int, width: int, height: int) -> bytes:
        """
        擷取指定區域
        
        Args:
            x: 左上角 X 座標
            y: 左上角 Y 座標
            width: 寬度
            height: 高度
            
        Returns:
            PNG 格式的圖片 bytes
        """
        region = {"left": x, "top": y, "width": width, "height": height}
        
        with mss.mss() as sct:
            screenshot = sct.grab(region)
            img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")
            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            return buffer.getvalue()
    
    def _get_screen_image(self, monitor: int = 0) -> Tuple[np.ndarray, int, int]:
        """
        取得螢幕畫面作為 OpenCV 格式
        
        Args:
            monitor: 0=所有螢幕, 1=主螢幕, 2=第二螢幕, ...
            
        Returns:
            (圖片, x_offset, y_offset) - 圖片及其左上角的全域座標偏移
        """
        with mss.mss() as sct:
            if monitor == 0:
                # monitors[0] 是所有螢幕的虛擬組合區域
                mon = sct.monitors[0]
            else:
                if monitor >= len(sct.monitors):
                    mon = sct.monitors[0]
                else:
                    mon = sct.monitors[monitor]
            
            screenshot = sct.grab(mon)
            
            # 轉換為 numpy array (BGR 格式)
            img = np.array(screenshot)
            # BGRA -> BGR
            return cv2.cvtColor(img, cv2.COLOR_BGRA2BGR), mon["left"], mon["top"]
    
    def find_on_screen(
        self,
        template_path: str,
        confidence: float = None,
        region: Tuple[int, int, int, int] = None,
        grayscale: bool = False,
    ) -> Optional[Position]:
        """
        在螢幕上找到圖片（支援多螢幕）
        
        Args:
            template_path: 模板圖片路徑
            confidence: 匹配信心度閾值 (0-1)
            region: 搜尋區域 (x, y, width, height)，None 表示所有螢幕
            grayscale: 是否使用灰階匹配（更快但可能不精確）
            
        Returns:
            Position 物件，找不到則返回 None
        """
        if confidence is None:
            confidence = settings.default_confidence
        
        # 載入模板
        template = self._load_template(template_path)
        template_h, template_w = template.shape[:2]
        
        # 取得螢幕畫面（monitor=0 表示所有螢幕）
        screen, screen_left, screen_top = self._get_screen_image(monitor=0)
        
        # 處理搜尋區域
        if region:
            x, y, w, h = region
            # 調整為相對於截圖的座標
            rel_x = x - screen_left
            rel_y = y - screen_top
            screen = screen[rel_y:rel_y+h, rel_x:rel_x+w]
            offset_x, offset_y = x, y
        else:
            offset_x, offset_y = screen_left, screen_top
        
        # 灰階處理
        if grayscale:
            screen = cv2.cvtColor(screen, cv2.COLOR_BGR2GRAY)
            template = cv2.cvtColor(template, cv2.COLOR_BGR2GRAY)
        
        # 模板匹配
        result = cv2.matchTemplate(screen, template, cv2.TM_CCOEFF_NORMED)
        
        # 找最佳匹配
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(result)
        
        if max_val >= confidence:
            # 計算中心點（使用全域座標）
            center_x = max_loc[0] + template_w // 2 + offset_x
            center_y = max_loc[1] + template_h // 2 + offset_y
            
            return Position(
                x=center_x,
                y=center_y,
                width=template_w,
                height=template_h,
                confidence=float(max_val),
            )
        
        return None
    
    def find_all_on_screen(
        self,
        template_path: str,
        confidence: float = None,
        region: Tuple[int, int, int, int] = None,
        max_results: int = 100,
    ) -> List[Position]:
        """
        找到螢幕上所有匹配的圖片（支援多螢幕）
        
        Args:
            template_path: 模板圖片路徑
            confidence: 匹配信心度閾值 (0-1)
            region: 搜尋區域 (x, y, width, height)
            max_results: 最大結果數量
            
        Returns:
            Position 列表
        """
        if confidence is None:
            confidence = settings.default_confidence
        
        # 載入模板
        template = self._load_template(template_path)
        template_h, template_w = template.shape[:2]
        
        # 取得螢幕畫面（monitor=0 表示所有螢幕）
        screen, screen_left, screen_top = self._get_screen_image(monitor=0)
        
        # 處理搜尋區域
        if region:
            x, y, w, h = region
            rel_x = x - screen_left
            rel_y = y - screen_top
            screen = screen[rel_y:rel_y+h, rel_x:rel_x+w]
            offset_x, offset_y = x, y
        else:
            offset_x, offset_y = screen_left, screen_top
        
        # 模板匹配
        result = cv2.matchTemplate(screen, template, cv2.TM_CCOEFF_NORMED)
        
        # 找所有匹配位置
        locations = np.where(result >= confidence)
        positions = []
        
        # 使用非極大值抑制避免重複
        for pt in zip(*locations[::-1]):
            center_x = pt[0] + template_w // 2 + offset_x
            center_y = pt[1] + template_h // 2 + offset_y
            conf = float(result[pt[1], pt[0]])
            
            # 檢查是否與已有位置太接近
            is_duplicate = False
            for pos in positions:
                if abs(pos.x - center_x) < template_w // 2 and abs(pos.y - center_y) < template_h // 2:
                    is_duplicate = True
                    # 保留信心度更高的
                    if conf > pos.confidence:
                        pos.x = center_x
                        pos.y = center_y
                        pos.confidence = conf
                    break
            
            if not is_duplicate:
                positions.append(Position(
                    x=center_x,
                    y=center_y,
                    width=template_w,
                    height=template_h,
                    confidence=conf,
                ))
                
                if len(positions) >= max_results:
                    break
        
        # 按信心度排序
        positions.sort(key=lambda p: p.confidence, reverse=True)
        return positions
    
    async def wait_for_image(
        self,
        template_path: str,
        timeout: float = None,
        interval: float = None,
        confidence: float = None,
        cancel_check: callable = None,
    ) -> Optional[Position]:
        """
        等待圖片出現
        
        Args:
            template_path: 模板圖片路徑
            timeout: 超時時間（秒）
            interval: 檢查間隔（秒）
            confidence: 匹配信心度閾值
            cancel_check: 可選的取消檢查函數，返回 True 表示應該取消
            
        Returns:
            Position 物件，超時或取消則返回 None
        """
        if timeout is None:
            timeout = settings.default_timeout
        if interval is None:
            interval = settings.default_interval
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # 檢查是否應該取消
            if cancel_check and cancel_check():
                return None
            
            position = self.find_on_screen(template_path, confidence)
            if position:
                return position
            await asyncio.sleep(interval)
        
        return None
    
    async def wait_until_disappear(
        self,
        template_path: str,
        timeout: float = None,
        interval: float = None,
        confidence: float = None,
        cancel_check: callable = None,
    ) -> bool:
        """
        等待圖片消失
        
        Args:
            template_path: 模板圖片路徑
            timeout: 超時時間（秒）
            interval: 檢查間隔（秒）
            confidence: 匹配信心度閾值
            cancel_check: 可選的取消檢查函數，返回 True 表示應該取消
            
        Returns:
            True 表示圖片已消失，False 表示超時或取消
        """
        if timeout is None:
            timeout = settings.default_timeout
        if interval is None:
            interval = settings.default_interval
        
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            # 檢查是否應該取消
            if cancel_check and cancel_check():
                return False
            
            position = self.find_on_screen(template_path, confidence)
            if position is None:
                return True
            await asyncio.sleep(interval)
        
        return False
    
    def get_screen_size(self) -> Tuple[int, int]:
        """取得所有螢幕的總尺寸（虛擬桌面大小）"""
        with mss.mss() as sct:
            monitor = sct.monitors[0]  # 所有螢幕的組合
            return (monitor["width"], monitor["height"])
    
    def get_virtual_screen_bounds(self) -> dict:
        """取得虛擬螢幕的邊界（所有螢幕組合）"""
        with mss.mss() as sct:
            monitor = sct.monitors[0]
            return {
                "left": monitor["left"],
                "top": monitor["top"],
                "width": monitor["width"],
                "height": monitor["height"],
            }
    
    def get_monitors(self) -> List[dict]:
        """取得所有螢幕資訊"""
        with mss.mss() as sct:
            monitors = []
            for i, m in enumerate(sct.monitors[1:], 1):  # 跳過第一個（組合螢幕）
                monitors.append({
                    "index": i,
                    "left": m["left"],
                    "top": m["top"],
                    "width": m["width"],
                    "height": m["height"],
                    "is_primary": m["left"] == 0 and m["top"] == 0,
                })
            return monitors


# 全域實例
image_finder = ImageFinder()
