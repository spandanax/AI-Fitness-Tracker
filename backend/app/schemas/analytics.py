from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ExerciseStat(BaseModel):
    exercise_type: str
    total_workouts: int
    total_reps: int
    total_duration_seconds: int
    avg_quality_score: float
    total_calories: float

class DailyActivity(BaseModel):
    date: str
    day_name: str
    workouts_count: int
    total_reps: int
    total_duration_minutes: float
    calories: float
    avg_quality: float

class OverallAnalytics(BaseModel):
    total_workouts: int
    total_reps: int
    total_duration_seconds: int
    total_calories: float
    avg_quality_score: float
    exercise_breakdown: List[ExerciseStat]
    weekly_activity: List[DailyActivity]
    recent_sessions: List[Dict[str, Any]]
