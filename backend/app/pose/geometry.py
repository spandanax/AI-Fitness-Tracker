import math
from typing import Tuple, Dict, Any, Optional

# MediaPipe Pose Landmark Indices
class LandmarkIndex:
    NOSE = 0
    LEFT_EYE_INNER = 1
    LEFT_EYE = 2
    LEFT_EYE_OUTER = 3
    RIGHT_EYE_INNER = 4
    RIGHT_EYE = 5
    RIGHT_EYE_OUTER = 6
    LEFT_EAR = 7
    RIGHT_EAR = 8
    MOUTH_LEFT = 9
    MOUTH_RIGHT = 10
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13
    RIGHT_ELBOW = 14
    LEFT_WRIST = 15
    RIGHT_WRIST = 16
    LEFT_PINKY = 17
    RIGHT_PINKY = 18
    LEFT_INDEX = 19
    RIGHT_INDEX = 20
    LEFT_THUMB = 21
    RIGHT_THUMB = 22
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HEEL = 29
    RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31
    RIGHT_FOOT_INDEX = 32

def calculate_angle_2d(a: Tuple[float, float], b: Tuple[float, float], c: Tuple[float, float]) -> float:
    """
    Calculates the angle at vertex 'b' formed by line segments ba and bc in degrees (0 to 180).
    Points are (x, y).
    """
    v_ba = (a[0] - b[0], a[1] - b[1])
    v_bc = (c[0] - b[0], c[1] - b[1])

    dot_product = v_ba[0] * v_bc[0] + v_ba[1] * v_bc[1]
    norm_ba = math.sqrt(v_ba[0] ** 2 + v_ba[1] ** 2)
    norm_bc = math.sqrt(v_bc[0] ** 2 + v_bc[1] ** 2)

    if norm_ba == 0.0 or norm_bc == 0.0:
        return 0.0

    cosine_angle = dot_product / (norm_ba * norm_bc)
    # Clamp cosine to [-1.0, 1.0] to prevent math domain error
    cosine_angle = max(-1.0, min(1.0, cosine_angle))
    
    angle_rad = math.acos(cosine_angle)
    return round(math.degrees(angle_rad), 1)

def calculate_vertical_angle(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """
    Calculates the inclination angle of vector a->b from the vertical (y-axis).
    0 deg means perfectly vertical, 90 deg means horizontal.
    """
    dx = abs(b[0] - a[0])
    dy = abs(b[1] - a[1])
    if dy == 0.0:
        return 90.0
    angle_rad = math.atan2(dx, dy)
    return round(math.degrees(angle_rad), 1)

def calculate_horizontal_angle(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """
    Calculates the inclination angle of line a-b relative to the horizontal (x-axis).
    0 deg means horizontal, 90 deg means vertical.
    """
    dx = abs(b[0] - a[0])
    dy = abs(b[1] - a[1])
    if dx == 0.0:
        return 90.0
    angle_rad = math.atan2(dy, dx)
    return round(math.degrees(angle_rad), 1)

def calculate_distance_2d(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    """Euclidean distance between two normalized 2D points."""
    return math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2)

class AngleFilter:
    """Exponential Moving Average (EMA) filter for jitter suppression."""
    def __init__(self, alpha: float = 0.4):
        self.alpha = alpha
        self.value: Optional[float] = None

    def update(self, new_val: float) -> float:
        if self.value is None:
            self.value = new_val
        else:
            self.value = self.alpha * new_val + (1.0 - self.alpha) * self.value
        return round(self.value, 1)

    def reset(self):
        self.value = None
