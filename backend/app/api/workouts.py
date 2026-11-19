import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from app.core.database import get_db
from app.models.user import User
from app.models.workout import WorkoutSession, RepetitionLog
from app.schemas.workout import (
    WorkoutSessionCreate,
    WorkoutSessionFinish,
    WorkoutSessionResponse,
    RepetitionResponse
)
from app.services.calorie_service import estimate_calories
from app.services.achievement_service import check_and_unlock_achievements

router = APIRouter(prefix="/workouts", tags=["Workouts"])

@router.post("/start", response_model=WorkoutSessionResponse)
def start_workout_session(data: WorkoutSessionCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        # Create default user if id=1
        if data.user_id == 1:
            user = User(
                username="alex_fit",
                email="alex@fitness.ai",
                full_name="Alex Mercer",
                weight_kg=72.5,
                height_cm=178.0
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(status_code=404, detail="User not found")

    session = WorkoutSession(
        user_id=user.id,
        exercise_type=data.exercise_type,
        start_time=datetime.datetime.utcnow(),
        target_reps=data.target_reps or 10,
        sets_completed=1,
        reps_completed=0,
        avg_quality_score=0.0,
        calories_burned=0.0
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

@router.post("/{session_id}/finish", response_model=Dict[str, Any])
def finish_workout_session(session_id: int, finish_data: WorkoutSessionFinish, db: Session = Depends(get_db)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")

    user = db.query(User).filter(User.id == session.user_id).first()
    user_weight = user.weight_kg if user else 70.0

    session.end_time = datetime.datetime.utcnow()
    session.duration_seconds = finish_data.duration_seconds
    session.reps_completed = finish_data.reps_completed
    session.sets_completed = finish_data.sets_completed or 1
    session.avg_quality_score = finish_data.avg_quality_score
    session.fatigue_detected = finish_data.fatigue_detected or False
    session.feedback_summary = finish_data.feedback_summary or ""

    # Calculate real calories
    calories = estimate_calories(
        exercise_type=session.exercise_type,
        duration_seconds=finish_data.duration_seconds,
        weight_kg=user_weight
    )
    session.calories_burned = calories

    # Save repetition logs if provided
    if finish_data.reps:
        for rep in finish_data.reps:
            r_log = RepetitionLog(
                session_id=session.id,
                rep_number=rep.rep_number,
                duration_seconds=rep.duration_seconds,
                quality_score=rep.quality_score,
                min_angle=rep.min_angle,
                max_angle=rep.max_angle,
                posture_faults=rep.posture_faults or ""
            )
            db.add(r_log)

    db.commit()
    db.refresh(session)

    # Check and unlock achievements
    newly_unlocked = []
    if user:
        newly_unlocked = check_and_unlock_achievements(db, user, session)

    return {
        "session": WorkoutSessionResponse.model_validate(session),
        "calories_burned": calories,
        "newly_unlocked_achievements": newly_unlocked,
        "total_user_points": user.points if user else 0
    }

@router.get("/", response_model=List[WorkoutSessionResponse])
def get_user_workouts(user_id: int = 1, limit: int = 50, db: Session = Depends(get_db)):
    workouts = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id
    ).order_by(WorkoutSession.created_at.desc()).limit(limit).all()
    return workouts

@router.get("/{session_id}", response_model=WorkoutSessionResponse)
def get_workout_detail(session_id: int, db: Session = Depends(get_db)):
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Workout session not found")
    return session
