import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class LungeDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Lunges")
        self.front_knee_filter = AngleFilter(alpha=0.4)
        self.torso_filter = AngleFilter(alpha=0.4)
        self.min_knee_angle_in_rep = 180.0
        self.stage = "UP"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand in frame for lunges", "warning")

        # Measure both knees to identify front bending knee
        l_hip = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_HIP)
        l_knee = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_KNEE)
        l_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_ANKLE)
        l_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_SHOULDER)

        r_hip = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_HIP)
        r_knee = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_KNEE)
        r_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_ANKLE)
        r_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_SHOULDER)

        l_knee_angle = calculate_angle_2d(l_hip, l_knee, l_ankle)
        r_knee_angle = calculate_angle_2d(r_hip, r_knee, r_ankle)

        # The front working knee is the one experiencing deeper flexion
        is_left_front = l_knee_angle < r_knee_angle
        active_knee_raw = l_knee_angle if is_left_front else r_knee_angle
        active_hip = l_hip if is_left_front else r_hip
        active_knee = l_knee if is_left_front else r_knee
        active_ankle = l_ankle if is_left_front else r_ankle
        active_shoulder = l_shoulder if is_left_front else r_shoulder

        knee_angle = self.front_knee_filter.update(active_knee_raw)
        torso_angle = self.torso_filter.update(calculate_angle_2d(active_shoulder, active_hip, active_knee))

        self.angles = {
            "front_knee_angle": knee_angle,
            "torso_angle": torso_angle
        }

        if knee_angle < self.min_knee_angle_in_rep:
            self.min_knee_angle_in_rep = knee_angle

        torso_lean_fault = False
        if knee_angle < 120 and torso_angle < 65:
            torso_lean_fault = True
            if "Excessive forward torso lean" not in self.rep_fault_reasons:
                self.rep_fault_reasons.append("Excessive forward torso lean")

        feedback = self.feedback_message
        status = "good"

        # Standing upright: both knees > 155
        # Lunge bottom: active knee <= 100
        if knee_angle > 155 and (l_knee_angle > 150 and r_knee_angle > 150):
            if self.stage == "DOWN":
                now = time.time()
                rep_duration = max(0.5, now - self.rep_start_time)
                self.reps += 1

                score = 100.0
                if self.min_knee_angle_in_rep > 95:
                    score -= (self.min_knee_angle_in_rep - 95) * 1.2
                if "Excessive forward torso lean" in self.rep_fault_reasons:
                    score -= 15.0

                score = max(50.0, min(100.0, score))
                self.current_quality_score = round(score, 1)

                fault_str = ", ".join(self.rep_fault_reasons) if self.rep_fault_reasons else "Clean form"
                self.rep_durations.append(rep_duration)
                self.rep_scores.append(self.current_quality_score)
                self.rep_faults.append(fault_str)

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": self.current_quality_score,
                    "min_knee_angle": self.min_knee_angle_in_rep,
                    "faults": fault_str
                }

                feedback = "Great lunge! Powerful drive back to standing."
                status = "good"
                self.stage = "UP"
                self.min_knee_angle_in_rep = 180.0
                self.rep_fault_reasons = []
                self.rep_start_time = now

            elif self.stage == "DESCENDING":
                feedback = "Lunge deeper! Lower front thigh parallel to ground."
                status = "warning"
                self.stage = "UP"
                self.min_knee_angle_in_rep = 180.0
                self.rep_fault_reasons = []
            else:
                self.stage = "UP"
                feedback = "Standing ready. Step forward into lunge."
                status = "good"

        elif knee_angle <= 100:
            self.stage = "DOWN"
            if torso_lean_fault:
                feedback = "Keep your chest high and torso vertical!"
                status = "bad"
            else:
                feedback = "90 degree depth reached! Push back to start."
                status = "good"

        elif knee_angle <= 140:
            if self.stage != "DOWN":
                self.stage = "DESCENDING"
            feedback = "Lowering into lunge..."
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
