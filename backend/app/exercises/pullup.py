import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class PullupDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Pull-up")
        self.elbow_filter = AngleFilter(alpha=0.4)
        self.min_elbow_angle_in_rep = 180.0
        self.stage = "HANG"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand or hang in frame for pull-ups", "warning")

        left_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_SHOULDER) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_ELBOW) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_WRIST)) / 3.0

        right_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_SHOULDER) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_ELBOW) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_WRIST)) / 3.0

        if left_vis < 0.4 and right_vis < 0.4:
            return self._build_response(self.current_quality_score, "Ensure shoulders, elbows, and wrists are visible", "warning")

        use_left = left_vis >= right_vis
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER
        elbow_idx = LandmarkIndex.LEFT_ELBOW if use_left else LandmarkIndex.RIGHT_ELBOW
        wrist_idx = LandmarkIndex.LEFT_WRIST if use_left else LandmarkIndex.RIGHT_WRIST
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP

        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)
        p_elbow = self.get_landmark_pt(landmarks, elbow_idx)
        p_wrist = self.get_landmark_pt(landmarks, wrist_idx)
        p_hip = self.get_landmark_pt(landmarks, hip_idx)

        raw_elbow = calculate_angle_2d(p_shoulder, p_elbow, p_wrist)
        elbow_angle = self.elbow_filter.update(raw_elbow)

        self.angles = {"elbow_angle": elbow_angle}

        if elbow_angle < self.min_elbow_angle_in_rep:
            self.min_elbow_angle_in_rep = elbow_angle

        # Check body swing (hip x-distance vs shoulder x-distance)
        swing_fault = abs(p_hip[0] - p_shoulder[0]) > 0.16
        if swing_fault and "Excessive swinging" not in self.rep_fault_reasons:
            self.rep_fault_reasons.append("Excessive swinging")

        feedback = self.feedback_message
        status = "good"

        # Hang: elbow > 150
        # Peak pull: elbow <= 75
        if elbow_angle > 150:
            if self.stage == "TOP":
                now = time.time()
                rep_duration = max(0.5, now - self.rep_start_time)
                self.reps += 1

                score = 100.0
                if self.min_elbow_angle_in_rep > 70:
                    score -= (self.min_elbow_angle_in_rep - 70) * 1.5
                if "Excessive swinging" in self.rep_fault_reasons:
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
                    "min_elbow_angle": self.min_elbow_angle_in_rep,
                    "faults": fault_str
                }

                feedback = "Great pull-up! Controlled descent."
                status = "good"
                self.stage = "HANG"
                self.min_elbow_angle_in_rep = 180.0
                self.rep_fault_reasons = []
                self.rep_start_time = now

            elif self.stage == "PULLING":
                feedback = "Pull higher! Get chin over the bar."
                status = "warning"
                self.stage = "HANG"
                self.min_elbow_angle_in_rep = 180.0
                self.rep_fault_reasons = []
            else:
                self.stage = "HANG"
                feedback = "Deadhang position. Engage lats and pull upward."
                status = "good"

        elif elbow_angle <= 75:
            self.stage = "TOP"
            if swing_fault:
                feedback = "Hold steady at top! Eliminate swing."
                status = "warning"
            else:
                feedback = "Chin over bar! Lower slowly."
                status = "good"

        elif elbow_angle <= 130:
            if self.stage != "TOP":
                self.stage = "PULLING"
            feedback = "Pulling up strong..."
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
