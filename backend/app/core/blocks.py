"""
Block 定義與處理模組

定義所有可用的 Block 類型及其執行邏輯
"""

import asyncio
import subprocess
import httpx
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Callable, Type
from enum import Enum

from .image_finder import image_finder, Position
from .desktop import desktop
from .config import settings


class BlockCategory(str, Enum):
    """Block 類別"""
    ACTION = "action"      # 動作類
    CONTROL = "control"    # 控制類
    VARIABLE = "variable"  # 變數類
    ADVANCED = "advanced"  # 進階類


@dataclass
class BlockDefinition:
    """Block 定義"""
    id: str                          # Block ID
    name: str                        # 顯示名稱
    category: BlockCategory          # 類別
    description: str                 # 說明
    params: Dict[str, Any]           # 參數定義
    has_children: bool = False       # 是否有子 blocks
    has_else: bool = False           # 是否有 else 分支
    color: str = "#5b80a5"           # 顏色


@dataclass
class BlockInstance:
    """Block 實例"""
    id: str                          # Block 類型 ID
    instance_id: str                 # 唯一實例 ID
    params: Dict[str, Any]           # 參數值
    children: List["BlockInstance"] = field(default_factory=list)
    else_children: List["BlockInstance"] = field(default_factory=list)
    
    @classmethod
    def from_dict(cls, data: dict) -> "BlockInstance":
        """從字典建立實例"""
        children = [cls.from_dict(c) for c in data.get("children", [])]
        else_children = [cls.from_dict(c) for c in data.get("else_children", [])]
        return cls(
            id=data["id"],
            instance_id=data["instance_id"],
            params=data.get("params", {}),
            children=children,
            else_children=else_children,
        )
    
    def to_dict(self) -> dict:
        """轉換為字典"""
        return {
            "id": self.id,
            "instance_id": self.instance_id,
            "params": self.params,
            "children": [c.to_dict() for c in self.children],
            "else_children": [c.to_dict() for c in self.else_children],
        }


class ExecutionContext:
    """執行上下文"""
    
    def __init__(self):
        self.variables: Dict[str, Any] = {}
        self.should_stop: bool = False
        self.should_pause: bool = False
        self.should_break: bool = False
        self.should_continue: bool = False
        self.logs: List[Dict[str, Any]] = []
        self.current_step: int = 0
        self.total_steps: int = 0
    
    def set_variable(self, name: str, value: Any) -> None:
        """設定變數"""
        self.variables[name] = value
    
    def get_variable(self, name: str, default: Any = None) -> Any:
        """取得變數"""
        return self.variables.get(name, default)
    
    def log(self, message: str, level: str = "info") -> None:
        """記錄日誌"""
        import datetime
        self.logs.append({
            "timestamp": datetime.datetime.now().isoformat(),
            "level": level,
            "message": message,
        })
    
    def resolve_value(self, value: Any) -> Any:
        """解析值（處理變數引用）"""
        if isinstance(value, str) and value.startswith("${") and value.endswith("}"):
            var_name = value[2:-1]
            return self.get_variable(var_name, value)
        return value


class BlockExecutor(ABC):
    """Block 執行器基類"""
    
    @abstractmethod
    async def execute(
        self,
        block: BlockInstance,
        context: ExecutionContext,
    ) -> Any:
        """執行 Block"""
        pass


# ==================== 動作類 Blocks ====================

class ClickImageExecutor(BlockExecutor):
    """點擊圖片"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        offset_x = block.params.get("offset_x", 0)
        offset_y = block.params.get("offset_y", 0)
        
        context.log(f"尋找圖片: {image_path} (信心度: {confidence})")
        position = await image_finder.wait_for_image(image_path, timeout=timeout, confidence=confidence)
        
        if position:
            click_x = position.x + offset_x
            click_y = position.y + offset_y
            context.log(f"找到圖片 (匹配度: {position.confidence:.2%})，點擊座標 ({click_x}, {click_y})")
            desktop.click(click_x, click_y)
            return position.to_dict()
        else:
            raise TimeoutError(f"找不到圖片: {image_path}")


class ClickPositionExecutor(BlockExecutor):
    """點擊座標"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        x = int(context.resolve_value(block.params.get("x", 0)))
        y = int(context.resolve_value(block.params.get("y", 0)))
        button = block.params.get("button", "left")
        
        context.log(f"點擊座標 ({x}, {y}), 按鈕: {button}")
        desktop.click(x, y, button=button)
        return {"x": x, "y": y}


class DoubleClickImageExecutor(BlockExecutor):
    """雙擊圖片"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"尋找圖片並雙擊: {image_path} (信心度: {confidence})")
        position = await image_finder.wait_for_image(image_path, timeout=timeout, confidence=confidence)
        
        if position:
            context.log(f"找到圖片 (匹配度: {position.confidence:.2%})，雙擊座標 ({position.x}, {position.y})")
            desktop.double_click(position.x, position.y)
            return position.to_dict()
        else:
            raise TimeoutError(f"找不到圖片: {image_path}")


class RightClickImageExecutor(BlockExecutor):
    """右鍵點擊圖片"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"尋找圖片並右鍵點擊: {image_path} (信心度: {confidence})")
        position = await image_finder.wait_for_image(image_path, timeout=timeout, confidence=confidence)
        
        if position:
            context.log(f"找到圖片 (匹配度: {position.confidence:.2%})，右鍵點擊座標 ({position.x}, {position.y})")
            desktop.right_click(position.x, position.y)
            return position.to_dict()
        else:
            raise TimeoutError(f"找不到圖片: {image_path}")


class TypeTextExecutor(BlockExecutor):
    """輸入文字"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        text = str(context.resolve_value(block.params.get("text", "")))
        interval = block.params.get("interval", 0.05)
        
        context.log(f"輸入文字: {text[:50]}{'...' if len(text) > 50 else ''}")
        desktop.write(text)
        return {"text": text}


class HotkeyExecutor(BlockExecutor):
    """快捷鍵"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        keys = block.params.get("keys", [])
        if isinstance(keys, str):
            keys = [k.strip() for k in keys.split("+")]
        
        context.log(f"執行快捷鍵: {'+'.join(keys)}")
        desktop.hotkey(*keys)
        return {"keys": keys}


class ScrollExecutor(BlockExecutor):
    """滾動"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        direction = block.params.get("direction", "down")
        amount = int(block.params.get("amount", 3))
        x = block.params.get("x")
        y = block.params.get("y")
        
        # 方向處理
        clicks = amount if direction == "up" else -amount
        
        context.log(f"滾動 {direction} {amount} 格")
        
        if x is not None and y is not None:
            desktop.scroll(clicks, int(x), int(y))
        else:
            desktop.scroll(clicks)
        
        return {"direction": direction, "amount": amount}


class DragDropExecutor(BlockExecutor):
    """拖放"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        from_image = context.resolve_value(block.params.get("from_image"))
        to_image = context.resolve_value(block.params.get("to_image"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"拖放: {from_image} -> {to_image} (信心度: {confidence})")
        
        # 找到起點
        from_pos = await image_finder.wait_for_image(from_image, timeout=timeout, confidence=confidence)
        if not from_pos:
            raise TimeoutError(f"找不到起點圖片: {from_image}")
        
        # 找到終點
        to_pos = await image_finder.wait_for_image(to_image, timeout=timeout, confidence=confidence)
        if not to_pos:
            raise TimeoutError(f"找不到終點圖片: {to_image}")
        
        context.log(f"從 ({from_pos.x}, {from_pos.y}) 拖到 ({to_pos.x}, {to_pos.y})")
        desktop.drag_to(from_pos.x, from_pos.y, to_pos.x, to_pos.y)
        
        return {
            "from": from_pos.to_dict(),
            "to": to_pos.to_dict(),
        }


class WaitExecutor(BlockExecutor):
    """等待"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        seconds = float(block.params.get("seconds", 1))
        
        context.log(f"等待 {seconds} 秒")
        await asyncio.sleep(seconds)
        return {"seconds": seconds}


class WaitImageExecutor(BlockExecutor):
    """等待圖片出現"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"等待圖片出現: {image_path} (信心度: {confidence})")
        position = await image_finder.wait_for_image(image_path, timeout=timeout, confidence=confidence)
        
        if position:
            context.log(f"圖片已出現於 ({position.x}, {position.y})，匹配度: {position.confidence:.2%}")
            return position.to_dict()
        else:
            raise TimeoutError(f"等待圖片超時: {image_path}")


class WaitImageGoneExecutor(BlockExecutor):
    """等待圖片消失"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"等待圖片消失: {image_path} (信心度: {confidence})")
        result = await image_finder.wait_until_disappear(image_path, timeout=timeout, confidence=confidence)
        
        if result:
            context.log("圖片已消失")
            return {"disappeared": True}
        else:
            raise TimeoutError(f"等待圖片消失超時: {image_path}")


# ==================== 控制類 Blocks ====================

class IfImageExistsExecutor(BlockExecutor):
    """如果圖片存在"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        confidence = block.params.get("confidence", 0.8)
        
        context.log(f"檢查圖片是否存在: {image_path}")
        position = image_finder.find_on_screen(image_path, confidence=confidence)
        
        if position:
            context.log("圖片存在，執行子區塊")
            return {"exists": True, "position": position.to_dict(), "execute_children": True}
        else:
            context.log("圖片不存在，執行 else 區塊")
            return {"exists": False, "execute_else": True}


class LoopTimesExecutor(BlockExecutor):
    """重複 N 次"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        times = int(block.params.get("times", 1))
        context.log(f"開始迴圈，次數: {times}")
        return {"loop": True, "times": times}


class LoopWhileImageExecutor(BlockExecutor):
    """當圖片存在時重複"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        max_iterations = block.params.get("max_iterations", 100)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"當圖片存在時重複: {image_path} (信心度: {confidence})")
        return {
            "loop": True,
            "condition": "while_image",
            "image_path": image_path,
            "max_iterations": max_iterations,
            "confidence": confidence,
        }


class LoopUntilImageExecutor(BlockExecutor):
    """重複直到圖片出現"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        image_path = context.resolve_value(block.params.get("image_path"))
        max_iterations = block.params.get("max_iterations", 100)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"重複直到圖片出現: {image_path} (信心度: {confidence})")
        return {
            "loop": True,
            "condition": "until_image",
            "image_path": image_path,
            "max_iterations": max_iterations,
            "confidence": confidence,
        }


class BreakExecutor(BlockExecutor):
    """跳出迴圈"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        context.log("跳出迴圈")
        context.should_break = True
        return {"break": True}


class ContinueExecutor(BlockExecutor):
    """繼續下一輪"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        context.log("繼續下一輪迴圈")
        context.should_continue = True
        return {"continue": True}


# ==================== 變數類 Blocks ====================

class SetVariableExecutor(BlockExecutor):
    """設定變數"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        name = block.params.get("name", "")
        value = context.resolve_value(block.params.get("value"))
        
        context.log(f"設定變數 {name} = {value}")
        context.set_variable(name, value)
        return {"name": name, "value": value}


class GetVariableExecutor(BlockExecutor):
    """取得變數"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        name = block.params.get("name", "")
        value = context.get_variable(name)
        
        context.log(f"取得變數 {name} = {value}")
        return {"name": name, "value": value}


class SavePositionExecutor(BlockExecutor):
    """儲存座標"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        variable_name = block.params.get("variable_name", "")
        image_path = context.resolve_value(block.params.get("image_path"))
        timeout = block.params.get("timeout", 30)
        confidence = block.params.get("confidence", settings.default_confidence)
        
        context.log(f"尋找圖片並儲存座標到變數 {variable_name} (信心度: {confidence})")
        position = await image_finder.wait_for_image(image_path, timeout=timeout, confidence=confidence)
        
        if position:
            context.set_variable(variable_name, position.to_dict())
            context.log(f"座標已儲存: ({position.x}, {position.y})，匹配度: {position.confidence:.2%}")
            return position.to_dict()
        else:
            raise TimeoutError(f"找不到圖片: {image_path}")


# ==================== 進階類 Blocks ====================

class RunScriptExecutor(BlockExecutor):
    """執行子腳本"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        script_id = block.params.get("script_id", "")
        context.log(f"執行子腳本: {script_id}")
        # 實際執行會在 engine.py 中處理
        return {"script_id": script_id, "run_subscript": True}


class HttpRequestExecutor(BlockExecutor):
    """HTTP 請求"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        method = block.params.get("method", "GET")
        url = context.resolve_value(block.params.get("url", ""))
        headers = block.params.get("headers", {})
        body = context.resolve_value(block.params.get("body", ""))
        
        context.log(f"發送 {method} 請求到 {url}")
        
        async with httpx.AsyncClient() as client:
            response = await client.request(
                method=method,
                url=url,
                headers=headers,
                content=body if body else None,
            )
            
            context.log(f"回應狀態碼: {response.status_code}")
            
            return {
                "status_code": response.status_code,
                "headers": dict(response.headers),
                "body": response.text,
            }


class RunCommandExecutor(BlockExecutor):
    """執行命令"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        command = context.resolve_value(block.params.get("command", ""))
        
        context.log(f"執行命令: {command}")
        
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
        )
        
        context.log(f"命令執行完成，返回碼: {result.returncode}")
        
        return {
            "returncode": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }


class LogExecutor(BlockExecutor):
    """記錄日誌"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        message = str(context.resolve_value(block.params.get("message", "")))
        level = block.params.get("level", "info")
        
        context.log(message, level=level)
        return {"message": message, "level": level}


class ScreenshotExecutor(BlockExecutor):
    """截圖"""
    
    async def execute(self, block: BlockInstance, context: ExecutionContext) -> Any:
        save_path = context.resolve_value(block.params.get("save_path", ""))
        
        context.log(f"擷取螢幕截圖")
        
        screenshot_bytes = image_finder.capture_screen()
        
        if save_path:
            from pathlib import Path
            path = Path(save_path)
            if not path.is_absolute():
                path = settings.images_dir / path
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(screenshot_bytes)
            context.log(f"截圖已儲存到: {path}")
        
        return {"saved": bool(save_path), "path": str(save_path) if save_path else None}


# ==================== Block 註冊表 ====================

class BlockRegistry:
    """Block 註冊表"""
    
    # Block 定義
    DEFINITIONS: Dict[str, BlockDefinition] = {
        # 動作類
        "click_image": BlockDefinition(
            id="click_image",
            name="點擊圖片",
            category=BlockCategory.ACTION,
            description="找到圖片並點擊",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
                "offset_x": {"type": "number", "default": 0, "description": "X 偏移"},
                "offset_y": {"type": "number", "default": 0, "description": "Y 偏移"},
            },
            color="#5b80a5",
        ),
        "click_position": BlockDefinition(
            id="click_position",
            name="點擊座標",
            category=BlockCategory.ACTION,
            description="點擊指定座標",
            params={
                "x": {"type": "number", "required": True, "description": "X 座標"},
                "y": {"type": "number", "required": True, "description": "Y 座標"},
                "button": {"type": "select", "options": ["left", "right", "middle"], "default": "left", "description": "滑鼠按鈕"},
            },
            color="#5b80a5",
        ),
        "double_click_image": BlockDefinition(
            id="double_click_image",
            name="雙擊圖片",
            category=BlockCategory.ACTION,
            description="找到圖片並雙擊",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#5b80a5",
        ),
        "right_click_image": BlockDefinition(
            id="right_click_image",
            name="右鍵圖片",
            category=BlockCategory.ACTION,
            description="找到圖片並右鍵點擊",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#5b80a5",
        ),
        "type_text": BlockDefinition(
            id="type_text",
            name="輸入文字",
            category=BlockCategory.ACTION,
            description="模擬鍵盤輸入文字",
            params={
                "text": {"type": "text", "required": True, "description": "要輸入的文字"},
                "interval": {"type": "number", "default": 0.05, "description": "字元間隔（秒）"},
            },
            color="#5b80a5",
        ),
        "hotkey": BlockDefinition(
            id="hotkey",
            name="快捷鍵",
            category=BlockCategory.ACTION,
            description="執行組合鍵",
            params={
                "keys": {"type": "keys", "required": True, "description": "按鍵組合（如 ctrl+c）"},
            },
            color="#5b80a5",
        ),
        "scroll": BlockDefinition(
            id="scroll",
            name="滾動",
            category=BlockCategory.ACTION,
            description="滾動滑鼠滾輪",
            params={
                "direction": {"type": "select", "options": ["up", "down"], "default": "down", "description": "方向"},
                "amount": {"type": "number", "default": 3, "description": "滾動量"},
                "x": {"type": "number", "description": "X 座標（可選）"},
                "y": {"type": "number", "description": "Y 座標（可選）"},
            },
            color="#5b80a5",
        ),
        "drag_drop": BlockDefinition(
            id="drag_drop",
            name="拖放",
            category=BlockCategory.ACTION,
            description="從 A 圖片拖到 B 圖片",
            params={
                "from_image": {"type": "image", "required": True, "description": "起點圖片"},
                "to_image": {"type": "image", "required": True, "description": "終點圖片"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#5b80a5",
        ),
        "wait": BlockDefinition(
            id="wait",
            name="等待",
            category=BlockCategory.ACTION,
            description="等待指定秒數",
            params={
                "seconds": {"type": "number", "required": True, "default": 1, "description": "等待秒數"},
            },
            color="#5b80a5",
        ),
        "wait_image": BlockDefinition(
            id="wait_image",
            name="等待圖片出現",
            category=BlockCategory.ACTION,
            description="等待直到圖片出現",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#5b80a5",
        ),
        "wait_image_gone": BlockDefinition(
            id="wait_image_gone",
            name="等待圖片消失",
            category=BlockCategory.ACTION,
            description="等待直到圖片消失",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#5b80a5",
        ),
        
        # 控制類
        "if_image_exists": BlockDefinition(
            id="if_image_exists",
            name="如果圖片存在",
            category=BlockCategory.CONTROL,
            description="條件分支：如果圖片存在",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
            },
            has_children=True,
            has_else=True,
            color="#5ca65b",
        ),
        "loop_times": BlockDefinition(
            id="loop_times",
            name="重複 N 次",
            category=BlockCategory.CONTROL,
            description="固定次數迴圈",
            params={
                "times": {"type": "number", "required": True, "default": 1, "description": "重複次數"},
            },
            has_children=True,
            color="#5ca65b",
        ),
        "loop_while_image": BlockDefinition(
            id="loop_while_image",
            name="當圖片存在時重複",
            category=BlockCategory.CONTROL,
            description="條件迴圈：當圖片存在時重複",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "max_iterations": {"type": "number", "default": 100, "description": "最大迭代次數"},
            },
            has_children=True,
            color="#5ca65b",
        ),
        "loop_until_image": BlockDefinition(
            id="loop_until_image",
            name="重複直到圖片出現",
            category=BlockCategory.CONTROL,
            description="條件迴圈：重複直到圖片出現",
            params={
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "max_iterations": {"type": "number", "default": 100, "description": "最大迭代次數"},
            },
            has_children=True,
            color="#5ca65b",
        ),
        "break": BlockDefinition(
            id="break",
            name="跳出迴圈",
            category=BlockCategory.CONTROL,
            description="中斷當前迴圈",
            params={},
            color="#5ca65b",
        ),
        "continue": BlockDefinition(
            id="continue",
            name="繼續下一輪",
            category=BlockCategory.CONTROL,
            description="跳過本輪迴圈",
            params={},
            color="#5ca65b",
        ),
        
        # 變數類
        "set_variable": BlockDefinition(
            id="set_variable",
            name="設定變數",
            category=BlockCategory.VARIABLE,
            description="設定變數值",
            params={
                "name": {"type": "text", "required": True, "description": "變數名稱"},
                "value": {"type": "any", "required": True, "description": "變數值"},
            },
            color="#a55b80",
        ),
        "get_variable": BlockDefinition(
            id="get_variable",
            name="取得變數",
            category=BlockCategory.VARIABLE,
            description="讀取變數值",
            params={
                "name": {"type": "text", "required": True, "description": "變數名稱"},
            },
            color="#a55b80",
        ),
        "save_position": BlockDefinition(
            id="save_position",
            name="儲存座標",
            category=BlockCategory.VARIABLE,
            description="將找到的座標存入變數",
            params={
                "variable_name": {"type": "text", "required": True, "description": "變數名稱"},
                "image_path": {"type": "image", "required": True, "description": "圖片路徑"},
                "confidence": {"type": "number", "default": 0.8, "min": 0.1, "max": 1.0, "step": 0.05, "description": "匹配信心度 (0.1-1.0)"},
                "timeout": {"type": "number", "default": 30, "description": "超時時間（秒）"},
            },
            color="#a55b80",
        ),
        
        # 進階類
        "run_script": BlockDefinition(
            id="run_script",
            name="執行子腳本",
            category=BlockCategory.ADVANCED,
            description="呼叫另一個腳本",
            params={
                "script_id": {"type": "script", "required": True, "description": "腳本 ID"},
            },
            color="#a5805b",
        ),
        "http_request": BlockDefinition(
            id="http_request",
            name="HTTP 請求",
            category=BlockCategory.ADVANCED,
            description="發送 HTTP 請求",
            params={
                "method": {"type": "select", "options": ["GET", "POST", "PUT", "DELETE", "PATCH"], "default": "GET", "description": "HTTP 方法"},
                "url": {"type": "text", "required": True, "description": "URL"},
                "headers": {"type": "json", "default": {}, "description": "請求標頭"},
                "body": {"type": "text", "description": "請求內容"},
            },
            color="#a5805b",
        ),
        "run_command": BlockDefinition(
            id="run_command",
            name="執行命令",
            category=BlockCategory.ADVANCED,
            description="執行系統命令",
            params={
                "command": {"type": "text", "required": True, "description": "命令"},
            },
            color="#a5805b",
        ),
        "log": BlockDefinition(
            id="log",
            name="記錄日誌",
            category=BlockCategory.ADVANCED,
            description="輸出日誌",
            params={
                "message": {"type": "text", "required": True, "description": "日誌訊息"},
                "level": {"type": "select", "options": ["debug", "info", "warning", "error"], "default": "info", "description": "日誌等級"},
            },
            color="#a5805b",
        ),
        "screenshot": BlockDefinition(
            id="screenshot",
            name="截圖",
            category=BlockCategory.ADVANCED,
            description="儲存當前螢幕截圖",
            params={
                "save_path": {"type": "text", "description": "儲存路徑（可選）"},
            },
            color="#a5805b",
        ),
    }
    
    # Block 執行器映射
    EXECUTORS: Dict[str, Type[BlockExecutor]] = {
        # 動作類
        "click_image": ClickImageExecutor,
        "click_position": ClickPositionExecutor,
        "double_click_image": DoubleClickImageExecutor,
        "right_click_image": RightClickImageExecutor,
        "type_text": TypeTextExecutor,
        "hotkey": HotkeyExecutor,
        "scroll": ScrollExecutor,
        "drag_drop": DragDropExecutor,
        "wait": WaitExecutor,
        "wait_image": WaitImageExecutor,
        "wait_image_gone": WaitImageGoneExecutor,
        
        # 控制類
        "if_image_exists": IfImageExistsExecutor,
        "loop_times": LoopTimesExecutor,
        "loop_while_image": LoopWhileImageExecutor,
        "loop_until_image": LoopUntilImageExecutor,
        "break": BreakExecutor,
        "continue": ContinueExecutor,
        
        # 變數類
        "set_variable": SetVariableExecutor,
        "get_variable": GetVariableExecutor,
        "save_position": SavePositionExecutor,
        
        # 進階類
        "run_script": RunScriptExecutor,
        "http_request": HttpRequestExecutor,
        "run_command": RunCommandExecutor,
        "log": LogExecutor,
        "screenshot": ScreenshotExecutor,
    }
    
    @classmethod
    def get_definition(cls, block_id: str) -> Optional[BlockDefinition]:
        """取得 Block 定義"""
        return cls.DEFINITIONS.get(block_id)
    
    @classmethod
    def get_executor(cls, block_id: str) -> Optional[BlockExecutor]:
        """取得 Block 執行器實例"""
        executor_class = cls.EXECUTORS.get(block_id)
        if executor_class:
            return executor_class()
        return None
    
    @classmethod
    def get_all_definitions(cls) -> Dict[str, BlockDefinition]:
        """取得所有 Block 定義"""
        return cls.DEFINITIONS
    
    @classmethod
    def get_definitions_by_category(cls, category: BlockCategory) -> Dict[str, BlockDefinition]:
        """依類別取得 Block 定義"""
        return {
            k: v for k, v in cls.DEFINITIONS.items()
            if v.category == category
        }
