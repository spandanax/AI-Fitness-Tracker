import datetime
from pydantic import BaseModel, ConfigDict

class AchievementResponse(BaseModel):
    id: int
    user_id: int
    badge_key: str
    title: str
    description: str
    icon: str
    unlocked_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    full_name: str
    points: int
    total_workouts: int
    total_reps: int
    achievements_count: int
