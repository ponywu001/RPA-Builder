"""
排程器服務 - 支援定時執行腳本

功能：
- 支援 Cron 表達式
- 支援一次性定時任務
- 支援週期性任務
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Callable, Any
from dataclasses import dataclass, field
from enum import Enum
import re


class ScheduleType(str, Enum):
    """排程類型"""
    ONCE = "once"           # 一次性
    INTERVAL = "interval"   # 週期性
    CRON = "cron"          # Cron 表達式


@dataclass
class ScheduleConfig:
    """排程配置"""
    schedule_id: str
    script_id: str
    script_name: str
    schedule_type: ScheduleType
    enabled: bool = True
    
    # 一次性
    run_at: Optional[datetime] = None
    
    # 週期性
    interval_seconds: Optional[int] = None
    
    # Cron 表達式 (minute hour day month weekday)
    cron_expression: Optional[str] = None
    
    # 執行參數
    variables: Dict[str, Any] = field(default_factory=dict)
    
    # 上次執行
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        return {
            "schedule_id": self.schedule_id,
            "script_id": self.script_id,
            "script_name": self.script_name,
            "schedule_type": self.schedule_type.value,
            "enabled": self.enabled,
            "run_at": self.run_at.isoformat() if self.run_at else None,
            "interval_seconds": self.interval_seconds,
            "cron_expression": self.cron_expression,
            "variables": self.variables,
            "last_run": self.last_run.isoformat() if self.last_run else None,
            "next_run": self.next_run.isoformat() if self.next_run else None,
        }


class CronParser:
    """簡單的 Cron 解析器"""
    
    @staticmethod
    def parse(expression: str) -> Dict[str, List[int]]:
        """
        解析 Cron 表達式
        格式: minute hour day month weekday
        
        範例:
        - "0 * * * *" - 每小時
        - "0 9 * * 1-5" - 週一至週五 9:00
        - "*/15 * * * *" - 每 15 分鐘
        """
        parts = expression.strip().split()
        if len(parts) != 5:
            raise ValueError(f"無效的 Cron 表達式: {expression}")
        
        names = ['minute', 'hour', 'day', 'month', 'weekday']
        ranges = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 6)]
        
        result = {}
        for i, (part, name, (min_val, max_val)) in enumerate(zip(parts, names, ranges)):
            result[name] = CronParser._parse_field(part, min_val, max_val)
        
        return result
    
    @staticmethod
    def _parse_field(field: str, min_val: int, max_val: int) -> List[int]:
        """解析單一欄位"""
        if field == '*':
            return list(range(min_val, max_val + 1))
        
        values = set()
        
        for part in field.split(','):
            # 處理步進 */n 或 start-end/step
            step = 1
            if '/' in part:
                range_part, step_str = part.split('/')
                step = int(step_str)
                part = range_part
            else:
                step = 1
            
            # 處理範圍 start-end
            if part == '*':
                values.update(range(min_val, max_val + 1, step))
            elif '-' in part:
                start, end = map(int, part.split('-'))
                values.update(range(start, end + 1, step))
            else:
                values.add(int(part))
        
        return sorted(list(values))
    
    @staticmethod
    def get_next_run(expression: str, after: datetime = None) -> Optional[datetime]:
        """計算下次執行時間"""
        if after is None:
            after = datetime.now()
        
        parsed = CronParser.parse(expression)
        
        # 從下一分鐘開始搜索
        current = after.replace(second=0, microsecond=0) + timedelta(minutes=1)
        
        # 最多搜索一年
        max_time = after + timedelta(days=366)
        
        while current < max_time:
            if (current.minute in parsed['minute'] and
                current.hour in parsed['hour'] and
                current.day in parsed['day'] and
                current.month in parsed['month'] and
                current.weekday() in parsed['weekday']):
                return current
            current += timedelta(minutes=1)
        
        return None


class Scheduler:
    """排程器"""
    
    _instance: Optional["Scheduler"] = None
    
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
        self._schedules: Dict[str, ScheduleConfig] = {}
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._execute_callback: Optional[Callable] = None
    
    def set_execute_callback(self, callback: Callable) -> None:
        """設置執行回調"""
        self._execute_callback = callback
    
    def add_schedule(self, config: ScheduleConfig) -> None:
        """添加排程"""
        config.next_run = self._calculate_next_run(config)
        self._schedules[config.schedule_id] = config
    
    def remove_schedule(self, schedule_id: str) -> bool:
        """移除排程"""
        if schedule_id in self._schedules:
            del self._schedules[schedule_id]
            return True
        return False
    
    def update_schedule(self, schedule_id: str, **kwargs) -> bool:
        """更新排程"""
        if schedule_id not in self._schedules:
            return False
        
        config = self._schedules[schedule_id]
        for key, value in kwargs.items():
            if hasattr(config, key):
                setattr(config, key, value)
        
        config.next_run = self._calculate_next_run(config)
        return True
    
    def get_schedule(self, schedule_id: str) -> Optional[ScheduleConfig]:
        """取得排程"""
        return self._schedules.get(schedule_id)
    
    def get_all_schedules(self) -> List[ScheduleConfig]:
        """取得所有排程"""
        return list(self._schedules.values())
    
    def enable_schedule(self, schedule_id: str) -> bool:
        """啟用排程"""
        return self.update_schedule(schedule_id, enabled=True)
    
    def disable_schedule(self, schedule_id: str) -> bool:
        """停用排程"""
        return self.update_schedule(schedule_id, enabled=False)
    
    def start(self) -> None:
        """啟動排程器"""
        if self._running:
            return
        
        self._running = True
        self._task = asyncio.create_task(self._run_loop())
    
    def stop(self) -> None:
        """停止排程器"""
        self._running = False
        if self._task:
            self._task.cancel()
            self._task = None
    
    async def _run_loop(self) -> None:
        """排程器主迴圈"""
        while self._running:
            now = datetime.now()
            
            for schedule_id, config in list(self._schedules.items()):
                if not config.enabled:
                    continue
                
                if config.next_run and config.next_run <= now:
                    # 執行排程
                    await self._execute_schedule(config)
                    
                    # 更新下次執行時間
                    config.last_run = now
                    config.next_run = self._calculate_next_run(config)
                    
                    # 一次性任務執行後停用
                    if config.schedule_type == ScheduleType.ONCE:
                        config.enabled = False
            
            # 每秒檢查一次
            await asyncio.sleep(1)
    
    async def _execute_schedule(self, config: ScheduleConfig) -> None:
        """執行排程任務"""
        if not self._execute_callback:
            return
        
        try:
            await self._execute_callback(
                script_id=config.script_id,
                script_name=config.script_name,
                variables=config.variables,
            )
        except Exception as e:
            print(f"[Scheduler] 執行排程失敗 {config.schedule_id}: {e}")
    
    def _calculate_next_run(self, config: ScheduleConfig) -> Optional[datetime]:
        """計算下次執行時間"""
        now = datetime.now()
        
        if config.schedule_type == ScheduleType.ONCE:
            if config.run_at and config.run_at > now:
                return config.run_at
            return None
        
        elif config.schedule_type == ScheduleType.INTERVAL:
            if config.interval_seconds:
                if config.last_run:
                    return config.last_run + timedelta(seconds=config.interval_seconds)
                return now + timedelta(seconds=config.interval_seconds)
            return None
        
        elif config.schedule_type == ScheduleType.CRON:
            if config.cron_expression:
                return CronParser.get_next_run(config.cron_expression, now)
            return None
        
        return None


# 全域實例
scheduler = Scheduler()
