import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exercise_type = Column(String(50), nullable=False, index=True)
    start_time = Column(DateTime, default=datetime.datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, default=0)
    reps_completed = Column(Integer, default=0)
    target_reps = Column(Integer, default=10)
    sets_completed = Column(Integer, default=1)
    avg_quality_score = Column(Float, default=0.0)
    calories_burned = Column(Float, default=0.0)
    fatigue_detected = Column(Boolean, default=False)
    feedback_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="workouts")
    reps = relationship("RepetitionLog", back_populates="session", cascade="all, delete-orphan")


class RepetitionLog(Base):
    __tablename__ = "repetition_logs"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=False, index=True)
    rep_number = Column(Integer, nullable=False)
    duration_seconds = Column(Float, default=0.0)
    quality_score = Column(Float, default=0.0)
    min_angle = Column(Float, default=0.0)
    max_angle = Column(Float, default=0.0)
    posture_faults = Column(Text, default="")
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    session = relationship("WorkoutSession", back_populates="reps")
