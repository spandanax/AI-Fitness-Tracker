import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = "Fitness Athlete"
    weight_kg: Optional[float] = 70.0
    height_cm: Optional[float] = 175.0
    fitness_goal: Optional[str] = "general_fitness"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    fitness_goal: Optional[str] = None

class UserResponse(UserBase):
    id: int
    points: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = ConfigDict(from_attributes=True)
