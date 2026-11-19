import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class ShoulderPressDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Shoulder Press")
        self.elbow_filter = AngleFilter(alpha=0.4)
        self.max_elbow_angle_in_rep = 0.0
        self.stage = "DOWN"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Position yourself for overhead press", "warning")

        l_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_SHOULDER) +
                 self.get_visibility(landmarks, LandmarkIndex.LEFT_ELBOW) +
                 self.get_visibility(landmarks, LandmarkIndex.LEFT_WRIST)) / 3.0

        r_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_SHOULDER) +
                 self.get_visibility(landmarks, LandmarkIndex.RIGHT_ELBOW) +
                 self.get_visibility(landmarks, LandmarkIndex.RIGHT_WRIST)) / 3.0

        if l_vis < 0.4 and r_vis < 0.4:
            return self._build_response(self.current_quality_score, "Ensure arms and shoulders are visible", "warning")

        use_left = l_vis >= r_vis
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER
        elbow_idx = LandmarkIndex.LEFT_ELBOW if use_left else LandmarkIndex.RIGHT_ELBOW
        wrist_idx = LandmarkIndex.LEFT_WRIST if use_left else LandmarkIndex.RIGHT_WRIST
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP

        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)
        p_elbow = self.get_landmark_pt(landmarks, elbow_idx)
        p_wrist = self.get_landmark_pt(landmarks, wrist_idx)
        p_hip = self.get_landmark_pt(landmarks, hip_idx)

        raw_elbow = calculate_angle_2d(p_shoulder, p_elbow, p_wrist)
        raw_torso = calculate_angle_2d(p_elbow, p_shoulder, p_hip)

        elbow_angle = self.elbow_filter.update(raw_elbow)

        self.angles = {
            "elbow_angle": elbow_angle,
            "shoulder_angle": raw_torso
        }

        if elbow_angle > self.max_elbow_angle_in_rep:
            self.max_elbow_angle_in_rep = elbow_angle

        # Check back arching / torso lean
        torso_fault = raw_torso > 165 and p_wrist[1] < p_shoulder[1]

        feedback = self.feedback_message
        status = "good"

        # DOWN: elbow <= 95
        # UP: elbow >= 155 and wrist above shoulder
        if elbow_angle >= 155 and p_wrist[1] < p_shoulder[1]:
            if self.stage == "PRESSING":
                self.stage = "UP"
                feedback = "Lockout overhead! Now lower to ear height."
                status = "good"
            elif self.stage != "UP":
                self.stage = "UP"

        elif elbow_angle <= 95:
            if self.stage == "UP":
                now = time.time()
                rep_duration = max(0.4, now - self.rep_start_time)
                self.reps += 1

                score = 100.0
                if self.max_elbow_angle_in_rep < 160:
                    score -= (160 - self.max_elbow_angle_in_rep) * 1.2
                if torso_fault:
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
                    "max_elbow_angle": self.max_elbow_angle_in_rep,
                    "faults": fault_str
                }

                feedback = "Great press! Full range of motion."
                status = "good"
                self.stage = "DOWN"
                self.max_elbow_angle_in_rep = 0.0
                self.rep_fault_reasons = []
                self.rep_start_time = now

            elif self.stage == "DESCENDING":
                self.stage = "DOWN"
                feedback = "Good depth at shoulders. Press overhead."
                status = "good"
            else:
                self.stage = "DOWN"
                feedback = "Weights loaded at shoulders. Press vertically."
                status = "good"

        elif elbow_angle > 105:
            if self.stage == "DOWN":
                self.stage = "PRESSING"
            elif self.stage == "UP":
                self.stage = "DESCENDING"
            feedback = "Pressing overhead..."
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
