import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class MountainClimbersDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Mountain Climbers")
        self.l_knee_filter = AngleFilter(alpha=0.5)
        self.r_knee_filter = AngleFilter(alpha=0.5)
        self.active_leg = "NONE" # "LEFT", "RIGHT"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Position in push-up plank for mountain climbers", "warning")

        l_hip = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_HIP)
        l_knee = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_KNEE)
        l_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_ANKLE)

        r_hip = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_HIP)
        r_knee = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_KNEE)
        r_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_ANKLE)

        l_shoulder = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_SHOULDER)

        l_angle = self.l_knee_filter.update(calculate_angle_2d(l_hip, l_knee, l_ankle))
        r_angle = self.r_knee_filter.update(calculate_angle_2d(r_hip, r_knee, r_ankle))

        self.angles = {
            "left_knee_angle": l_angle,
            "right_knee_angle": r_angle
        }

        # Check hip pike (hip y vs shoulder y)
        hip_pike = l_hip[1] < l_shoulder[1] - 0.05

        feedback = self.feedback_message
        status = "good"

        # Drive condition: knee <= 80 deg while other leg is > 140 deg
        if l_angle <= 80 and r_angle >= 135:
            if self.active_leg != "LEFT":
                now = time.time()
                rep_duration = max(0.2, now - self.rep_start_time)
                self.reps += 1
                self.active_leg = "LEFT"

                score = 95.0
                if hip_pike:
                    score -= 15.0

                self.current_quality_score = score
                self.rep_durations.append(rep_duration)
                self.rep_scores.append(score)
                self.rep_faults.append("Hips high" if hip_pike else "Clean drive")

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": score,
                    "faults": "Hips high" if hip_pike else "Clean drive"
                }

                feedback = "Great drive! Switch legs quickly."
                status = "good"
                self.rep_start_time = now

        elif r_angle <= 80 and l_angle >= 135:
            if self.active_leg != "RIGHT":
                now = time.time()
                rep_duration = max(0.2, now - self.rep_start_time)
                self.reps += 1
                self.active_leg = "RIGHT"

                score = 95.0
                if hip_pike:
                    score -= 15.0

                self.current_quality_score = score
                self.rep_durations.append(rep_duration)
                self.rep_scores.append(score)
                self.rep_faults.append("Hips high" if hip_pike else "Clean drive")

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": score,
                    "faults": "Hips high" if hip_pike else "Clean drive"
                }

                feedback = "Sharp knee drive! Keep pace."
                status = "good"
                self.rep_start_time = now

        elif hip_pike:
            feedback = "Keep hips level with shoulders! Don't pike."
            status = "warning"

        self.feedback_message = feedback
        self.feedback_status = status
        return self._build_response(self.current_quality_score, feedback, status)

    def _build_response(self, score: float, message: str, status: str) -> Dict[str, Any]:
        return {
            "exercise": self.name,
            "reps": self.reps,
            "stage": self.active_leg,
            "quality_score": round(score, 1),
            "angles": self.angles,
            "feedback": message,
            "status": status,
            "duration_seconds": int(self.get_elapsed_seconds()),
            "last_rep": self.last_rep_data
        }
