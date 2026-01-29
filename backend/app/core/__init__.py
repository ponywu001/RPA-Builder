"""
核心模組
包含圖像辨識、桌面控制、腳本執行引擎等核心功能
"""

from .config import settings
from .image_finder import ImageFinder
from .desktop import DesktopController
from .engine import ScriptEngine
from .blocks import BlockRegistry

__all__ = [
    "settings",
    "ImageFinder",
    "DesktopController",
    "ScriptEngine",
    "BlockRegistry",
]
