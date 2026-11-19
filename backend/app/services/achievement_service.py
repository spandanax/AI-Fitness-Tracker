"""
Achievement and Gamification Service.
Awards real badges and points based on workout accomplishments.
"""
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.user import User
from app.models.workout import WorkoutSession
from app.models.achievement import UserAchievement

ACHIEVEMENT_DEFINITIONS = {
    "first_workout": {
        "title": "First Step",
        "description": "Completed your very first AI-guided workout!",
        "icon": "Award",
        "points": 50,
    },
    "reps_50": {
        "title": "Rep Cadet",
        "description": "Reached 50 total completed repetitions across workouts.",
        "icon": "Zap",
        "points": 75,
    },
    "reps_100": {
        "title": "Century Club",
        "description": "Completed 100 total repetitions with AI posture tracking.",
        "icon": "Trophy",
        "points": 150,
    },
    "reps_500": {
        "title": "Rep Master",
        "description": "Crossed 500 total repetitions! A true fitness powerhouse.",
        "icon": "Flame",
        "points": 300,
    },
    "squat_master": {
        "title": "Iron Thighs",
        "description": "Completed 50+ squats with verified depth.",
        "icon": "Activity",
        "points": 100,
    },
    "pushup_master": {
        "title": "Pushup Titan",
        "description": "Completed 50+ push-ups maintaining strict form.",
        "icon": "Shield",
        "points": 100,
    },
    "plank_master": {
        "title": "Steel Core",
        "description": "Accumulated 180+ seconds in strict plank hold.",
        "icon": "Anchor",
        "points": 100,
    },
    "perfectionist": {
        "title": "Master of Form",
        "description": "Achieved a 90%+ quality score on a session of at least 8 reps.",
        "icon": "Star",
        "points": 120,
    },
    "three_sessions": {
        "title": "Hat Trick",
        "description": "Completed 3 full workout sessions.",
        "icon": "Target",
        "points": 80,
    },
    "seven_sessions": {
        "title": "Consistency Champion",
        "description": "Completed 7 workout sessions.",
        "icon": "Crown",
        "points": 200,
    }
}

def check_and_unlock_achievements(db: Session, user: User, session: WorkoutSession) -> list[dict]:
    """
    Evaluates criteria and unlocks new badges for the user, updating their points.
    Returns list of newly awarded achievement dicts.
    """
    newly_unlocked = []

    # Get existing user badges
    existing_badge_keys = set(
        b.badge_key for b in db.query(UserAchievement.badge_key).filter(UserAchievement.user_id == user.id).all()
    )

    # Aggregate stats
    stats = db.query(
        func.count(WorkoutSession.id).label("total_sessions"),
        func.sum(WorkoutSession.reps_completed).label("total_reps")
    ).filter(WorkoutSession.user_id == user.id).first()

    total_sessions = stats.total_sessions or 0
    total_reps = stats.total_reps or 0

    # Exercise specific reps
    squat_reps = db.query(func.sum(WorkoutSession.reps_completed)).filter(
        WorkoutSession.user_id == user.id, WorkoutSession.exercise_type == "squat"
    ).scalar() or 0

    pushup_reps = db.query(func.sum(WorkoutSession.reps_completed)).filter(
        WorkoutSession.user_id == user.id, WorkoutSession.exercise_type == "pushup"
    ).scalar() or 0

    plank_seconds = db.query(func.sum(WorkoutSession.duration_seconds)).filter(
        WorkoutSession.user_id == user.id, WorkoutSession.exercise_type == "plank"
    ).scalar() or 0

    def award(key: str):
        if key not in existing_badge_keys and key in ACHIEVEMENT_DEFINITIONS:
            definition = ACHIEVEMENT_DEFINITIONS[key]
            ach = UserAchievement(
                user_id=user.id,
                badge_key=key,
                title=definition["title"],
                description=definition["description"],
                icon=definition["icon"],
                unlocked_at=datetime.utcnow()
            )
            db.add(ach)
            user.points = (user.points or 0) + definition["points"]
            existing_badge_keys.add(key)
            newly_unlocked.append({
                "badge_key": key,
                "title": definition["title"],
                "description": definition["description"],
                "icon": definition["icon"],
                "points_awarded": definition["points"]
            })

    # Evaluation rules
    if total_sessions >= 1:
        award("first_workout")
    if total_sessions >= 3:
        award("three_sessions")
    if total_sessions >= 7:
        award("seven_sessions")

    if total_reps >= 50:
        award("reps_50")
    if total_reps >= 100:
        award("reps_100")
    if total_reps >= 500:
        award("reps_500")

    if squat_reps >= 50:
        award("squat_master")
    if pushup_reps >= 50:
        award("pushup_master")
    if plank_seconds >= 180:
        award("plank_master")

    if session.reps_completed >= 8 and session.avg_quality_score >= 90.0:
        award("perfectionist")

    # Repetition points: 5 points per rep
    user.points = (user.points or 0) + (session.reps_completed * 5)
    # Extra bonus for high quality session (>85)
    if session.avg_quality_score >= 85.0:
        user.points += 20

    db.commit()
    return newly_unlocked
