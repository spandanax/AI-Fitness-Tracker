import os
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
        self.use_tasks_api = False
        self.landmarker = None
        self.pose = None

        # Check if new MediaPipe Tasks API is used (MediaPipe 1.0+)
        if hasattr(mp, "tasks") and hasattr(mp.tasks, "vision"):
            try:
                base_dir = os.path.dirname(os.path.abspath(__file__))
                model_path = os.path.join(base_dir, "pose_landmarker_lite.task")
                if os.path.exists(model_path):
                    BaseOptions = mp.tasks.BaseOptions
                    PoseLandmarker = mp.tasks.vision.PoseLandmarker
                    PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
                    VisionRunningMode = mp.tasks.vision.RunningMode

                    options = PoseLandmarkerOptions(
                        base_options=BaseOptions(model_asset_path=model_path),
                        running_mode=VisionRunningMode.IMAGE,
                        min_pose_detection_confidence=min_detection_confidence,
                        min_pose_presence_confidence=min_tracking_confidence,
                        min_tracking_confidence=min_tracking_confidence
                    )
                    self.landmarker = PoseLandmarker.create_from_options(options)
                    self.use_tasks_api = True
            except Exception as e:
                print(f"Warning: Tasks API initialization failed ({e}), checking solutions fallback")

        # Fallback to legacy solutions API if tasks not initialized
        if not self.use_tasks_api:
            if hasattr(mp, "solutions") and hasattr(mp.solutions, "pose"):
                self.mp_pose = mp.solutions.pose
                self.pose = self.mp_pose.Pose(
                    static_image_mode=False,
                    model_complexity=model_complexity,
                    smooth_landmarks=True,
                    min_detection_confidence=min_detection_confidence,
                    min_tracking_confidence=min_tracking_confidence
                )
            else:
                raise RuntimeError("No compatible MediaPipe Pose API found. Ensure pose_landmarker_lite.task is present.")

    def process_bgr_frame(self, frame: np.ndarray) -> Tuple[Optional[List[Dict[str, float]]], Dict[str, Any]]:
        """
        Processes a BGR OpenCV frame and returns landmarks and visibility feedback.
        Each landmark: {'x': x, 'y': y, 'z': z, 'visibility': v}
        """
        if frame is None or frame.size == 0:
            return None, {"visible": False, "guidance": "No video feed received"}

        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        if self.use_tasks_api and self.landmarker:
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)
            detection_result = self.landmarker.detect(mp_image)

            if not detection_result.pose_landmarks or len(detection_result.pose_landmarks) == 0:
                return None, {
                    "visible": False,
                    "guidance": "No person detected. Please stand in front of the camera."
                }

            raw_landmarks = detection_result.pose_landmarks[0]
            landmarks_list = [
                {
                    "x": float(lm.x),
                    "y": float(lm.y),
                    "z": float(lm.z),
                    "visibility": float(getattr(lm, "visibility", 1.0) if getattr(lm, "visibility", None) is not None else 1.0)
                }
                for lm in raw_landmarks
            ]
        else:
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
                    "x": float(lm.x),
                    "y": float(lm.y),
                    "z": float(lm.z),
                    "visibility": float(lm.visibility)
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
        shoulders_vis = (landmarks[11]["visibility"] + landmarks[12]["visibility"]) / 2.0
        hips_vis = (landmarks[23]["visibility"] + landmarks[24]["visibility"]) / 2.0
        knees_vis = (landmarks[25]["visibility"] + landmarks[26]["visibility"]) / 2.0
        ankles_vis = (landmarks[27]["visibility"] + landmarks[28]["visibility"]) / 2.0

        upper_body_visible = shoulders_vis > 0.4 and hips_vis > 0.4
        lower_body_visible = knees_vis > 0.4 and ankles_vis > 0.3
        full_body_visible = upper_body_visible and lower_body_visible

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
            warning = True

        return {
            "visible": True,
            "full_body_visible": full_body_visible,
            "upper_body_visible": upper_body_visible,
            "lower_body_visible": lower_body_visible,
            "guidance": guidance,
            "warning": warning
        }

    def close(self):
        if self.use_tasks_api and self.landmarker:
            self.landmarker.close()
        elif hasattr(self, "pose") and self.pose:
            self.pose.close()
