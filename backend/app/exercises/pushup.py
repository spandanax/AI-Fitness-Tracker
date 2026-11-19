import time
from typing import List, Dict, Any
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class PushupDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Push-up")
        self.elbow_filter = AngleFilter(alpha=0.4)
        self.body_filter = AngleFilter(alpha=0.4)
        self.min_elbow_angle_in_rep = 180.0
        self.stage = "UP"
        self.rep_fault_reasons: List[str] = []

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Position yourself in push-up plank", "warning")

        left_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_SHOULDER) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_ELBOW) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_WRIST) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_HIP)) / 4.0

        right_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_SHOULDER) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_ELBOW) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_WRIST) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_HIP)) / 4.0

        if left_vis < 0.4 and right_vis < 0.4:
            return self._build_response(self.current_quality_score, "Ensure arms, shoulders, and hips are visible", "warning")

        use_left = left_vis >= right_vis
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER
        elbow_idx = LandmarkIndex.LEFT_ELBOW if use_left else LandmarkIndex.RIGHT_ELBOW
        wrist_idx = LandmarkIndex.LEFT_WRIST if use_left else LandmarkIndex.RIGHT_WRIST
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP
        ankle_idx = LandmarkIndex.LEFT_ANKLE if use_left else LandmarkIndex.RIGHT_ANKLE

        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)
        p_elbow = self.get_landmark_pt(landmarks, elbow_idx)
        p_wrist = self.get_landmark_pt(landmarks, wrist_idx)
        p_hip = self.get_landmark_pt(landmarks, hip_idx)
        p_ankle = self.get_landmark_pt(landmarks, ankle_idx)

        raw_elbow = calculate_angle_2d(p_shoulder, p_elbow, p_wrist)
        raw_body = calculate_angle_2d(p_shoulder, p_hip, p_ankle)

        elbow_angle = self.elbow_filter.update(raw_elbow)
        body_angle = self.body_filter.update(raw_body)

        self.angles = {
            "elbow_angle": elbow_angle,
            "body_angle": body_angle
        }

        if elbow_angle < self.min_elbow_angle_in_rep:
            self.min_elbow_angle_in_rep = elbow_angle

        # Posture alignment fault: Hip sagging or pike
        hip_fault = False
        if body_angle < 150:
            hip_fault = True
            if "Sagging or piked hips" not in self.rep_fault_reasons:
                self.rep_fault_reasons.append("Sagging or piked hips")

        feedback = self.feedback_message
        status = "good"

        if elbow_angle > 155:
            if self.stage == "DOWN":
                now = time.time()
                rep_duration = max(0.3, now - self.rep_start_time)

                self.reps += 1
                score = 100.0
                if self.min_elbow_angle_in_rep > 85:
                    score -= (self.min_elbow_angle_in_rep - 85) * 1.2
                if "Sagging or piked hips" in self.rep_fault_reasons:
                    score -= 20.0

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

                feedback = "Strong push-up! Full extension achieved."
                status = "good"
                self.stage = "UP"
                self.min_elbow_angle_in_rep = 180.0
                self.rep_fault_reasons = []
                self.rep_start_time = now

            elif self.stage == "DESCENDING":
                feedback = "Lower chest deeper! Aim for elbows at 90 degrees."
                status = "warning"
                self.stage = "UP"
                self.min_elbow_angle_in_rep = 180.0
                self.rep_fault_reasons = []
            else:
                self.stage = "UP"
                feedback = "Plank held. Lower your body under control."
                status = "good"

        elif elbow_angle <= 90:
            self.stage = "DOWN"
            if hip_fault:
                feedback = "Keep your core tight and body straight!"
                status = "bad"
            else:
                feedback = "Great depth! Push the floor away."
                status = "good"

        elif elbow_angle <= 140:
            if self.stage != "DOWN":
                self.stage = "DESCENDING"
            if hip_fault:
                feedback = "Don't drop your hips! Maintain a straight line."
                status = "warning"
            else:
                feedback = "Lowering smoothly..."
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
