import cv2
import numpy as np
import mediapipe as mp
from typing import List, Dict, Any, Optional, Tuple

class PoseDetector:
    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        model_complexity: int = 1
    ):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            smooth_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )
        self.mp_drawing = mp.solutions.drawing_utils

    def process_bgr_frame(self, frame: np.ndarray) -> Tuple[Optional[List[Dict[str, float]]], Dict[str, Any]]:
        """
        Processes a BGR OpenCV frame and returns landmarks and visibility feedback.
        Each landmark: {'x': x, 'y': y, 'z': z, 'visibility': v}
        """
        if frame is None or frame.size == 0:
            return None, {"visible": False, "guidance": "No video feed received"}

        h, w, _ = frame.shape
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        rgb_frame.flags.writeable = False
        results = self.pose.process(rgb_frame)

        if not results.pose_landmarks:
            return None, {
                "visible": False,
                "guidance": "No person detected. Please stand in front of the camera."
            }

        raw_landmarks = results.pose_landmarks.landmark
        landmarks_list = [
            {
                "x": lm.x,
                "y": lm.y,
                "z": lm.z,
                "visibility": lm.visibility
            }
            for lm in raw_landmarks
        ]

        # Validate visibility and camera positioning
        guidance = self._check_body_visibility(landmarks_list)

        return landmarks_list, guidance

    def _check_body_visibility(self, landmarks: List[Dict[str, float]]) -> Dict[str, Any]:
        """
        Checks whether key landmarks (head, shoulders, hips, knees, ankles) are adequately visible.
        Provides helpful positioning guidance to the user.
        """
        # Key landmark indices
        shoulders_vis = (landmarks[11]["visibility"] + landmarks[12]["visibility"]) / 2.0
        hips_vis = (landmarks[23]["visibility"] + landmarks[24]["visibility"]) / 2.0
        knees_vis = (landmarks[25]["visibility"] + landmarks[26]["visibility"]) / 2.0
        ankles_vis = (landmarks[27]["visibility"] + landmarks[28]["visibility"]) / 2.0

        upper_body_visible = shoulders_vis > 0.4 and hips_vis > 0.4
        lower_body_visible = knees_vis > 0.4 and ankles_vis > 0.3
        full_body_visible = upper_body_visible and lower_body_visible

        # Framing / edge boundary checks
        head_y = landmarks[0]["y"]
        feet_y = max(landmarks[27]["y"], landmarks[28]["y"])

        guidance = "Good camera positioning"
        warning = False

        if not upper_body_visible and not lower_body_visible:
            guidance = "Move into frame with clear lighting."
            warning = True
        elif not lower_body_visible and head_y < 0.15:
            guidance = "Step back so your full body and legs are visible."
            warning = True
        elif head_y < 0.02:
            guidance = "Tilt camera slightly up or step back slightly."
            warning = True
        elif feet_y > 0.98:
            guidance = "Step back slightly so your feet are in frame."

        return {
            "visible": True,
            "full_body_visible": full_body_visible,
            "upper_body_visible": upper_body_visible,
            "lower_body_visible": lower_body_visible,
            "guidance": guidance,
            "warning": warning
        }

    def close(self):
        if hasattr(self, "pose") and self.pose:
            self.pose.close()
