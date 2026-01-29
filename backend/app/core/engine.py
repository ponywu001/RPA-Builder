"""
腳本執行引擎 - 解析並執行 Block 腳本

功能：
- execute: 同步執行腳本
- execute_async: 非同步執行腳本
- stop: 停止執行
- pause: 暫停執行
- resume: 繼續執行
- get_status: 取得執行狀態
"""

import asyncio
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from enum import Enum

from .blocks import BlockRegistry, BlockInstance, ExecutionContext
from .image_finder import image_finder
from .config import settings


class ExecutionStatus(str, Enum):
    """執行狀態"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    SUCCESS = "success"
    FAILED = "failed"
    STOPPED = "stopped"


@dataclass
class ExecutionProgress:
    """執行進度"""
    current_step: int = 0
    total_steps: int = 0
    current_block_id: Optional[str] = None


@dataclass
class ExecutionResult:
    """執行結果"""
    execution_id: str
    script_id: str
    script_name: str
    status: ExecutionStatus
    progress: ExecutionProgress
    started_at: datetime
    finished_at: Optional[datetime] = None
    error: Optional[str] = None
    variables: Dict[str, Any] = field(default_factory=dict)
    logs: List[Dict[str, Any]] = field(default_factory=list)
    
    def to_dict(self) -> dict:
        return {
            "execution_id": self.execution_id,
            "script_id": self.script_id,
            "script_name": self.script_name,
            "status": self.status.value,
            "progress": {
                "current_step": self.progress.current_step,
                "total_steps": self.progress.total_steps,
                "current_block_id": self.progress.current_block_id,
            },
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "error": self.error,
            "variables": self.variables,
            "logs": self.logs,
        }


class ScriptExecution:
    """腳本執行實例"""
    
    def __init__(
        self,
        execution_id: str,
        script_id: str,
        script_name: str,
        blocks: List[BlockInstance],
        initial_variables: Dict[str, Any] = None,
    ):
        self.execution_id = execution_id
        self.script_id = script_id
        self.script_name = script_name
        self.blocks = blocks
        
        # 執行上下文
        self.context = ExecutionContext()
        if initial_variables:
            self.context.variables.update(initial_variables)
        
        # 計算總步數
        self.context.total_steps = self._count_steps(blocks)
        
        # 執行狀態
        self.status = ExecutionStatus.PENDING
        self.started_at: Optional[datetime] = None
        self.finished_at: Optional[datetime] = None
        self.error: Optional[str] = None
        
        # 控制
        self._pause_event = asyncio.Event()
        self._pause_event.set()  # 初始為非暫停狀態
        
    def _count_steps(self, blocks: List[BlockInstance]) -> int:
        """計算總步數"""
        count = 0
        for block in blocks:
            count += 1
            if block.children:
                count += self._count_steps(block.children)
            if block.else_children:
                count += self._count_steps(block.else_children)
        return count
    
    async def execute(self) -> ExecutionResult:
        """執行腳本"""
        self.status = ExecutionStatus.RUNNING
        self.started_at = datetime.now()
        self.context.log(f"開始執行腳本: {self.script_name}")
        
        try:
            await self._execute_blocks(self.blocks)
            
            if self.context.should_stop:
                self.status = ExecutionStatus.STOPPED
                self.context.log("腳本已停止")
            else:
                self.status = ExecutionStatus.SUCCESS
                self.context.log("腳本執行成功")
                
        except Exception as e:
            self.status = ExecutionStatus.FAILED
            self.error = str(e)
            self.context.log(f"腳本執行失敗: {e}", level="error")
        finally:
            self.finished_at = datetime.now()
        
        return self._get_result()
    
    async def _execute_blocks(self, blocks: List[BlockInstance]) -> None:
        """執行 Block 列表"""
        for block in blocks:
            # 檢查是否應該停止
            if self.context.should_stop:
                break
            
            # 檢查是否應該暫停
            await self._pause_event.wait()
            
            # 檢查 break/continue
            if self.context.should_break or self.context.should_continue:
                break
            
            await self._execute_block(block)
    
    async def _execute_block(self, block: BlockInstance) -> Any:
        """執行單一 Block"""
        self.context.current_step += 1
        
        # 取得執行器
        executor = BlockRegistry.get_executor(block.id)
        if not executor:
            raise ValueError(f"未知的 Block 類型: {block.id}")
        
        self.context.log(f"執行 Block: {block.id} ({block.instance_id})")
        
        # 執行 Block
        result = await executor.execute(block, self.context)
        
        # 處理控制類 Block
        if block.id == "if_image_exists":
            if result.get("execute_children") and block.children:
                await self._execute_blocks(block.children)
            elif result.get("execute_else") and block.else_children:
                await self._execute_blocks(block.else_children)
                
        elif block.id == "loop_times":
            times = result.get("times", 1)
            for i in range(times):
                if self.context.should_stop or self.context.should_break:
                    break
                    
                self.context.set_variable("_loop_index", i)
                self.context.log(f"迴圈第 {i + 1}/{times} 次")
                
                await self._execute_blocks(block.children)
                
                if self.context.should_continue:
                    self.context.should_continue = False
                    continue
                    
            self.context.should_break = False
            
        elif block.id == "loop_while_image":
            image_path = result.get("image_path")
            max_iterations = result.get("max_iterations", 100)
            confidence = result.get("confidence", settings.default_confidence)
            
            iteration = 0
            while iteration < max_iterations:
                if self.context.should_stop or self.context.should_break:
                    break
                    
                # 檢查圖片是否存在
                position = image_finder.find_on_screen(image_path, confidence=confidence)
                if not position:
                    break
                    
                iteration += 1
                self.context.set_variable("_loop_index", iteration - 1)
                self.context.log(f"條件迴圈第 {iteration} 次")
                
                await self._execute_blocks(block.children)
                
                if self.context.should_continue:
                    self.context.should_continue = False
                    continue
                    
            self.context.should_break = False
            
        elif block.id == "loop_until_image":
            image_path = result.get("image_path")
            max_iterations = result.get("max_iterations", 100)
            confidence = result.get("confidence", settings.default_confidence)
            
            iteration = 0
            while iteration < max_iterations:
                if self.context.should_stop or self.context.should_break:
                    break
                    
                # 檢查圖片是否出現
                position = image_finder.find_on_screen(image_path, confidence=confidence)
                if position:
                    self.context.log("目標圖片已出現，結束迴圈")
                    break
                    
                iteration += 1
                self.context.set_variable("_loop_index", iteration - 1)
                self.context.log(f"條件迴圈第 {iteration} 次")
                
                await self._execute_blocks(block.children)
                
                if self.context.should_continue:
                    self.context.should_continue = False
                    continue
                    
            self.context.should_break = False
            
        elif block.id == "run_script":
            # 子腳本執行由 ScriptEngine 處理
            script_id = result.get("script_id")
            if script_id and result.get("run_subscript"):
                # 這裡需要 engine 實例來執行子腳本
                # 實際會在 ScriptEngine.execute_block 中處理
                pass
        
        return result
    
    def stop(self) -> bool:
        """停止執行"""
        self.context.should_stop = True
        self._pause_event.set()  # 如果正在暫停，先恢復
        return True
    
    def pause(self) -> bool:
        """暫停執行"""
        if self.status == ExecutionStatus.RUNNING:
            self.status = ExecutionStatus.PAUSED
            self._pause_event.clear()
            self.context.log("腳本已暫停")
            return True
        return False
    
    def resume(self) -> bool:
        """繼續執行"""
        if self.status == ExecutionStatus.PAUSED:
            self.status = ExecutionStatus.RUNNING
            self._pause_event.set()
            self.context.log("腳本繼續執行")
            return True
        return False
    
    def _get_result(self) -> ExecutionResult:
        """取得執行結果"""
        return ExecutionResult(
            execution_id=self.execution_id,
            script_id=self.script_id,
            script_name=self.script_name,
            status=self.status,
            progress=ExecutionProgress(
                current_step=self.context.current_step,
                total_steps=self.context.total_steps,
            ),
            started_at=self.started_at,
            finished_at=self.finished_at,
            error=self.error,
            variables=self.context.variables,
            logs=self.context.logs,
        )
    
    def get_status(self) -> ExecutionResult:
        """取得當前狀態"""
        return self._get_result()


class ScriptEngine:
    """腳本執行引擎"""
    
    _instance: Optional["ScriptEngine"] = None
    
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
        self._executions: Dict[str, ScriptExecution] = {}
        self._max_concurrent = settings.max_concurrent_executions
        self._script_loader = None  # 將由外部注入
    
    def set_script_loader(self, loader) -> None:
        """設定腳本載入器"""
        self._script_loader = loader
    
    async def execute(
        self,
        script_id: str,
        script_name: str,
        blocks: List[dict],
        variables: Dict[str, Any] = None,
    ) -> ExecutionResult:
        """
        同步執行腳本
        
        Args:
            script_id: 腳本 ID
            script_name: 腳本名稱
            blocks: Block 列表（字典格式）
            variables: 初始變數
            
        Returns:
            ExecutionResult
        """
        execution_id = str(uuid.uuid4())
        
        # 轉換 blocks
        block_instances = [BlockInstance.from_dict(b) for b in blocks]
        
        # 建立執行實例
        execution = ScriptExecution(
            execution_id=execution_id,
            script_id=script_id,
            script_name=script_name,
            blocks=block_instances,
            initial_variables=variables,
        )
        
        self._executions[execution_id] = execution
        
        try:
            result = await execution.execute()
        finally:
            # 清理（可選：保留一段時間供查詢）
            pass
        
        return result
    
    async def execute_async(
        self,
        script_id: str,
        script_name: str,
        blocks: List[dict],
        variables: Dict[str, Any] = None,
    ) -> str:
        """
        非同步執行腳本（立即返回 execution_id）
        
        Returns:
            execution_id
        """
        # 檢查並發限制
        running_count = sum(
            1 for e in self._executions.values()
            if e.status in (ExecutionStatus.RUNNING, ExecutionStatus.PAUSED)
        )
        
        if running_count >= self._max_concurrent:
            raise RuntimeError(f"已達到最大並發執行數量: {self._max_concurrent}")
        
        execution_id = str(uuid.uuid4())
        
        # 轉換 blocks
        block_instances = [BlockInstance.from_dict(b) for b in blocks]
        
        # 建立執行實例
        execution = ScriptExecution(
            execution_id=execution_id,
            script_id=script_id,
            script_name=script_name,
            blocks=block_instances,
            initial_variables=variables,
        )
        
        self._executions[execution_id] = execution
        
        # 背景執行
        asyncio.create_task(self._run_execution(execution_id))
        
        return execution_id
    
    async def _run_execution(self, execution_id: str) -> None:
        """背景執行任務"""
        execution = self._executions.get(execution_id)
        if execution:
            await execution.execute()
    
    def stop(self, execution_id: str) -> bool:
        """停止執行"""
        execution = self._executions.get(execution_id)
        if execution:
            return execution.stop()
        return False
    
    def pause(self, execution_id: str) -> bool:
        """暫停執行"""
        execution = self._executions.get(execution_id)
        if execution:
            return execution.pause()
        return False
    
    def resume(self, execution_id: str) -> bool:
        """繼續執行"""
        execution = self._executions.get(execution_id)
        if execution:
            return execution.resume()
        return False
    
    def get_status(self, execution_id: str) -> Optional[ExecutionResult]:
        """取得執行狀態"""
        execution = self._executions.get(execution_id)
        if execution:
            return execution.get_status()
        return None
    
    def get_logs(self, execution_id: str) -> List[Dict[str, Any]]:
        """取得執行日誌"""
        execution = self._executions.get(execution_id)
        if execution:
            return execution.context.logs
        return []
    
    def get_all_executions(
        self,
        script_id: str = None,
        status: ExecutionStatus = None,
        limit: int = 50,
    ) -> List[ExecutionResult]:
        """取得所有執行紀錄"""
        results = []
        
        for execution in self._executions.values():
            if script_id and execution.script_id != script_id:
                continue
            if status and execution.status != status:
                continue
                
            results.append(execution.get_status())
            
            if len(results) >= limit:
                break
        
        # 按開始時間排序（最新的在前）
        results.sort(
            key=lambda r: r.started_at if r.started_at else datetime.min,
            reverse=True,
        )
        
        return results
    
    def cleanup_old_executions(self, max_age_hours: int = 24) -> int:
        """清理舊的執行紀錄"""
        from datetime import timedelta
        
        cutoff = datetime.now() - timedelta(hours=max_age_hours)
        to_remove = []
        
        for execution_id, execution in self._executions.items():
            if execution.finished_at and execution.finished_at < cutoff:
                to_remove.append(execution_id)
        
        for execution_id in to_remove:
            del self._executions[execution_id]
        
        return len(to_remove)


# 全域引擎實例
engine = ScriptEngine()
