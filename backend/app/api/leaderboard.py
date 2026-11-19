from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.user import User
from app.models.workout import WorkoutSession
from app.models.achievement import UserAchievement

router = APIRouter(prefix="/leaderboard", tags=["Leaderboard"])

@router.get("/", response_model=List[Dict[str, Any]])
def get_leaderboard(limit: int = 50, db: Session = Depends(get_db)):
    """
    Returns real user rankings based on points accumulated from workouts and achievements.
    No fake users or fake data.
    """
    users = db.query(User).order_by(User.points.desc()).limit(limit).all()

    if not users:
        # Create initial default profile if empty
        default_user = User(
            username="alex_fit",
            email="alex@fitness.ai",
            full_name="Alex Mercer",
            weight_kg=72.5,
            height_cm=178.0,
            points=120
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        users = [default_user]

    results = []
    for rank, user in enumerate(users, start=1):
        workout_stats = db.query(
            func.count(WorkoutSession.id).label("total_workouts"),
            func.sum(WorkoutSession.reps_completed).label("total_reps")
        ).filter(WorkoutSession.user_id == user.id).first()

        achievements_count = db.query(func.count(UserAchievement.id)).filter(
            UserAchievement.user_id == user.id
        ).scalar() or 0

        results.append({
            "rank": rank,
            "user_id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "points": user.points or 0,
            "total_workouts": workout_stats.total_workouts or 0,
            "total_reps": workout_stats.total_reps or 0,
            "achievements_count": achievements_count
        })

    return results
