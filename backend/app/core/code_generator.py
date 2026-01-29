"""
Python 代碼生成器 - 將積木轉換成可執行的 Python 腳本
"""

from typing import Any, List


class PythonCodeGenerator:
    """Python 代碼生成器"""

    def __init__(self):
        self.indent_size = 4
        self.imports = set()
        
    def generate(self, script_name: str, blocks: List[dict]) -> str:
        """
        生成完整的 Python 腳本
        
        Args:
            script_name: 腳本名稱
            blocks: 積木列表
            
        Returns:
            完整的 Python 代碼
        """
        self.imports = set()
        
        # 先生成積木代碼以收集需要的 imports
        blocks_code = self._generate_blocks(blocks, indent=1)
        
        # 組合完整代碼
        code_parts = [
            self._generate_header(script_name),
            self._generate_imports(),
            self._generate_helper_functions(),
            self._generate_main_function(blocks_code),
            self._generate_entry_point(),
        ]
        
        return "\n".join(code_parts)

    def _generate_header(self, script_name: str) -> str:
        """生成文件頭部"""
        return f'''#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RPA 腳本: {script_name}
由 RPA Builder 自動生成
"""
'''

    def _generate_imports(self) -> str:
        """生成導入語句"""
        base_imports = [
            "import time",
            "import pyautogui",
            "import pyperclip",
        ]
        
        if "cv2" in self.imports:
            base_imports.append("import cv2")
            base_imports.append("import numpy as np")
        
        if "requests" in self.imports:
            base_imports.append("import requests")
            
        if "subprocess" in self.imports:
            base_imports.append("import subprocess")
            
        if "os" in self.imports:
            base_imports.append("import os")
            
        if "pathlib" in self.imports:
            base_imports.append("from pathlib import Path")
        
        return "\n".join(sorted(set(base_imports))) + "\n"

    def _generate_helper_functions(self) -> str:
        """生成輔助函數"""
        return '''
# ==================== 輔助函數 ====================

def find_image(image_path: str, confidence: float = 0.8, timeout: int = 30):
    """尋找螢幕上的圖片"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            location = pyautogui.locateOnScreen(image_path, confidence=confidence)
            if location:
                return pyautogui.center(location)
        except Exception:
            pass
        time.sleep(0.5)
    return None


def click_image(image_path: str, timeout: int = 30, offset_x: int = 0, offset_y: int = 0):
    """點擊圖片"""
    pos = find_image(image_path, timeout=timeout)
    if pos:
        pyautogui.click(pos.x + offset_x, pos.y + offset_y)
        return True
    raise Exception(f"找不到圖片: {image_path}")


def double_click_image(image_path: str, timeout: int = 30):
    """雙擊圖片"""
    pos = find_image(image_path, timeout=timeout)
    if pos:
        pyautogui.doubleClick(pos.x, pos.y)
        return True
    raise Exception(f"找不到圖片: {image_path}")


def right_click_image(image_path: str, timeout: int = 30):
    """右鍵點擊圖片"""
    pos = find_image(image_path, timeout=timeout)
    if pos:
        pyautogui.rightClick(pos.x, pos.y)
        return True
    raise Exception(f"找不到圖片: {image_path}")


def type_text(text: str):
    """輸入文字（支援中文）"""
    pyperclip.copy(text)
    pyautogui.hotkey("ctrl", "v")
    time.sleep(0.1)


def image_exists(image_path: str, confidence: float = 0.8) -> bool:
    """檢查圖片是否存在"""
    try:
        location = pyautogui.locateOnScreen(image_path, confidence=confidence)
        return location is not None
    except Exception:
        return False


def wait_image(image_path: str, timeout: int = 30) -> bool:
    """等待圖片出現"""
    pos = find_image(image_path, timeout=timeout)
    return pos is not None


def wait_image_gone(image_path: str, timeout: int = 30) -> bool:
    """等待圖片消失"""
    start_time = time.time()
    while time.time() - start_time < timeout:
        if not image_exists(image_path):
            return True
        time.sleep(0.5)
    return False

'''

    def _generate_main_function(self, blocks_code: str) -> str:
        """生成主函數"""
        return f'''
# ==================== 主程式 ====================

def main():
    """主程式"""
    print("開始執行腳本...")
    
    try:
{blocks_code}
        print("腳本執行完成！")
    except Exception as e:
        print(f"執行錯誤: {{e}}")
        raise
'''

    def _generate_entry_point(self) -> str:
        """生成入口點"""
        return '''
if __name__ == "__main__":
    # 安全延遲，讓使用者有時間準備
    print("3 秒後開始執行...")
    time.sleep(3)
    main()
'''

    def _generate_blocks(self, blocks: List[dict], indent: int = 0) -> str:
        """生成積木代碼"""
        if not blocks:
            return self._indent("pass", indent + 1)
            
        lines = []
        for block in blocks:
            code = self._generate_block(block, indent)
            if code:
                lines.append(code)
                
        return "\n".join(lines) if lines else self._indent("pass", indent + 1)

    def _generate_block(self, block: dict, indent: int = 0) -> str:
        """生成單個積木的代碼"""
        block_id = block.get("id", "")
        params = block.get("params", {})
        children = block.get("children", [])
        else_children = block.get("else_children", [])
        
        generators = {
            "click_image": self._gen_click_image,
            "click_position": self._gen_click_position,
            "double_click_image": self._gen_double_click_image,
            "right_click_image": self._gen_right_click_image,
            "type_text": self._gen_type_text,
            "hotkey": self._gen_hotkey,
            "scroll": self._gen_scroll,
            "drag_drop": self._gen_drag_drop,
            "wait": self._gen_wait,
            "wait_image": self._gen_wait_image,
            "wait_image_gone": self._gen_wait_image_gone,
            "if_image_exists": self._gen_if_image_exists,
            "loop_times": self._gen_loop_times,
            "loop_while_image": self._gen_loop_while_image,
            "loop_until_image": self._gen_loop_until_image,
            "break": self._gen_break,
            "continue": self._gen_continue,
            "set_variable": self._gen_set_variable,
            "save_position": self._gen_save_position,
            "run_command": self._gen_run_command,
            "http_request": self._gen_http_request,
            "log": self._gen_log,
            "screenshot": self._gen_screenshot,
        }
        
        generator = generators.get(block_id)
        if generator:
            return generator(params, children, else_children, indent)
        else:
            return self._indent(f"# 未知積木: {block_id}", indent + 1)

    def _indent(self, code: str, level: int) -> str:
        """添加縮進"""
        indent = " " * (self.indent_size * level)
        return "\n".join(indent + line for line in code.split("\n"))

    # ==================== 積木代碼生成器 ====================

    def _gen_click_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        timeout = params.get("timeout", 30)
        offset_x = params.get("offset_x", 0)
        offset_y = params.get("offset_y", 0)
        return self._indent(
            f'click_image("{image_path}", timeout={timeout}, offset_x={offset_x}, offset_y={offset_y})',
            indent + 1
        )

    def _gen_click_position(self, params: dict, children: list, else_children: list, indent: int) -> str:
        x = params.get("x", 0)
        y = params.get("y", 0)
        button = params.get("button", "left")
        return self._indent(f'pyautogui.click({x}, {y}, button="{button}")', indent + 1)

    def _gen_double_click_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        timeout = params.get("timeout", 30)
        return self._indent(f'double_click_image("{image_path}", timeout={timeout})', indent + 1)

    def _gen_right_click_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        timeout = params.get("timeout", 30)
        return self._indent(f'right_click_image("{image_path}", timeout={timeout})', indent + 1)

    def _gen_type_text(self, params: dict, children: list, else_children: list, indent: int) -> str:
        text = params.get("text", "")
        # 處理特殊字元
        escaped_text = text.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
        return self._indent(f'type_text("{escaped_text}")', indent + 1)

    def _gen_hotkey(self, params: dict, children: list, else_children: list, indent: int) -> str:
        keys = params.get("keys", "ctrl+c")
        key_list = [k.strip() for k in keys.split("+")]
        keys_str = ", ".join(f'"{k}"' for k in key_list)
        return self._indent(f'pyautogui.hotkey({keys_str})', indent + 1)

    def _gen_scroll(self, params: dict, children: list, else_children: list, indent: int) -> str:
        direction = params.get("direction", "down")
        amount = params.get("amount", 3)
        scroll_amount = amount if direction == "up" else -amount
        return self._indent(f'pyautogui.scroll({scroll_amount})', indent + 1)

    def _gen_drag_drop(self, params: dict, children: list, else_children: list, indent: int) -> str:
        from_image = params.get("from_image", "source.png")
        to_image = params.get("to_image", "target.png")
        lines = [
            f'from_pos = find_image("{from_image}")',
            f'to_pos = find_image("{to_image}")',
            'if from_pos and to_pos:',
            '    pyautogui.moveTo(from_pos.x, from_pos.y)',
            '    pyautogui.drag(to_pos.x - from_pos.x, to_pos.y - from_pos.y, duration=0.5)',
        ]
        return self._indent("\n".join(lines), indent + 1)

    def _gen_wait(self, params: dict, children: list, else_children: list, indent: int) -> str:
        seconds = params.get("seconds", 1)
        return self._indent(f'time.sleep({seconds})', indent + 1)

    def _gen_wait_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        timeout = params.get("timeout", 30)
        return self._indent(f'wait_image("{image_path}", timeout={timeout})', indent + 1)

    def _gen_wait_image_gone(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        timeout = params.get("timeout", 30)
        return self._indent(f'wait_image_gone("{image_path}", timeout={timeout})', indent + 1)

    def _gen_if_image_exists(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        lines = [f'if image_exists("{image_path}"):']
        
        if children:
            for child in children:
                child_code = self._generate_block(child, indent + 1)
                if child_code:
                    lines.append(child_code)
        else:
            lines.append(self._indent("pass", indent + 2))
            
        if else_children:
            lines.append(self._indent("else:", indent + 1))
            for child in else_children:
                child_code = self._generate_block(child, indent + 1)
                if child_code:
                    lines.append(child_code)
                    
        return self._indent(lines[0], indent + 1) + "\n" + "\n".join(lines[1:])

    def _gen_loop_times(self, params: dict, children: list, else_children: list, indent: int) -> str:
        times = params.get("times", 1)
        lines = [f'for _i in range({times}):']
        
        if children:
            for child in children:
                child_code = self._generate_block(child, indent + 1)
                if child_code:
                    lines.append(child_code)
        else:
            lines.append(self._indent("pass", indent + 2))
            
        return self._indent(lines[0], indent + 1) + "\n" + "\n".join(lines[1:])

    def _gen_loop_while_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        lines = [f'while image_exists("{image_path}"):']
        
        if children:
            for child in children:
                child_code = self._generate_block(child, indent + 1)
                if child_code:
                    lines.append(child_code)
        else:
            lines.append(self._indent("pass", indent + 2))
            
        return self._indent(lines[0], indent + 1) + "\n" + "\n".join(lines[1:])

    def _gen_loop_until_image(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        lines = [f'while not image_exists("{image_path}"):']
        
        if children:
            for child in children:
                child_code = self._generate_block(child, indent + 1)
                if child_code:
                    lines.append(child_code)
        else:
            lines.append(self._indent("pass", indent + 2))
            
        return self._indent(lines[0], indent + 1) + "\n" + "\n".join(lines[1:])

    def _gen_break(self, params: dict, children: list, else_children: list, indent: int) -> str:
        return self._indent("break", indent + 1)

    def _gen_continue(self, params: dict, children: list, else_children: list, indent: int) -> str:
        return self._indent("continue", indent + 1)

    def _gen_set_variable(self, params: dict, children: list, else_children: list, indent: int) -> str:
        var_name = params.get("var_name", "my_var")
        value = params.get("value", "")
        # 嘗試判斷值類型
        try:
            int(value)
            return self._indent(f'{var_name} = {value}', indent + 1)
        except ValueError:
            try:
                float(value)
                return self._indent(f'{var_name} = {value}', indent + 1)
            except ValueError:
                escaped_value = value.replace("\\", "\\\\").replace('"', '\\"')
                return self._indent(f'{var_name} = "{escaped_value}"', indent + 1)

    def _gen_save_position(self, params: dict, children: list, else_children: list, indent: int) -> str:
        image_path = params.get("image_path", "image.png")
        var_name = params.get("var_name", "position")
        return self._indent(f'{var_name} = find_image("{image_path}")', indent + 1)

    def _gen_run_command(self, params: dict, children: list, else_children: list, indent: int) -> str:
        self.imports.add("subprocess")
        command = params.get("command", "")
        escaped_command = command.replace("\\", "\\\\").replace('"', '\\"')
        return self._indent(f'subprocess.run("{escaped_command}", shell=True)', indent + 1)

    def _gen_http_request(self, params: dict, children: list, else_children: list, indent: int) -> str:
        self.imports.add("requests")
        method = params.get("method", "GET").lower()
        url = params.get("url", "https://example.com")
        return self._indent(f'requests.{method}("{url}")', indent + 1)

    def _gen_log(self, params: dict, children: list, else_children: list, indent: int) -> str:
        level = params.get("level", "info")
        message = params.get("message", "")
        escaped_message = message.replace("\\", "\\\\").replace('"', '\\"')
        return self._indent(f'print("[{level.upper()}] {escaped_message}")', indent + 1)

    def _gen_screenshot(self, params: dict, children: list, else_children: list, indent: int) -> str:
        save_path = params.get("save_path", "screenshot.png")
        return self._indent(f'pyautogui.screenshot("{save_path}")', indent + 1)


# 單例
code_generator = PythonCodeGenerator()
