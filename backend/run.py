#!/usr/bin/env python
"""
RPA Builder 後端啟動腳本
"""

import os
import sys
import subprocess
import socket

import uvicorn
from app.core.config import settings


def is_port_in_use(port: int) -> bool:
    """檢查端口是否被佔用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0


def kill_process_on_port(port: int) -> bool:
    """
    清除佔用指定端口的進程 (Windows)
    
    Returns:
        True 如果成功清除或端口未被佔用
    """
    if not is_port_in_use(port):
        return True
    
    print(f"[!] 端口 {port} 被佔用，正在嘗試清除...")
    
    try:
        # Windows: 使用 netstat 找到 PID
        result = subprocess.run(
            f'netstat -ano | findstr ":{port}"',
            shell=True,
            capture_output=True,
            text=True,
        )
        
        if result.returncode == 0 and result.stdout:
            lines = result.stdout.strip().split('\n')
            pids = set()
            
            for line in lines:
                parts = line.split()
                if len(parts) >= 5:
                    # 檢查是否是 LISTENING 狀態
                    if 'LISTENING' in line or f':{port}' in parts[1]:
                        pid = parts[-1]
                        if pid.isdigit():
                            pids.add(pid)
            
            for pid in pids:
                print(f"[*] 終止進程 PID: {pid}")
                subprocess.run(
                    f'taskkill /F /PID {pid}',
                    shell=True,
                    capture_output=True,
                )
            
            # 等待端口釋放
            import time
            for _ in range(10):
                if not is_port_in_use(port):
                    print(f"[+] 端口 {port} 已釋放")
                    return True
                time.sleep(0.5)
            
            print(f"[-] 無法釋放端口 {port}")
            return False
        else:
            print(f"[-] 找不到佔用端口 {port} 的進程")
            return False
            
    except Exception as e:
        print(f"[-] 清除端口失敗: {e}")
        return False


def main():
    """啟動後端伺服器"""
    print("")
    print("=" * 60)
    print("               RPA Builder Backend")
    print("=" * 60)
    print(f"  Version:  {settings.app_version}")
    print(f"  Host:     {settings.host}")
    print(f"  Port:     {settings.port}")
    print(f"  API Docs: http://{settings.host}:{settings.port}/docs")
    print("=" * 60)
    print("")
    
    # 自動清除佔用的端口
    if not kill_process_on_port(settings.port):
        print(f"\n[!] 無法啟動：端口 {settings.port} 被佔用")
        print("    請手動終止佔用該端口的進程後再試")
        sys.exit(1)
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info" if not settings.debug else "debug",
    )


if __name__ == "__main__":
    main()
