"""
Analytics Service.
Aggregates metrics from SQLite for dashboard, charts, weekly progress, and summaries.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.workout import WorkoutSession, RepetitionLog
from app.models.user import User

def get_user_analytics(db: Session, user_id: int) -> Dict[str, Any]:
    # Total workouts, reps, duration, calories
    totals = db.query(
        func.count(WorkoutSession.id).label("total_workouts"),
        func.sum(WorkoutSession.reps_completed).label("total_reps"),
        func.sum(WorkoutSession.duration_seconds).label("total_duration_seconds"),
        func.sum(WorkoutSession.calories_burned).label("total_calories"),
        func.avg(WorkoutSession.avg_quality_score).label("avg_quality_score")
    ).filter(WorkoutSession.user_id == user_id).first()

    total_workouts = totals.total_workouts or 0
    total_reps = totals.total_reps or 0
    total_duration_seconds = totals.total_duration_seconds or 0
    total_calories = round(totals.total_calories or 0.0, 1)
    avg_quality_score = round(totals.avg_quality_score or 0.0, 1)

    # Exercise breakdown
    exercise_stats_query = db.query(
        WorkoutSession.exercise_type,
        func.count(WorkoutSession.id).label("count"),
        func.sum(WorkoutSession.reps_completed).label("reps"),
        func.sum(WorkoutSession.duration_seconds).label("duration"),
        func.avg(WorkoutSession.avg_quality_score).label("avg_quality"),
        func.sum(WorkoutSession.calories_burned).label("calories")
    ).filter(WorkoutSession.user_id == user_id).group_by(WorkoutSession.exercise_type).all()

    exercise_breakdown = [
        {
            "exercise_type": row.exercise_type,
            "total_workouts": row.count,
            "total_reps": row.reps or 0,
            "total_duration_seconds": row.duration or 0,
            "avg_quality_score": round(row.avg_quality or 0.0, 1),
            "total_calories": round(row.calories or 0.0, 1)
        }
        for row in exercise_stats_query
    ]

    # 7-Day Activity Trend (Last 7 days)
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)
    
    sessions_last_7_days = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id,
        WorkoutSession.created_at >= datetime(seven_days_ago.year, seven_days_ago.month, seven_days_ago.day)
    ).all()

    # Map by day string YYYY-MM-DD
    day_map: Dict[str, List[WorkoutSession]] = {}
    for i in range(7):
        current_day = seven_days_ago + timedelta(days=i)
        day_str = current_day.strftime("%Y-%m-%d")
        day_map[day_str] = []

    for s in sessions_last_7_days:
        s_day = s.created_at.strftime("%Y-%m-%d")
        if s_day in day_map:
            day_map[s_day].append(s)

    weekly_activity = []
    for day_str, s_list in sorted(day_map.items()):
        dt = datetime.strptime(day_str, "%Y-%m-%d")
        day_name = dt.strftime("%a") # Mon, Tue, etc.
        day_reps = sum(s.reps_completed for s in s_list)
        day_duration_mins = round(sum(s.duration_seconds for s in s_list) / 60.0, 1)
        day_calories = round(sum(s.calories_burned for s in s_list), 1)
        avg_quality = (
            round(sum(s.avg_quality_score for s in s_list) / len(s_list), 1)
            if s_list else 0.0
        )
        weekly_activity.append({
            "date": day_str,
            "day_name": day_name,
            "workouts_count": len(s_list),
            "total_reps": day_reps,
            "total_duration_minutes": day_duration_mins,
            "calories": day_calories,
            "avg_quality": avg_quality
        })

    # Recent 10 workout sessions
    recent_sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user_id
    ).order_by(WorkoutSession.created_at.desc()).limit(10).all()

    recent_sessions_data = [
        {
            "id": s.id,
            "exercise_type": s.exercise_type,
            "reps_completed": s.reps_completed,
            "target_reps": s.target_reps,
            "duration_seconds": s.duration_seconds,
            "avg_quality_score": round(s.avg_quality_score, 1),
            "calories_burned": round(s.calories_burned, 1),
            "fatigue_detected": s.fatigue_detected,
            "feedback_summary": s.feedback_summary,
            "created_at": s.created_at.isoformat()
        }
        for s in recent_sessions
    ]

    return {
        "total_workouts": total_workouts,
        "total_reps": total_reps,
        "total_duration_seconds": total_duration_seconds,
        "total_calories": total_calories,
        "avg_quality_score": avg_quality_score,
        "exercise_breakdown": exercise_breakdown,
        "weekly_activity": weekly_activity,
        "recent_sessions": recent_sessions_data
    }
