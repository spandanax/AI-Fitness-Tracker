import time
from typing import List, Dict, Any, Tuple
from app.exercises.base import BaseExerciseDetector
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, AngleFilter

class SquatDetector(BaseExerciseDetector):
    def __init__(self):
        super().__init__(name="Squat")
        self.knee_angle_filter = AngleFilter(alpha=0.4)
        self.hip_angle_filter = AngleFilter(alpha=0.4)
        self.min_knee_angle_in_rep = 180.0
        self.stage = "UP"
        self.rep_fault_reasons: List[str] = []
        self.partial_rep_detected = False

    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        if not landmarks or len(landmarks) < 33:
            return self._build_response(100.0, "Stand in frame to begin squats", "warning")

        # Determine best visible side
        left_vis = (self.get_visibility(landmarks, LandmarkIndex.LEFT_HIP) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_KNEE) +
                    self.get_visibility(landmarks, LandmarkIndex.LEFT_ANKLE)) / 3.0

        right_vis = (self.get_visibility(landmarks, LandmarkIndex.RIGHT_HIP) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_KNEE) +
                     self.get_visibility(landmarks, LandmarkIndex.RIGHT_ANKLE)) / 3.0

        if left_vis < 0.4 and right_vis < 0.4:
            return self._build_response(self.current_quality_score, "Ensure hips, knees, and ankles are clearly visible", "warning")

        # Use the side with higher visibility
        use_left = left_vis >= right_vis
        hip_idx = LandmarkIndex.LEFT_HIP if use_left else LandmarkIndex.RIGHT_HIP
        knee_idx = LandmarkIndex.LEFT_KNEE if use_left else LandmarkIndex.RIGHT_KNEE
        ankle_idx = LandmarkIndex.LEFT_ANKLE if use_left else LandmarkIndex.RIGHT_ANKLE
        shoulder_idx = LandmarkIndex.LEFT_SHOULDER if use_left else LandmarkIndex.RIGHT_SHOULDER

        p_hip = self.get_landmark_pt(landmarks, hip_idx)
        p_knee = self.get_landmark_pt(landmarks, knee_idx)
        p_ankle = self.get_landmark_pt(landmarks, ankle_idx)
        p_shoulder = self.get_landmark_pt(landmarks, shoulder_idx)

        # Calculate joint angles
        raw_knee_angle = calculate_angle_2d(p_hip, p_knee, p_ankle)
        raw_hip_angle = calculate_angle_2d(p_shoulder, p_hip, p_knee)

        knee_angle = self.knee_angle_filter.update(raw_knee_angle)
        hip_angle = self.hip_angle_filter.update(raw_hip_angle)

        self.angles = {
            "knee_angle": knee_angle,
            "hip_angle": hip_angle
        }

        # Track minimum knee angle achieved during the current repetition
        if knee_angle < self.min_knee_angle_in_rep:
            self.min_knee_angle_in_rep = knee_angle

        # Posture check: Torso collapse / excessive forward lean
        torso_fault = False
        if knee_angle < 130 and hip_angle < 55:
            torso_fault = True
            if "Excessive forward lean" not in self.rep_fault_reasons:
                self.rep_fault_reasons.append("Excessive forward lean")

        # Knee tracking: check excessive knee travel past toes
        knee_toe_fault = False
        if p_knee[0] > p_ankle[0] + 0.22 or p_knee[0] < p_ankle[0] - 0.22:
            knee_toe_fault = True
            if "Knees shifting excessively forward" not in self.rep_fault_reasons:
                self.rep_fault_reasons.append("Knees shifting excessively forward")

        # Movement state machine
        status = "good"
        feedback = self.feedback_message

        # Transitions:
        # Standing straight: knee_angle > 155
        # Deep squat: knee_angle <= 100
        # Transitioning: 100 < knee_angle <= 155

        if knee_angle > 155:
            if self.stage == "DOWN":
                # User completed upward motion from a full squat
                now = time.time()
                rep_duration = max(0.2, now - self.rep_start_time)
                
                # Successful repetition!
                self.reps += 1
                
                # Compute rep quality score
                score = 100.0
                # Depth component
                if self.min_knee_angle_in_rep > 90:
                    score -= (self.min_knee_angle_in_rep - 90) * 1.0
                # Torso fault deduction
                if "Excessive forward lean" in self.rep_fault_reasons:
                    score -= 15.0
                if "Knees shifting excessively forward" in self.rep_fault_reasons:
                    score -= 10.0

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

                feedback = "Great squat! Excellent depth and drive."
                status = "good"
                self.partial_rep_detected = False

                # Reset for next rep
                self.stage = "UP"
                self.min_knee_angle_in_rep = 180.0
                self.rep_fault_reasons = []
                self.rep_start_time = now

            elif self.stage == "DESCENDING":
                # User went down partially but came back up without reaching depth
                self.partial_rep_detected = True
                feedback = "Squat deeper! Aim for thighs parallel to ground."
                status = "warning"
                self.stage = "UP"
                self.min_knee_angle_in_rep = 180.0
                self.rep_fault_reasons = []

            else:
                self.stage = "UP"
                if not self.partial_rep_detected:
                    feedback = "Good stance. Squat down smoothly."
                    status = "good"

        elif knee_angle <= 100:
            self.stage = "DOWN"
            if torso_fault:
                feedback = "Keep your chest up and back straight!"
                status = "bad"
            else:
                feedback = "Good depth reached! Drive up through your heels."
                status = "good"

        elif knee_angle <= 140:
            # Entering descent
            if self.stage != "DOWN":
                self.stage = "DESCENDING"
            if torso_fault:
                feedback = "Chest up! Avoid rounding your lower back."
                status = "warning"
            else:
                feedback = "Descending. Keep lowering until thighs are parallel."
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
