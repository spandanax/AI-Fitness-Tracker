import pytest
from app.exercises.squat import SquatDetector

def make_landmark(x, y, visibility=0.9):
    return {"x": x, "y": y, "z": 0.0, "visibility": visibility}

def build_pose_landmarks(hip=(0.5, 0.5), knee=(0.5, 0.75), ankle=(0.5, 0.95), shoulder=(0.5, 0.25)):
    landmarks = [make_landmark(0.5, 0.1) for _ in range(33)]
    # Left side: 11, 23, 25, 27
    landmarks[11] = make_landmark(*shoulder)
    landmarks[23] = make_landmark(*hip)
    landmarks[25] = make_landmark(*knee)
    landmarks[27] = make_landmark(*ankle)
    # Right side: 12, 24, 26, 28
    landmarks[12] = make_landmark(*shoulder)
    landmarks[24] = make_landmark(*hip)
    landmarks[26] = make_landmark(*knee)
    landmarks[28] = make_landmark(*ankle)
    return landmarks

def test_squat_initial_state():
    detector = SquatDetector()
    assert detector.reps == 0
    assert detector.stage == "UP"

def test_squat_full_repetition():
    detector = SquatDetector()

    # Standing: Hip (0.5, 0.5), Knee (0.5, 0.75), Ankle (0.5, 0.95) -> straight line (180 deg)
    standing = build_pose_landmarks(
        hip=(0.5, 0.5),
        knee=(0.5, 0.75),
        ankle=(0.5, 0.95),
        shoulder=(0.5, 0.2)
    )
    # Process several standing frames to stabilize filter
    for _ in range(5):
        res = detector.process_frame(standing)
    assert detector.stage == "UP"
    assert detector.reps == 0

    # Squat Down: Hip lowers to (0.5, 0.72), Knee bends forward to (0.68, 0.74), Ankle (0.5, 0.95)
    # This creates a ~90 degree knee angle
    squatting_down = build_pose_landmarks(
        hip=(0.5, 0.72),
        knee=(0.68, 0.74),
        ankle=(0.5, 0.95),
        shoulder=(0.52, 0.38)
    )
    for _ in range(5):
        res = detector.process_frame(squatting_down)
    assert detector.stage == "DOWN"
    assert detector.reps == 0

    # Stand back up: Knee straightens to 180 deg
    for _ in range(5):
        res = detector.process_frame(standing)
    assert detector.stage == "UP"
    assert detector.reps == 1
    assert res["reps"] == 1
    assert res["quality_score"] > 80.0

def test_squat_partial_rep_not_counted():
    detector = SquatDetector()
    standing = build_pose_landmarks(hip=(0.5, 0.5), knee=(0.5, 0.75), ankle=(0.5, 0.95))
    for _ in range(5):
        detector.process_frame(standing)

    # Shallow squat (e.g. 130 deg knee angle)
    shallow = build_pose_landmarks(hip=(0.5, 0.58), knee=(0.58, 0.76), ankle=(0.5, 0.95))
    for _ in range(6):
        detector.process_frame(shallow)

    # Return up
    for _ in range(5):
        res = detector.process_frame(standing)

    # Shallow rep should NOT be counted as a completed rep
    assert detector.reps == 0
    assert "Squat deeper" in res["feedback"]
