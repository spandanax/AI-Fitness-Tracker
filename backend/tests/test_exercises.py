import pytest
from app.exercises import EXERCISE_REGISTRY, get_exercise_detector
from tests.test_squat import build_pose_landmarks

def test_exercise_registry_all_13_present():
    assert len(EXERCISE_REGISTRY) == 13
    expected_exercises = [
        "squat", "pushup", "pullup", "dip", "lunge",
        "jumping_jacks", "plank", "bicep_curls", "shoulder_press",
        "mountain_climbers", "crunches", "burpees", "calf_raises"
    ]
    for ex in expected_exercises:
        assert ex in EXERCISE_REGISTRY

@pytest.mark.parametrize("exercise_key", list(EXERCISE_REGISTRY.keys()))
def test_all_exercises_process_valid_frame(exercise_key):
    detector = get_exercise_detector(exercise_key)
    landmarks = build_pose_landmarks()
    
    # Process several frames
    for _ in range(3):
        res = detector.process_frame(landmarks)
        
    assert res is not None
    assert "exercise" in res
    assert "reps" in res
    assert "quality_score" in res
    assert "feedback" in res
    assert "status" in res
    assert "angles" in res

@pytest.mark.parametrize("exercise_key", list(EXERCISE_REGISTRY.keys()))
def test_all_exercises_handle_empty_landmarks(exercise_key):
    detector = get_exercise_detector(exercise_key)
    res = detector.process_frame([])
    assert res is not None
    assert "status" in res
    assert res["status"] in ["warning", "bad"]

def test_plank_hold_duration():
    detector = get_exercise_detector("plank")
    # Lying horizontally
    plank_landmarks = build_pose_landmarks(
        shoulder=(0.3, 0.5),
        hip=(0.55, 0.5),
        knee=(0.75, 0.5),
        ankle=(0.9, 0.5)
    )
    for _ in range(5):
        res = detector.process_frame(plank_landmarks)
    assert "hold_seconds" in res
    assert res["status"] == "good"
