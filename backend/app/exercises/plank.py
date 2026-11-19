import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class PlankDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Plank")
        self.body_filter = AngleFilter(alpha=0.3)
        self.hold_seconds: float = 0.0
        self.last_valid_timestamp: Optional[float] = None
        self.stage = "HOLDING"

    def reset(self):
        super().reset()
        self.hold_seconds = 0.0
        self.last_valid_timestamp = None
        self.stage = "HOLDING"

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            self.last_valid_timestamp = None
            return self._build_response(100.0, "Position into a forearm or palm plank", "warning")

        left_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_SHOULDER) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_HIP) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_ANKLE)) / 3.0

        right_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_SHOULDER) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_HIP) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_ANKLE)) / 3.0

        if left_vis < 0.4 and right_vis < 0.4:
            self.last_valid_timestamp = None
            return self._build_response(self.current_quality_score, "Position side profile for full plank visibility", "warning")

        use_left = left_vis >= right_vis
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP
        ankle_idx = LandmarkIndex.LEFT_ANKLE if use_left else LandmarkIndex.RIGHT_ANKLE

        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)
        p_hip = self.get_landmark_pt(landmarks, hip_idx)
        p_ankle = self.get_landmark_pt(landmarks, ankle_idx)

        # Body alignment angle: Shoulder - Hip - Ankle
        raw_body_angle = calculate_angle_2d(p_shoulder, p_hip, p_ankle)
        body_angle = self.body_filter.update(raw_body_angle)

        # Check horizontal orientation (plank is roughly horizontal)
        # Difference between shoulder y and hip/ankle y
        is_horizontal = abs(p_shoulder[1] - p_ankle[1]) < 0.45

        self.angles = {
            "body_angle": body_angle,
            "alignment": round(body_angle, 1)
        }

        now = time.time()
        feedback = self.feedback_message
        status = "good"

        # Valid plank form: body angle between 160 and 180 degrees
        # Hips too high (pike): hip is above shoulder and ankle (y is smaller)
        # Hips sagging: hip is below shoulder and ankle (y is larger)
        is_piking = body_angle < 155 and p_hip[1] < p_shoulder[1]
        is_sagging = body_angle < 155 and p_hip[1] > p_shoulder[1]

        if is_horizontal and 155 <= body_angle <= 180 and not is_piking and not is_sagging:
            # Active valid plank hold
            self.stage = "HOLDING"
            if self.last_valid_timestamp is not None:
                delta = min(0.5, now - self.last_valid_timestamp)
                self.hold_seconds += delta
                self.reps = int(self.hold_seconds)
            self.last_valid_timestamp = now

            self.current_quality_score = 95.0
            feedback = f"Great plank form! Holding steady: {int(self.hold_seconds)}s"
            status = "good"

        else:
            self.last_valid_timestamp = None
            self.stage = "PAUSED"

            if not is_horizontal:
                feedback = "Get down into horizontal plank position."
                status = "warning"
                self.current_quality_score = max(50.0, self.current_quality_score - 1.0)
            elif is_piking:
                feedback = "Hips are too high! Lower hips into a straight line."
                status = "bad"
                self.current_quality_score = max(60.0, self.current_quality_score - 0.5)
            elif is_sagging:
                feedback = "Don't sag your hips! Squeeze glutes and core."
                status = "bad"
                self.current_quality_score = max(60.0, self.current_quality_score - 0.5)
            else:
                feedback = "Maintain straight body alignment from shoulders to heels."
                status = "warning"

        self.feedback_message = feedback
        self.feedback_status = status
        return self._build_response(self.current_quality_score, feedback, status)

    def _build_response(self, score: float, message: str, status: str) -> Dict[str, Any]:
        return {
            "exercise": self.name,
            "reps": int(self.hold_seconds), # For plank, reps reflects hold duration in seconds
            "hold_seconds": int(self.hold_seconds),
            "stage": self.stage,
            "quality_score": round(score, 1),
            "angles": self.angles,
            "feedback": message,
            "status": status,
            "duration_seconds": int(self.get_elapsed_seconds()),
            "last_rep": {
                "hold_seconds": int(self.hold_seconds),
                "quality_score": round(score, 1)
            }
        }
