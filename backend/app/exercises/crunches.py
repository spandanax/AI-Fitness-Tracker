import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class CrunchesDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Crunches")
        self.hip_angle_filter = AngleFilter(alpha=0.4)
        self.min_hip_angle_in_rep = 180.0
        self.stage = "DOWN"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Lie down in frame for crunches", "warning")

        l_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_SHOULDER) +
                 self.get_visibility(landmarks, LandmarkIndex.LEFT_HIP) +
                 self.get_visibility(landmarks, LandmarkIndex.LEFT_KNEE)) / 3.0

        r_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_SHOULDER) +
                 self.get_visibility(landmarks, LandmarkIndex.RIGHT_HIP) +
                 self.get_visibility(landmarks, LandmarkIndex.RIGHT_KNEE)) / 3.0

        use_left = l_vis >= r_vis
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP
        knee_idx = LandmarkIndex.LEFT_KNEE if use_left else LandmarkIndex.RIGHT_KNEE

        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)
        p_hip = self.get_landmark_pt(landmarks, hip_idx)
        p_knee = self.get_landmark_pt(landmarks, knee_idx)

        raw_hip = calculate_angle_2d(p_shoulder, p_hip, p_knee)
        hip_angle = self.hip_angle_filter.update(raw_hip)

        self.angles = {"torso_curl_angle": hip_angle}

        if hip_angle < self.min_hip_angle_in_rep:
            self.min_hip_angle_in_rep = hip_angle

        feedback = self.feedback_message
        status = "good"

        # DOWN: hip_angle > 125
        # UP (Crunch): hip_angle <= 90
        if hip_angle > 125:
            if self.stage == "UP":
                now = time.time()
                rep_duration = max(0.4, now - self.rep_start_time)
                self.reps += 1

                score = 100.0
                if self.min_hip_angle_in_rep > 85:
                    score -= (self.min_hip_angle_in_rep - 85) * 1.2

                score = max(55.0, min(100.0, score))
                self.current_quality_score = round(score, 1)

                self.rep_durations.append(rep_duration)
                self.rep_scores.append(self.current_quality_score)
                self.rep_faults.append("Good contraction")

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": self.current_quality_score,
                    "min_hip_angle": self.min_hip_angle_in_rep,
                    "faults": "Good contraction"
                }

                feedback = "Great crunch! Squeeze core and lower slowly."
                status = "good"
                self.stage = "DOWN"
                self.min_hip_angle_in_rep = 180.0
                self.rep_start_time = now

            elif self.stage == "CRUNCHING":
                feedback = "Crunch higher! Lift shoulder blades off ground."
                status = "warning"
                self.stage = "DOWN"
                self.min_hip_angle_in_rep = 180.0
            else:
                self.stage = "DOWN"
                feedback = "Lying flat. Curl upward using abs."
                status = "good"

        elif hip_angle <= 90:
            self.stage = "UP"
            feedback = "Peak crunch! Hold for a split second."
            status = "good"

        elif hip_angle <= 115:
            if self.stage != "UP":
                self.stage = "CRUNCHING"
            feedback = "Curling up..."
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
