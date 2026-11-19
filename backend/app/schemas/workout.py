import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict

class RepetitionCreate(BaseModel):
    rep_number: int
    duration_seconds: float
    quality_score: float
    min_angle: float
    max_angle: float
    posture_faults: Optional[str] = ""

class RepetitionResponse(RepetitionCreate):
    id: int
    session_id: int
    timestamp: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class WorkoutSessionCreate(BaseModel):
    user_id: int
    exercise_type: str
    target_reps: Optional[int] = 10

class WorkoutSessionFinish(BaseModel):
    duration_seconds: int
    reps_completed: int
    sets_completed: Optional[int] = 1
    avg_quality_score: float
    fatigue_detected: Optional[bool] = False
    feedback_summary: Optional[str] = ""
    reps: Optional[List[RepetitionCreate]] = []

class WorkoutSessionResponse(BaseModel):
    id: int
    user_id: int
    exercise_type: str
    start_time: datetime.datetime
    end_time: Optional[datetime.datetime] = None
    duration_seconds: int
    reps_completed: int
    target_reps: int
    sets_completed: int
    avg_quality_score: float
    calories_burned: float
    fatigue_detected: bool
    feedback_summary: str
    created_at: datetime.datetime
    reps: Optional[List[RepetitionResponse]] = []

    model_config = ConfigDict(from_attributes=True)
