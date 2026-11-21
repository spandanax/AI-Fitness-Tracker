# AI Fitness Tracker – Smart Personal Workout Trainer

A complete, modern, full-stack AI-powered Fitness and Workout Tracking Web Application built with **React**, **Vite**, **Tailwind CSS**, **FastAPI**, **MediaPipe Pose**, **OpenCV**, and **SQLite**.

The application acts as an intelligent personal trainer that uses real-time webcam video feed, 33-point 3D human pose estimation, and exercise-specific biomechanical analysis to track movements, count repetitions, identify posture problems, provide browser voice instructions, and record workout progress with zero simulated data.

---

## 🌟 Key Features

### 1. 13 Exercise Biomechanical Modules
Independent Python modules in `backend/app/exercises/` implementing custom joint angle calculations, state machines, and posture evaluation:
1. **Squats** (`squat.py`): Knee depth tracking (<=95°), torso incline protection (>=60°), knee cave/drift validation, partial rep rejection.
2. **Push-ups** (`pushup.py`): Elbow extension (>155°) and flexion (<=90°), rigid plank line alignment (160°-180°), hip sag detection.
3. **Pull-ups** (`pullup.py`): Full deadhang (>150°), chin over bar (<=75°), anti-swing/kip detection.
4. **Dips** (`dip.py`): 90° upper arm parallel descent, lockout (>155°), rotator cuff over-dip protection (>=70°).
5. **Lunges** (`lunge.py`): Active front knee flexion (<=100°), upright torso posture maintenance (>=70°).
6. **Jumping Jacks** (`jumping_jacks.py`): Synchronized arm overhead clap and leg abduction ratio (>=1.3x shoulder width).
7. **Plank** (`plank.py`): **Hold-duration timer tracking** instead of rep counts, spinal neutrality (160°-180°), hip sag and pike alerts.
8. **Bicep Curls** (`bicep_curls.py`): Full contraction (<=45°), full extension (>150°), elbow drift suppression, torso momentum detection.
9. **Shoulder Press** (`shoulder_press.py`): Overhead lockout (>=155°), shoulder ear-level descent, lumbar hyperextension alert.
10. **Mountain Climbers** (`mountain_climbers.py`): Alternating knee drives (<=80°) with plank hip stabilization.
11. **Crunches** (`crunches.py`): Thoracic flexion (<=90°), scapula elevation, lower back floor contact.
12. **Burpees** (`burpees.py`): Multi-stage transition: Stand -> Horizontal Plank Drop -> Explosive Overhead Jump.
13. **Calf Raises** (`calf_raises.py`): Plantarflexion ankle rise (>=138°), vertical heel lift, knee bend penalty.

### 2. Real-Time Computer Vision & Pose Detection
- Powered by Google MediaPipe Pose (33 3D landmarks) + OpenCV.
- High-framerate, low-latency WebSocket video streaming.
- Dynamic skeleton canvas overlay with neon status colors (Green = Proper Form, Amber = Caution, Red = Form Fault).
- Camera positioning guidance engine ("Step back so legs are visible", "Adjust camera tilt", etc.).

### 3. AI Posture Correction Engine
- Rule-based, explainable biomechanical feedback.
- Instant vocal and visual guidance ("Squat deeper! Aim for thighs parallel", "Keep chest elevated", "Don't sag hips").

### 4. Smart Repetition Counter & State Machine
- Strict state-machine transitions (e.g. `UP` -> `DESCENDING` -> `DOWN` -> `UP`).
- Partial repetition rejection (does not award reps if depth or range-of-motion is incomplete).
- Duplicate count prevention and tracking interruption handling.

### 5. Browser Voice Assistant
- Powered by the native Browser Speech Synthesis API.
- Cooldown engine to prevent voice spamming and repetitive audio overlapping.
- Spoken rep counts, form corrections, rest countdowns, and completion cheers.

### 6. Movement Quality Score (0 - 100)
- Mathematical scoring combining range of motion, joint alignment, velocity consistency, and stability.

### 7. Neuromuscular Fatigue Estimation
- Non-medical fatigue warning analyzing rep cadence drift and progressive form degradation.

### 8. Analytics, Gamification & Real Database
- **Calorie Estimation**: Task-specific MET values calibrated against athlete body weight and workout duration.
- **Rest Interval Timer**: Circular countdown modal (30s, 45s, 60s, 90s, custom) with voice alert upon completion.
- **Weekly Progress**: 7-day consistency tracking with volume and calorie trends.
- **Achievements**: Unlockable badges with points ("First Step", "Century Club", "Iron Thighs", "Master of Form", etc.).
- **Real Community Leaderboard**: Database-backed athlete rankings without fake users or synthetic data.

---

## 🏗️ Project Architecture

```
AI-Fitness-Tracker/
├── run_backend.py                # Single-command backend launcher
├── start_backend.bat             # Windows backend launch script
├── start_frontend.bat            # Windows frontend launch script
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py               # FastAPI application entrypoint & middleware
│   │   ├── core/
│   │   │   ├── config.py         # App configuration & CORS settings
│   │   │   └── database.py       # SQLite & SQLAlchemy engine
│   │   ├── models/               # SQLAlchemy DB models (User, WorkoutSession, RepLog, Achievement)
│   │   ├── schemas/              # Pydantic validation schemas
│   │   ├── services/
│   │   │   ├── calorie_service.py      # MET calorie calculation
│   │   │   ├── fatigue_service.py      # Neuromuscular fatigue analysis
│   │   │   ├── achievement_service.py  # Gamification & badge unlock engine
│   │   │   └── analytics_service.py    # Database aggregation & weekly stats
│   │   ├── pose/
│   │   │   ├── detector.py       # MediaPipe Pose wrapper & framing guidance
│   │   │   └── geometry.py       # 2D/3D angle, distance, EMA filter
│   │   ├── exercises/            # 13 Independent exercise modules
│   │   │   ├── base.py
│   │   │   ├── squat.py
│   │   │   ├── pushup.py
│   │   │   ├── pullup.py
│   │   │   ├── dip.py
│   │   │   ├── lunge.py
│   │   │   ├── jumping_jacks.py
│   │   │   ├── plank.py
│   │   │   ├── bicep_curls.py
│   │   │   ├── shoulder_press.py
│   │   │   ├── mountain_climbers.py
│   │   │   ├── crunches.py
│   │   │   ├── burpees.py
│   │   │   └── calf_raises.py
│   │   └── api/                  # REST & WebSocket endpoints
│   └── tests/                    # Pytest test suite (59 tests)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx               # Dashboard navigation & layout
        ├── components/           # Navbar, Sidebar, SkeletonCanvas, PostureBadge, etc.
        ├── hooks/                # useWebcam, usePoseWebSocket, useSpeechSynthesis
        ├── charts/               # Recharts Weekly Activity, Quality Trend, Distribution
        ├── services/             # REST API client
        └── pages/                # 10 Responsive Dashboard Pages
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.13)
- Node.js v18+ & pnpm (or npm)
- Webcam connected to computer

### 2. Start the Backend Server
```bash
python run_backend.py
```
- REST API will be available at: `http://localhost:8000`
- Interactive Swagger documentation: `http://localhost:8000/docs`
- Real-time WebSocket: `ws://localhost:8000/ws/workout/<exercise>`

### 3. Start the Frontend Application
```bash
cd frontend
pnpm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Automated Testing

Run the full backend test suite (59 tests) with one command from the **project root**:

```powershell
# From d:\projects\AI-Fitness-Tracker
python -m pytest -v
```

### What is tested (59 tests total)

| File | Tests | Coverage |
|------|-------|----------|
| `test_api.py` | 28 | Exercise catalog, calorie service, analytics, achievements, fatigue detector, DB workout lifecycle, leaderboard, app config |
| `test_exercises.py` | 28 | All 13 exercise detectors — valid frames + empty landmark handling + plank hold timer |
| `test_squat.py` | 3 | Squat state machine: initial state, full rep, partial rep rejection |

Expected output:
```
59 passed in ~2.5s
```

> **Note:** The test suite uses a direct-call + in-memory SQLite approach. `starlette.testclient` and async HTTP tests (which require OS thread creation) are intentionally avoided for sandbox compatibility. All business logic, DB models, services, and exercise detectors are fully covered.
