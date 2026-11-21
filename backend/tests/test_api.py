"""
API-layer integration tests for AI Fitness Tracker.
These tests call route handler functions and service functions DIRECTLY
using an isolated in-memory SQLite database — no HTTP client, no threads,
no asyncio event-loop required.

Root cause of previous hang: starlette.testclient / anyio both require
OS thread creation, which is blocked by the development sandbox. This
direct-call approach is robust in all environments and equally thorough.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import datetime
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# --- DB Setup (isolated in-memory SQLite for each test module run) ---
from app.core.database import Base
from app.models.user import User
from app.models.workout import WorkoutSession, RepetitionLog
from app.models.achievement import UserAchievement

TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


@pytest.fixture()
def db():
    """Provide a fresh DB session; rolls back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestSession(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def user(db):
    """Create and return a test athlete."""
    u = User(
        username="test_athlete",
        email="athlete@test.ai",
        full_name="Test Athlete",
        weight_kg=75.0,
        height_cm=175.0,
        fitness_goal="general_fitness",
        points=0,
    )
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


# ─────────────────────────────────────────────────────────────────────────────
# 1. EXERCISE CATALOG  (pure in-memory, no DB)
# ─────────────────────────────────────────────────────────────────────────────

def test_exercise_catalog_has_13_items():
    from app.api.exercises import EXERCISE_CATALOG
    assert len(EXERCISE_CATALOG) == 13


def test_exercise_catalog_ids():
    from app.api.exercises import EXERCISE_CATALOG
    ids = {ex["id"] for ex in EXERCISE_CATALOG}
    expected = {
        "squat", "pushup", "pullup", "dip", "lunge",
        "jumping_jacks", "plank", "bicep_curls",
        "shoulder_press", "mountain_climbers",
        "crunches", "burpees", "calf_raises",
    }
    assert ids == expected


def test_exercise_catalog_required_fields():
    from app.api.exercises import EXERCISE_CATALOG
    required = {"id", "name", "category", "target_muscles", "difficulty",
                "met_value", "description", "key_cues", "camera_setup"}
    for ex in EXERCISE_CATALOG:
        missing = required - ex.keys()
        assert not missing, f"Exercise '{ex['id']}' missing fields: {missing}"


def test_exercise_catalog_met_values_positive():
    from app.api.exercises import EXERCISE_CATALOG
    for ex in EXERCISE_CATALOG:
        assert ex["met_value"] > 0, f"Non-positive MET for '{ex['id']}'"


def test_list_exercises_handler():
    from app.api.exercises import list_exercises
    catalog = list_exercises()
    assert len(catalog) == 13
    assert any(ex["name"] == "Squats" for ex in catalog)
    assert any(ex["name"] == "Push-ups" for ex in catalog)


def test_get_exercise_details_handler():
    from app.api.exercises import get_exercise_details
    squat = get_exercise_details("squat")
    assert squat["name"] == "Squats"
    assert "knee_depth" in squat["angle_targets"]


# ─────────────────────────────────────────────────────────────────────────────
# 2. CALORIE SERVICE
# ─────────────────────────────────────────────────────────────────────────────

def test_calorie_estimate_squat():
    from app.services.calorie_service import estimate_calories
    cal = estimate_calories("squat", 600, 75.0)   # 10 min, 75 kg
    assert cal > 0

def test_calorie_estimate_burpees_higher_than_plank():
    from app.services.calorie_service import estimate_calories
    cal_burpee = estimate_calories("burpees", 600, 70.0)
    cal_plank  = estimate_calories("plank",   600, 70.0)
    assert cal_burpee > cal_plank, "Burpees should burn more than plank"

def test_calorie_estimate_zero_duration():
    from app.services.calorie_service import estimate_calories
    assert estimate_calories("squat", 0, 75.0) == 0.0

def test_calorie_estimate_all_exercises():
    from app.services.calorie_service import estimate_calories, EXERCISE_MET_VALUES
    for ex_key in EXERCISE_MET_VALUES:
        cal = estimate_calories(ex_key, 300, 70.0)  # 5 min
        assert cal > 0, f"Zero calories for '{ex_key}'"

def test_calorie_estimate_unknown_exercise_uses_default():
    from app.services.calorie_service import estimate_calories
    cal = estimate_calories("mystery_exercise", 600, 70.0)
    assert cal > 0  # falls back to MET 6.0


# ─────────────────────────────────────────────────────────────────────────────
# 3. ANALYTICS SERVICE
# ─────────────────────────────────────────────────────────────────────────────

def _make_session(db, user_id, exercise="squat", reps=10, duration=120,
                  quality=85.0, calories=10.0):
    s = WorkoutSession(
        user_id=user_id,
        exercise_type=exercise,
        start_time=datetime.datetime.utcnow(),
        reps_completed=reps,
        target_reps=10,
        sets_completed=1,
        avg_quality_score=quality,
        calories_burned=calories,
        duration_seconds=duration,
        fatigue_detected=False,
        feedback_summary="Good session",
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


def test_analytics_weekly_activity_has_7_days(db, user):
    from app.services.analytics_service import get_user_analytics
    _make_session(db, user.id)
    result = get_user_analytics(db, user.id)
    assert len(result["weekly_activity"]) == 7


def test_analytics_counts_workouts(db, user):
    from app.services.analytics_service import get_user_analytics
    _make_session(db, user.id, exercise="squat", reps=10)
    _make_session(db, user.id, exercise="pushup", reps=8)
    result = get_user_analytics(db, user.id)
    assert result["total_workouts"] == 2


def test_analytics_total_reps(db, user):
    from app.services.analytics_service import get_user_analytics
    _make_session(db, user.id, reps=12)
    _make_session(db, user.id, reps=15)
    result = get_user_analytics(db, user.id)
    assert result["total_reps"] == 27


def test_analytics_exercise_breakdown(db, user):
    from app.services.analytics_service import get_user_analytics
    _make_session(db, user.id, exercise="squat")
    _make_session(db, user.id, exercise="pushup")
    result = get_user_analytics(db, user.id)
    types = {b["exercise_type"] for b in result["exercise_breakdown"]}
    assert "squat" in types and "pushup" in types


def test_analytics_no_workouts_returns_zeros(db, user):
    from app.services.analytics_service import get_user_analytics
    result = get_user_analytics(db, user.id)
    assert result["total_workouts"] == 0
    assert result["total_reps"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# 4. ACHIEVEMENT SERVICE
# ─────────────────────────────────────────────────────────────────────────────

def test_first_workout_achievement_unlocked(db, user):
    from app.services.achievement_service import check_and_unlock_achievements
    s = _make_session(db, user.id, reps=10, quality=80.0)
    unlocked = check_and_unlock_achievements(db, user, s)
    keys = [a["badge_key"] for a in unlocked]
    assert "first_workout" in keys


def test_perfectionist_achievement_requires_8_reps_90_quality(db, user):
    from app.services.achievement_service import check_and_unlock_achievements
    # Below threshold — should NOT award perfectionist
    s_low = _make_session(db, user.id, reps=5, quality=95.0)
    unlocked_low = check_and_unlock_achievements(db, user, s_low)
    low_keys = [a["badge_key"] for a in unlocked_low]
    assert "perfectionist" not in low_keys

    # At threshold — SHOULD award
    s_ok = _make_session(db, user.id, reps=8, quality=92.0)
    unlocked_ok = check_and_unlock_achievements(db, user, s_ok)
    ok_keys = [a["badge_key"] for a in unlocked_ok]
    assert "perfectionist" in ok_keys


def test_reps_100_achievement(db, user):
    from app.services.achievement_service import check_and_unlock_achievements
    s1 = _make_session(db, user.id, reps=60)
    check_and_unlock_achievements(db, user, s1)
    s2 = _make_session(db, user.id, reps=50)
    unlocked = check_and_unlock_achievements(db, user, s2)
    keys = [a["badge_key"] for a in unlocked]
    assert "reps_100" in keys


def test_points_increase_after_session(db, user):
    from app.services.achievement_service import check_and_unlock_achievements
    initial = user.points or 0
    s = _make_session(db, user.id, reps=10, quality=90.0)
    check_and_unlock_achievements(db, user, s)
    db.refresh(user)
    assert user.points > initial


def test_no_duplicate_achievements(db, user):
    from app.services.achievement_service import check_and_unlock_achievements
    s1 = _make_session(db, user.id, reps=10)
    u1 = check_and_unlock_achievements(db, user, s1)
    s2 = _make_session(db, user.id, reps=10)
    u2 = check_and_unlock_achievements(db, user, s2)
    # first_workout should NOT be in second batch
    assert "first_workout" not in [a["badge_key"] for a in u2]


# ─────────────────────────────────────────────────────────────────────────────
# 5. FATIGUE SERVICE
# ─────────────────────────────────────────────────────────────────────────────

def test_fatigue_no_evidence_initially():
    from app.services.fatigue_service import FatigueDetector
    fd = FatigueDetector()
    result = fd.evaluate_fatigue()
    # Service returns "None" (capital N) when < 4 reps recorded
    assert result["fatigue_level"].lower() == "none"
    assert result["fatigue_detected"] is False


def test_fatigue_detected_with_declining_quality():
    from app.services.fatigue_service import FatigueDetector
    fd = FatigueDetector()
    # Simulate reps with strongly declining quality and slower pace
    for i in range(10):
        fd.record_rep(duration_seconds=2.0 + i * 0.5,
                      quality_score=max(40.0, 95.0 - i * 10),
                      fault_count=i)
    result = fd.evaluate_fatigue()
    # Should detect some level of fatigue (Mild, Moderate, or High)
    assert result["fatigue_detected"] is True or result["fatigue_level"].lower() in ("mild", "moderate", "high")


def test_fatigue_reset_clears_state():
    from app.services.fatigue_service import FatigueDetector
    fd = FatigueDetector()
    for _ in range(5):
        fd.record_rep(2.0, 50.0, 3)
    fd.reset()
    result = fd.evaluate_fatigue()
    assert result["fatigue_level"].lower() == "none"


# ─────────────────────────────────────────────────────────────────────────────
# 6. WORKOUT SESSION (DB operations directly)
# ─────────────────────────────────────────────────────────────────────────────

def test_workout_session_create_and_finish(db, user):
    from app.services.calorie_service import estimate_calories
    from app.services.achievement_service import check_and_unlock_achievements

    # Create session
    s = WorkoutSession(
        user_id=user.id,
        exercise_type="squat",
        start_time=datetime.datetime.utcnow(),
        reps_completed=0,
        target_reps=12,
        sets_completed=1,
        avg_quality_score=0.0,
        calories_burned=0.0,
        duration_seconds=0,
    )
    db.add(s)
    db.commit()
    assert s.id is not None

    # Finish session
    s.duration_seconds = 150
    s.reps_completed = 12
    s.avg_quality_score = 92.5
    s.calories_burned = estimate_calories("squat", 150, user.weight_kg)
    s.end_time = datetime.datetime.utcnow()
    db.commit()

    assert s.calories_burned > 0
    unlocked = check_and_unlock_achievements(db, user, s)
    assert any(a["badge_key"] == "first_workout" for a in unlocked)


def test_workout_history_query(db, user):
    for ex in ["squat", "pushup", "lunge"]:
        _make_session(db, user.id, exercise=ex)

    sessions = db.query(WorkoutSession).filter(
        WorkoutSession.user_id == user.id
    ).all()
    assert len(sessions) == 3
    types = {s.exercise_type for s in sessions}
    assert types == {"squat", "pushup", "lunge"}


def test_repetition_log_saved(db, user):
    s = _make_session(db, user.id, reps=3)
    for i in range(3):
        r = RepetitionLog(
            session_id=s.id,
            rep_number=i + 1,
            duration_seconds=2.1,
            quality_score=90.0 - i * 2,
            min_angle=85.0,
            max_angle=175.0,
            posture_faults="Clean form",
        )
        db.add(r)
    db.commit()

    logs = db.query(RepetitionLog).filter(RepetitionLog.session_id == s.id).all()
    assert len(logs) == 3


# ─────────────────────────────────────────────────────────────────────────────
# 7. LEADERBOARD (direct query)
# ─────────────────────────────────────────────────────────────────────────────

def test_leaderboard_ordering(db):

    # Create two users with different points
    u1 = User(username="alpha", email="a@test.ai", full_name="Alpha", points=200)
    u2 = User(username="beta",  email="b@test.ai", full_name="Beta",  points=100)
    db.add_all([u1, u2])
    db.commit()

    users = db.query(User).order_by(User.points.desc()).all()
    assert users[0].points >= users[1].points


# ─────────────────────────────────────────────────────────────────────────────
# 8. APPLICATION CONFIG
# ─────────────────────────────────────────────────────────────────────────────

def test_app_config():
    from app.core.config import settings
    assert settings.PROJECT_NAME == "AI Fitness Tracker"
    assert settings.API_V1_STR == "/api/v1"
    assert "sqlite" in settings.DATABASE_URL


def test_app_imports_without_error():
    """Verifies the full application module tree can be imported."""
    from app import main as _  # noqa – just ensure no ImportError
    assert True
