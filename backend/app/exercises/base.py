import time
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional, Tuple
from app.pose.geometry import LandmarkIndex, calculate_angle_2d, calculate_distance_2d, AngleFilter

class BaseExerciseDetector(ABC):
    def __init__(self, name: str):
        self.name = name
        self.reps: int = 0
        self.stage: str = "START" # e.g. "START", "DOWN", "UP", "HOLD"
        self.start_time: float = time.time()
        self.rep_start_time: float = time.time()
        self.rep_durations: List[float] = []
        self.rep_scores: List[float] = []
        self.rep_faults: List[str] = []
        self.last_rep_data: Optional[Dict[str, Any]] = None
        self.current_quality_score: float = 100.0
        self.feedback_message: str = "Ready. Begin your movement."
        self.feedback_status: str = "good" # "good", "warning", "bad"
        self.angles: Dict[str, float] = {}
        self.is_paused: bool = False
        self.pause_start: Optional[float] = None
        self.total_paused_duration: float = 0.0

    def reset(self):
        """Resets all counting and internal state."""
        self.reps = 0
        self.stage = "START"
        self.start_time = time.time()
        self.rep_start_time = time.time()
        self.rep_durations.clear()
        self.rep_scores.clear()
        self.rep_faults.clear()
        self.last_rep_data = None
        self.current_quality_score = 100.0
        self.feedback_message = "Ready. Begin your movement."
        self.feedback_status = "good"
        self.angles.clear()
        self.is_paused = False
        self.pause_start = None
        self.total_paused_duration = 0.0

    def pause(self):
        if not self.is_paused:
            self.is_paused = True
            self.pause_start = time.time()

    def resume(self):
        if self.is_paused and self.pause_start:
            self.total_paused_duration += time.time() - self.pause_start
            self.is_paused = False
            self.pause_start = None

    def get_elapsed_seconds(self) -> float:
        if self.is_paused and self.pause_start:
            return max(0.0, self.pause_start - self.start_time - self.total_paused_duration)
        return max(0.0, time.time() - self.start_time - self.total_paused_duration)

    def get_landmark_pt(self, landmarks: List[Dict[str, float]], index: int) -> Tuple[float, float]:
        """Returns (x, y) tuple for a given landmark index."""
        return (landmarks[index]["x"], landmarks[index]["y"])

    def get_visibility(self, landmarks: List[Dict[str, float]], index: int) -> float:
        return landmarks[index].get("visibility", 0.0)

    def check_visibility_confidence(self, landmarks: List[Dict[str, float]], indices: List[int], threshold: float = 0.5) -> bool:
        """Verifies that all specified landmark indices satisfy minimum visibility confidence."""
        return all(self.get_visibility(landmarks, idx) >= threshold for idx in indices)

    @abstractmethod
    def process_frame(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Process the frame landmarks and update state, angles, reps, and feedback.
        Must return standard exercise state dict.
        """
        pass

    def get_summary(self) -> Dict[str, Any]:
        avg_score = (
            round(sum(self.rep_scores) / len(self.rep_scores), 1)
            if self.rep_scores else round(self.current_quality_score, 1)
        )
        return {
            "exercise": self.name,
            "reps_completed": self.reps,
            "duration_seconds": int(self.get_elapsed_seconds()),
            "avg_quality_score": avg_score,
            "total_reps_logged": len(self.rep_durations),
            "rep_details": [
                {
                    "rep_number": i + 1,
                    "duration_seconds": round(self.rep_durations[i], 2),
                    "quality_score": round(self.rep_scores[i], 1),
                    "posture_faults": self.rep_faults[i] if i < len(self.rep_faults) else ""
                }
                for i in range(len(self.rep_durations))
            ]
        }
