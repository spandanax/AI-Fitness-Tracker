from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter(prefix="/exercises", tags=["Exercises"])

EXERCISE_CATALOG = [
    {
        "id": "squat",
        "name": "Squats",
        "category": "Lower Body",
        "target_muscles": ["Quadriceps", "Glutes", "Hamstrings", "Core"],
        "difficulty": "Beginner",
        "met_value": 5.5,
        "description": "Fundamental lower-body compound movement strengthening legs and core stabilizers.",
        "key_cues": [
            "Keep chest elevated and spine neutral",
            "Lower hips until thighs are parallel or below (knee angle <= 95°)",
            "Drive weight through heels and midfoot on ascent",
            "Prevent knees from collapsing inward (knee valgus)"
        ],
        "angle_targets": {
            "knee_standing": "> 160°",
            "knee_depth": "<= 95°",
            "torso_angle": ">= 60° (avoid excessive forward collapse)"
        },
        "camera_setup": "Stand 6-8 feet away in 45-degree angle or side profile so hips, knees, and ankles are in frame."
    },
    {
        "id": "pushup",
        "name": "Push-ups",
        "category": "Upper Body",
        "target_muscles": ["Pectorals", "Triceps", "Anterior Deltoids", "Core"],
        "difficulty": "Intermediate",
        "met_value": 8.0,
        "description": "Classic calisthenic upper-body push focusing on chest, triceps, and anterior shoulder strength.",
        "key_cues": [
            "Maintain straight line from shoulders to heels (no hip sag)",
            "Lower chest until elbows reach 90 degrees",
            "Fully extend arms at top without hyperextending",
            "Keep neck neutral in line with the spine"
        ],
        "angle_targets": {
            "elbow_extension": "> 155°",
            "elbow_depth": "<= 90°",
            "body_alignment": "160° - 180°"
        },
        "camera_setup": "Position camera at side profile roughly 1-2 feet off the ground."
    },
    {
        "id": "pullup",
        "name": "Pull-ups",
        "category": "Upper Body",
        "target_muscles": ["Latissimus Dorsi", "Biceps", "Rhomboids", "Rear Deltoids"],
        "difficulty": "Advanced",
        "met_value": 8.0,
        "description": "Vertical pulling compound movement developing back width, scapular retraction, and grip strength.",
        "key_cues": [
            "Start from full deadhang with elbows extended",
            "Pull chest up until chin clears over the bar",
            "Control descent without swinging or kipping",
            "Depress scapulae before driving elbows down"
        ],
        "angle_targets": {
            "elbow_hang": "> 150°",
            "elbow_peak": "<= 75°",
            "swing_tolerance": "< 10°"
        },
        "camera_setup": "Place camera facing front or 45-degree angle showing pull-up bar and upper torso."
    },
    {
        "id": "dip",
        "name": "Dips",
        "category": "Upper Body",
        "target_muscles": ["Triceps", "Lower Pectorals", "Anterior Deltoids"],
        "difficulty": "Intermediate",
        "met_value": 7.0,
        "description": "Intense bodyweight compound press targeting triceps lockout and lower chest fibers.",
        "key_cues": [
            "Start with arms locked at support position",
            "Lower until upper arms reach parallel with floor (90°)",
            "Avoid sinking past 70° to safeguard the rotator cuff",
            "Press through palms to full lockout"
        ],
        "angle_targets": {
            "elbow_lockout": "> 155°",
            "elbow_bottom": "80° - 90°",
            "safety_limit": ">= 70°"
        },
        "camera_setup": "Side profile view at chest height capturing arms and torso."
    },
    {
        "id": "lunge",
        "name": "Lunges",
        "category": "Lower Body",
        "target_muscles": ["Quadriceps", "Glutes", "Hamstrings", "Calves"],
        "difficulty": "Beginner",
        "met_value": 5.0,
        "description": "Unilateral leg exercise developing balance, hip stability, and quad/glute strength.",
        "key_cues": [
            "Step forward and drop hips straight down",
            "Front knee should reach 90 degrees without shooting past toes",
            "Back knee hovers just above the floor",
            "Maintain upright torso posture"
        ],
        "angle_targets": {
            "front_knee_depth": "<= 100°",
            "standing_knee": "> 155°",
            "torso_verticality": ">= 70°"
        },
        "camera_setup": "Side view 6-8 feet away with full legs and upper body visible."
    },
    {
        "id": "jumping_jacks",
        "name": "Jumping Jacks",
        "category": "Cardio & Full Body",
        "target_muscles": ["Calves", "Deltoids", "Core", "Cardiovascular"],
        "difficulty": "Beginner",
        "met_value": 8.0,
        "description": "High-cadence plyometric cardiovascular conditioning exercise.",
        "key_cues": [
            "Jump feet outwards past shoulder width",
            "Simultaneously bring hands all the way overhead",
            "Land softly on balls of feet",
            "Maintain continuous dynamic rhythm"
        ],
        "angle_targets": {
            "feet_spread_ratio": ">= 1.3x shoulder width",
            "hands_overhead": "wrists above nose"
        },
        "camera_setup": "Frontal view showing full body from head to feet."
    },
    {
        "id": "plank",
        "name": "Plank",
        "category": "Core Stability",
        "target_muscles": ["Rectus Abdominis", "Transverse Abdominis", "Glutes", "Shoulders"],
        "difficulty": "Beginner",
        "met_value": 3.8,
        "description": "Isometric core endurance test stabilizing the spine against extension and gravity.",
        "key_cues": [
            "Forearms or palms flat under shoulders",
            "Body forms a rigid straight line from shoulders to ankles",
            "Brace core as if taking a punch; squeeze glutes",
            "Do not allow hips to sag or pike up"
        ],
        "angle_targets": {
            "spine_alignment": "160° - 180°",
            "pike_sag_threshold": "< 155°"
        },
        "camera_setup": "Side profile view at floor level showing full horizontal body line."
    },
    {
        "id": "bicep_curls",
        "name": "Bicep Curls",
        "category": "Arms",
        "target_muscles": ["Biceps Brachii", "Brachialis", "Forearms"],
        "difficulty": "Beginner",
        "met_value": 4.5,
        "description": "Isolation pulling exercise concentrating tension on the bicep peaks.",
        "key_cues": [
            "Keep elbows pinned to your sides with zero swinging",
            "Curl weights up until maximum contraction (elbow <= 45°)",
            "Lower weights fully under eccentric control",
            "Do not lean backward or swing hips"
        ],
        "angle_targets": {
            "elbow_extension": "> 150°",
            "elbow_flexion": "<= 45°",
            "elbow_drift": "< 0.12 normalized offset"
        },
        "camera_setup": "Frontal or 45-degree angle showing torso and arms."
    },
    {
        "id": "shoulder_press",
        "name": "Shoulder Press",
        "category": "Upper Body",
        "target_muscles": ["Anterior Deltoids", "Medial Deltoids", "Triceps", "Upper Traps"],
        "difficulty": "Intermediate",
        "met_value": 5.0,
        "description": "Overhead vertical press for deltoid mass and overhead stability.",
        "key_cues": [
            "Start dumbbells/bar at clavicle or chin height",
            "Press straight up until elbows lock out overhead",
            "Keep core braced and prevent hyperextending lumbar spine",
            "Lower slowly back to ear height"
        ],
        "angle_targets": {
            "elbow_bottom": "<= 95°",
            "elbow_lockout": ">= 155°",
            "torso_verticality": "avoid arching"
        },
        "camera_setup": "Front or seated angle with clear view of shoulders and overhead lockout."
    },
    {
        "id": "mountain_climbers",
        "name": "Mountain Climbers",
        "category": "Cardio & Core",
        "target_muscles": ["Core", "Hip Flexors", "Shoulders", "Cardiovascular"],
        "difficulty": "Intermediate",
        "met_value": 8.5,
        "description": "Dynamic core burner combining plank stabilization with rapid knee drives.",
        "key_cues": [
            "Maintain strong high-plank position with wrists below shoulders",
            "Drive one knee aggressively towards chest",
            "Alternate legs with rapid, controlled cadence",
            "Keep hips down without piking into the air"
        ],
        "angle_targets": {
            "driving_knee": "<= 80°",
            "extended_knee": ">= 135°",
            "hip_level": "parallel to shoulders"
        },
        "camera_setup": "Side profile view 5-6 feet away showing plank line and legs."
    },
    {
        "id": "crunches",
        "name": "Crunches",
        "category": "Core",
        "target_muscles": ["Upper Abdominals", "Rectus Abdominis"],
        "difficulty": "Beginner",
        "met_value": 4.0,
        "description": "Targeted abdominal flexion isolating the upper abs without hip flexor takeover.",
        "key_cues": [
            "Lie on back with knees bent at 90 degrees",
            "Contract abdominals to curl shoulder blades off floor",
            "Squeeze at peak contraction for one second",
            "Avoid pulling on neck with hands"
        ],
        "angle_targets": {
            "flat_angle": "> 125°",
            "peak_crunch": "<= 90°"
        },
        "camera_setup": "Side view at floor level showing head, spine, and knees."
    },
    {
        "id": "burpees",
        "name": "Burpees",
        "category": "Full Body & Plyometric",
        "target_muscles": ["Full Body", "Chest", "Quads", "Core", "Cardiovascular"],
        "difficulty": "Advanced",
        "met_value": 10.0,
        "description": "Total-body functional conditioning combining squat, plank, and jump.",
        "key_cues": [
            "Drop quickly into a solid horizontal plank",
            "Jump feet forward towards hands",
            "Explode vertically into the air clapping overhead",
            "Land softly and flow immediately into next repetition"
        ],
        "angle_targets": {
            "plank_horizontal": "horizontal line",
            "jump_extension": "wrists above head"
        },
        "camera_setup": "Front or 45-degree angle 7-9 feet back capturing standing and floor positions."
    },
    {
        "id": "calf_raises",
        "name": "Calf Raises",
        "category": "Lower Body",
        "target_muscles": ["Gastrocnemius", "Soleus"],
        "difficulty": "Beginner",
        "met_value": 4.0,
        "description": "Lower-leg isolation movement strengthening calves, ankles, and Achilles tendons.",
        "key_cues": [
            "Stand upright with feet hip-width apart",
            "Press through balls of feet to raise heels as high as possible",
            "Hold peak contraction for a brief pause",
            "Lower slowly without bouncing"
        ],
        "angle_targets": {
            "flat_angle": "<= 122°",
            "peak_rise": ">= 138°",
            "knee_extension": ">= 150° (do not bend knees)"
        },
        "camera_setup": "Full body or lower-body view showing feet, ankles, and knees."
    }
]

@router.get("/", response_model=List[Dict[str, Any]])
def list_exercises():
    return EXERCISE_CATALOG

@router.get("/{exercise_id}", response_model=Dict[str, Any])
def get_exercise_details(exercise_id: str):
    normalized = exercise_id.lower().strip().replace("-", "_").replace(" ", "_")
    for ex in EXERCISE_CATALOG:
        if ex["id"] == normalized:
            return ex
    # Default to first if not found
    return EXERCISE_CATALOG[0]
