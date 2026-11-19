import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, calculate_distance_2d, AngleFilter

class BurpeesDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Burpees")
        self.stage = "STAND" # "STAND", "PLANK", "JUMP"
        self.knee_filter = AngleFilter(alpha=0.4)
        self.hit_plank = False

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand in frame for burpees", "warning")

        p_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_SHOULDER)
        p_hip = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_HIP)
        p_knee = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_KNEE)
        p_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_ANKLE)
        p_wrist = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_WRIST)
        p_nose = self.get_landmark_pt(landmarks, LandmarkIndex.NOSE)

        knee_angle = self.knee_filter.update(calculate_angle_2d(p_hip, p_knee, p_ankle))
        
        # Horizontal plank condition: shoulder y close to hip y, and hands near ground
        is_horizontal = abs(p_shoulder[1] - p_hip[1]) < 0.25 and p_shoulder[1] > 0.5
        is_standing = knee_angle > 150 and p_shoulder[1] < 0.45
        is_jumping = is_standing and p_wrist[1] < p_nose[1]

        self.angles = {
            "knee_angle": knee_angle,
            "horizontal_drift": round(abs(p_shoulder[1] - p_hip[1]), 2)
        }

        feedback = self.feedback_message
        status = "good"

        if is_horizontal:
            self.stage = "PLANK"
            self.hit_plank = True
            feedback = "Good plank drop! Now jump feet forward and explode up."
            status = "good"

        elif (is_standing or is_jumping) and self.hit_plank:
            now = time.time()
            rep_duration = max(0.8, now - self.rep_start_time)
            self.reps += 1

            score = 95.0
            if not is_jumping:
                score -= 10.0 # Didn't do overhead jump

            self.current_quality_score = score
            self.rep_durations.append(rep_duration)
            self.rep_scores.append(score)
            self.rep_faults.append("Full jump" if is_jumping else "Low jump")

            self.last_rep_data = {
                "rep_number": self.reps,
                "duration": round(rep_duration, 2),
                "score": score,
                "faults": "Full jump" if is_jumping else "Low jump"
            }

            feedback = "Explosive burpee! Drop right back down."
            status = "good"
            self.stage = "STAND"
            self.hit_plank = False
            self.rep_start_time = now

        elif is_standing and not self.hit_plank:
            self.stage = "STAND"
            feedback = "Standing ready. Drop chest to floor."
            status = "good"

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
