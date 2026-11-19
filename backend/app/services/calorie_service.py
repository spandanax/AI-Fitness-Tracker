"""
Calorie estimation service using Metabolic Equivalent of Task (MET) values.
Formula: Calories = MET * Weight (kg) * (Duration in minutes / 60)
"""

EXERCISE_MET_VALUES = {
    "squat": 5.5,
    "pushup": 8.0,
    "pullup": 8.0,
    "dip": 7.0,
    "lunge": 5.0,
    "jumping_jacks": 8.0,
    "plank": 3.8,
    "bicep_curls": 4.5,
    "shoulder_press": 5.0,
    "mountain_climbers": 8.5,
    "crunches": 4.0,
    "burpees": 10.0,
    "calf_raises": 4.0,
}

def estimate_calories(exercise_type: str, duration_seconds: float, weight_kg: float = 70.0) -> float:
    """
    Estimates burned calories for a given exercise and duration.
    Always returns a positive, rounded float.
    """
    normalized_key = exercise_type.lower().strip().replace("-", "_").replace(" ", "_")
    met = EXERCISE_MET_VALUES.get(normalized_key, 6.0)
    
    # Hours elapsed
    hours = max(0.0, duration_seconds) / 3600.0
    
    # Standard formula: Calories = MET * Weight_kg * Hours
    calories = met * max(30.0, weight_kg) * hours
    return round(calories, 2)
