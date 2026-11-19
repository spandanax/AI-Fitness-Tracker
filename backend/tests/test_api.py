import pytest
import httpx
from app.main import app

@pytest.fixture
def anyio_backend():
    return "asyncio"

@pytest.mark.anyio
async def test_root_and_health():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/")
        assert res.status_code == 200
        assert "AI Fitness Tracker" in res.json()["message"]

        res_h = await client.get("/health")
        assert res_h.status_code == 200
        assert res_h.json()["status"] == "healthy"

@pytest.mark.anyio
async def test_exercises_catalog():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/exercises/")
        assert res.status_code == 200
        catalog = res.json()
        assert len(catalog) == 13
        assert any(ex["id"] == "squat" for ex in catalog)
        assert any(ex["id"] == "plank" for ex in catalog)
        assert any(ex["id"] == "bicep_curls" for ex in catalog)

@pytest.mark.anyio
async def test_user_profile():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/api/v1/users/1")
        assert res.status_code == 200
        user = res.json()
        assert user["id"] == 1
        assert "weight_kg" in user

@pytest.mark.anyio
async def test_workout_lifecycle():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Start workout
        start_payload = {
            "user_id": 1,
            "exercise_type": "squat",
            "target_reps": 12
        }
        res_start = await client.post("/api/v1/workouts/start", json=start_payload)
        assert res_start.status_code == 200
        session_data = res_start.json()
        session_id = session_data["id"]
        assert session_id > 0

        # 2. Finish workout
        finish_payload = {
            "duration_seconds": 120,
            "reps_completed": 12,
            "sets_completed": 1,
            "avg_quality_score": 92.5,
            "fatigue_detected": False,
            "feedback_summary": "Great session with solid depth",
            "reps": [
                {
                    "rep_number": i + 1,
                    "duration_seconds": 2.1,
                    "quality_score": 93.0,
                    "min_angle": 88.0,
                    "max_angle": 175.0,
                    "posture_faults": "Clean form"
                }
                for i in range(12)
            ]
        }
        res_finish = await client.post(f"/api/v1/workouts/{session_id}/finish", json=finish_payload)
        assert res_finish.status_code == 200
        finish_res = res_finish.json()
        assert finish_res["calories_burned"] > 0
        assert finish_res["total_user_points"] > 0

        # 3. Check workout history
        res_history = await client.get("/api/v1/workouts/?user_id=1")
        assert res_history.status_code == 200
        history = res_history.json()
        assert len(history) > 0

@pytest.mark.anyio
async def test_analytics_and_leaderboard():
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # Analytics
        res_an = await client.get("/api/v1/analytics/1")
        assert res_an.status_code == 200
        an_data = res_an.json()
        assert an_data["total_workouts"] >= 1
        assert "weekly_activity" in an_data
        assert len(an_data["weekly_activity"]) == 7

        # Leaderboard
        res_lb = await client.get("/api/v1/leaderboard/")
        assert res_lb.status_code == 200
        lb_data = res_lb.json()
        assert len(lb_data) >= 1
        assert lb_data[0]["rank"] == 1
        assert lb_data[0]["points"] > 0

        # Achievements
        res_ach = await client.get("/api/v1/achievements/1")
        assert res_ach.status_code == 200
        ach_data = res_ach.json()
        assert len(ach_data) >= 5
