from typing import Dict, Type
from app.exercises.base import BaseExerciseDetector
from app.exercises.squat import SquatDetector
from app.exercises.pushup import PushupDetector
from app.exercises.pullup import PullupDetector
from app.exercises.dip import DipDetector
from app.exercises.lunge import LungeDetector
from app.exercises.jumping_jacks import JumpingJacksDetector
from app.exercises.plank import PlankDetector
from app.exercises.bicep_curls import BicepCurlsDetector
from app.exercises.shoulder_press import ShoulderPressDetector
from app.exercises.mountain_climbers import MountainClimbersDetector
from app.exercises.crunches import CrunchesDetector
from app.exercises.burpees import BurpeesDetector
from app.exercises.calf_raises import CalfRaisesDetector

EXERCISE_REGISTRY: Dict[str, Type[BaseExerciseDetector]] = {
    "squat": SquatDetector,
    "pushup": PushupDetector,
    "pullup": PullupDetector,
    "dip": DipDetector,
    "lunge": LungeDetector,
    "jumping_jacks": JumpingJacksDetector,
    "plank": PlankDetector,
    "bicep_curls": BicepCurlsDetector,
    "shoulder_press": ShoulderPressDetector,
    "mountain_climbers": MountainClimbersDetector,
    "crunches": CrunchesDetector,
    "burpees": BurpeesDetector,
    "calf_raises": CalfRaisesDetector,
}

def get_exercise_detector(exercise_name: str) -> BaseExerciseDetector:
    normalized = exercise_name.lower().strip().replace("-", "_").replace(" ", "_")
    detector_cls = EXERCISE_REGISTRY.get(normalized)
    if not detector_cls:
        # Fallback to squat if unknown
        return SquatDetector()
    return detector_cls()
