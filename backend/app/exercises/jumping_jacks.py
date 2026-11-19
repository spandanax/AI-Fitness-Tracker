import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_distance_2d, AngleFilter

class JumpingJacksDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Jumping Jacks")
        self.stage = "CLOSED" # "CLOSED" or "OPEN"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand in frame for jumping jacks", "warning")

        p_l_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_SHOULDER)
        p_r_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_SHOULDER)
        p_l_wrist = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_WRIST)
        p_r_wrist = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_WRIST)
        p_l_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_ANKLE)
        p_r_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_ANKLE)
        p_nose = self.get_landmark_pt(landmarks, LandmarkIndex.NOSE)

        shoulder_width = calculate_distance_2d(p_l_shoulder, p_r_shoulder)
        if shoulder_width < 0.05:
            shoulder_width = 0.2

        feet_spread = calculate_distance_2d(p_l_ankle, p_r_ankle) / shoulder_width
        hands_overhead = (p_l_wrist[1] < p_nose[1]) and (p_r_wrist[1] < p_nose[1])
        hands_at_sides = (p_l_wrist[1] > p_l_shoulder[1]) and (p_r_wrist[1] > p_r_shoulder[1])

        self.angles = {
            "feet_spread_ratio": round(feet_spread, 2),
            "hands_overhead": 1.0 if hands_overhead else 0.0
        }

        feedback = self.feedback_message
        status = "good"

        # OPEN: hands overhead and feet spread wide (> 1.3x shoulder width)
        # CLOSED: hands at sides and feet together (< 1.1x shoulder width)
        if hands_overhead and feet_spread >= 1.3:
            self.stage = "OPEN"
            feedback = "Full extension! Now return to start position."
            status = "good"

        elif hands_at_sides and feet_spread <= 1.1:
            if self.stage == "OPEN":
                now = time.time()
                rep_duration = max(0.3, now - self.rep_start_time)
                self.reps += 1

                score = 95.0
                if feet_spread > 0.9: # Feet could be closer
                    score -= 5.0

                self.current_quality_score = round(score, 1)
                self.rep_durations.append(rep_duration)
                self.rep_scores.append(self.current_quality_score)
                self.rep_faults.append("Good form")

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": self.current_quality_score,
                    "faults": "Good form"
                }

                feedback = "Great jack! Maintain steady rhythm."
                status = "good"
                self.stage = "CLOSED"
                self.rep_start_time = now
            else:
                self.stage = "CLOSED"
                feedback = "Ready. Jump feet wide and clap overhead."
                status = "good"

        elif self.stage == "CLOSED" and hands_overhead and feet_spread < 1.2:
            feedback = "Spread feet wider on your jump!"
            status = "warning"

        self.feedback_message = feedback
        self.feedback_status = status
        return self._build_response(self.current_quality_score, feedback, status)

    def _build_response(self, score: float, message: str, status: str) -> Dict[str, Any]:
        return {
            "exercise": self.name,
            "reps": self.reps,
            "stage": self.stage,
            "quality_score": round(score, 1),
            "angles": self.angles,
            "feedback": message,
            "status": status,
            "duration_seconds": int(self.get_elapsed_seconds()),
            "last_rep": self.last_rep_data
        }
