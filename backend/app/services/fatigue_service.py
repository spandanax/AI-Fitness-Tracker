"""
Fatigue estimation service.
Analyzes repetition duration drift, range-of-motion loss, and technique degradation.
Explicitly non-medical movement quality decline indicator.
"""
from typing import List, Dict, Any, Optional

class FatigueDetector:
    def __init__(self):
        self.rep_durations: List[float] = []
        self.rep_scores: List[float] = []
        self.rep_fault_counts: List[int] = []

    def reset(self):
        self.rep_durations.clear()
        self.rep_scores.clear()
        self.rep_fault_counts.clear()

    def record_rep(self, duration_seconds: float, quality_score: float, fault_count: int = 0) -> Dict[str, Any]:
        self.rep_durations.append(duration_seconds)
        self.rep_scores.append(quality_score)
        self.rep_fault_counts.append(fault_count)
        
        return self.evaluate_fatigue()

    def evaluate_fatigue(self) -> Dict[str, Any]:
        """
        Evaluate if user shows signs of neuromuscular fatigue based on empirical metrics.
        Requires at least 4 repetitions to establish a baseline.
        """
        if len(self.rep_durations) < 4:
            return {
                "fatigue_detected": False,
                "fatigue_level": "None",
                "message": "Tracking baseline movement dynamics",
                "speed_drop_pct": 0.0,
                "quality_drop_pts": 0.0
            }

        # Baseline: average of first 3 reps
        baseline_duration = sum(self.rep_durations[:3]) / 3.0
        baseline_score = sum(self.rep_scores[:3]) / 3.0

        # Current window: average of last 2 reps
        recent_duration = sum(self.rep_durations[-2:]) / 2.0
        recent_score = sum(self.rep_scores[-2:]) / 2.0

        speed_drop_pct = 0.0
        if baseline_duration > 0.3:
            # If duration increases, speed dropped
            speed_drop_pct = max(0.0, ((recent_duration - baseline_duration) / baseline_duration) * 100.0)

        quality_drop_pts = max(0.0, baseline_score - recent_score)
        recent_faults = sum(self.rep_fault_counts[-2:])

        fatigue_detected = False
        level = "None"
        message = "Form is stable and consistent."

        if speed_drop_pct >= 40.0 and quality_drop_pts >= 15.0:
            fatigue_detected = True
            level = "High"
            message = f"Significant fatigue indicated: Rep time increased by {int(speed_drop_pct)}% and form quality declined by {int(quality_drop_pts)} pts. Rest recommended."
        elif speed_drop_pct >= 25.0 or (quality_drop_pts >= 12.0 and recent_faults >= 2):
            fatigue_detected = True
            level = "Moderate"
            message = f"Early fatigue detected: Movement pace slowed down by {int(speed_drop_pct)}%. Focus on core control."
        elif quality_drop_pts >= 20.0:
            fatigue_detected = True
            level = "Mild"
            message = "Form quality is dropping below starting baseline. Reset posture."

        return {
            "fatigue_detected": fatigue_detected,
            "fatigue_level": level,
            "message": message,
            "speed_drop_pct": round(speed_drop_pct, 1),
            "quality_drop_pts": round(quality_drop_pts, 1)
        }
