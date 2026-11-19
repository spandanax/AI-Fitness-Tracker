import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class CalfRaisesDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Calf Raises")
        self.ankle_filter = AngleFilter(alpha=0.4)
        self.max_elevation_in_rep = 0.0
        self.baseline_heel_y = None
        self.stage = "DOWN"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand in frame for calf raises", "warning")

        l_knee = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_KNEE)
        l_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_ANKLE)
        l_foot = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_FOOT_INDEX)
        l_heel = self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_HEEL)

        r_knee = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_KNEE)
        r_ankle = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_ANKLE)
        r_foot = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_FOOT_INDEX)
        r_heel = self.get_landmark_pt(landmarks, LandmarkIndex.RIGHT_HEEL)

        # Ankle plantarflexion angle: Knee -> Ankle -> Foot Index
        raw_ankle_l = calculate_angle_2d(l_knee, l_ankle, l_foot)
        raw_ankle_r = calculate_angle_2d(r_knee, r_ankle, r_foot)
        ankle_angle = self.ankle_filter.update((raw_ankle_l + raw_ankle_r) / 2.0)

        # Average heel lift relative to toe
        avg_heel_y = (l_heel[1] + r_heel[1]) / 2.0
        avg_toe_y = (l_foot[1] + r_foot[1]) / 2.0
        heel_lift = avg_toe_y - avg_heel_y # Positive when heel is lifted above toe level

        self.angles = {
            "ankle_angle": ankle_angle,
            "heel_lift": round(heel_lift * 100.0, 1)
        }

        # Check knee bending (calf raises should maintain extended knees)
        knee_angle = calculate_angle_2d(
            self.get_landmark_pt(landmarks, LandmarkIndex.LEFT_HIP),
            l_knee,
            l_ankle
        )
        knee_bend_fault = knee_angle < 150
        if knee_bend_fault and "Bending knees instead of calves" not in self.rep_fault_reasons:
            self.rep_fault_reasons.append("Bending knees instead of calves")

        feedback = self.feedback_message
        status = "good"

        # UP (Full calf raise): ankle angle opens > 140 or heel_lift > 0.04
        # DOWN (Flat): ankle angle <= 125 or heel_lift <= 0.01
        if ankle_angle >= 138 or heel_lift >= 0.035:
            self.stage = "UP"
            if knee_bend_fault:
                feedback = "Keep your legs straight! Don't bend knees."
                status = "warning"
            else:
                feedback = "High on your toes! Squeeze calves at top."
                status = "good"

        elif ankle_angle <= 122 or heel_lift <= 0.01:
            if self.stage == "UP":
                now = time.time()
                rep_duration = max(0.4, now - self.rep_start_time)
                self.reps += 1

                score = 100.0
                if "Bending knees instead of calves" in self.rep_fault_reasons:
                    score -= 20.0

                score = max(50.0, min(100.0, score))
                self.current_quality_score = round(score, 1)

                fault_str = ", ".join(self.rep_fault_reasons) if self.rep_fault_reasons else "Clean extension"
                self.rep_durations.append(rep_duration)
                self.rep_scores.append(self.current_quality_score)
                self.rep_faults.append(fault_str)

                self.last_rep_data = {
                    "rep_number": self.reps,
                    "duration": round(rep_duration, 2),
                    "score": self.current_quality_score,
                    "faults": fault_str
                }

                feedback = "Great rep! Lower heels slowly to ground."
                status = "good"
                self.stage = "DOWN"
                self.rep_fault_reasons = []
                self.rep_start_time = now
            else:
                self.stage = "DOWN"
                feedback = "Heels flat. Press up through balls of feet."
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
