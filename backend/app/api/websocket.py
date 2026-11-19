import base64
import json
import cv2
import numpy as np
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.pose.detector import PoseDetector
from app.exercises import get_exercise_detector
from app.services.fatigue_service import FatigueDetector

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/workout/{exercise_name}")
async def workout_websocket_endpoint(websocket: WebSocket, exercise_name: str):
    await websocket.accept()
    
    detector = PoseDetector()
    exercise = get_exercise_detector(exercise_name)
    fatigue = FatigueDetector()
    last_logged_rep = 0

    try:
        while True:
            raw_text = await websocket.receive_text()
            
            try:
                data = json.loads(raw_text)
            except Exception:
                continue

            # Command handling
            if "command" in data:
                cmd = data["command"]
                if cmd == "reset":
                    exercise.reset()
                    fatigue.reset()
                    last_logged_rep = 0
                    await websocket.send_json({
                        "type": "command_ack",
                        "command": "reset",
                        "status": "success",
                        "reps": 0
                    })
                    continue
                elif cmd == "pause":
                    exercise.pause()
                    await websocket.send_json({"type": "command_ack", "command": "pause"})
                    continue
                elif cmd == "resume":
                    exercise.resume()
                    await websocket.send_json({"type": "command_ack", "command": "resume"})
                    continue
                elif cmd == "switch_exercise":
                    new_ex = data.get("exercise", "squat")
                    exercise = get_exercise_detector(new_ex)
                    fatigue.reset()
                    last_logged_rep = 0
                    await websocket.send_json({
                        "type": "command_ack",
                        "command": "switch_exercise",
                        "exercise": new_ex
                    })
                    continue

            # Image processing
            image_b64 = data.get("image")
            if not image_b64:
                continue

            # Strip header if present (e.g., 'data:image/jpeg;base64,')
            if "," in image_b64:
                image_b64 = image_b64.split(",", 1)[1]

            try:
                img_bytes = base64.b64decode(image_b64)
                np_arr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            except Exception:
                await websocket.send_json({
                    "error": "Failed to decode camera frame",
                    "status": "bad"
                })
                continue

            if frame is None or frame.size == 0:
                continue

            # Run MediaPipe Pose
            landmarks, guidance_data = detector.process_bgr_frame(frame)

            if not landmarks:
                # No person or low visibility
                await websocket.send_json({
                    "exercise": exercise.name,
                    "reps": exercise.reps,
                    "stage": exercise.stage,
                    "quality_score": round(exercise.current_quality_score, 1),
                    "angles": exercise.angles,
                    "feedback": guidance_data.get("guidance", "Step in front of camera"),
                    "status": "warning",
                    "person_visible": False,
                    "guidance": guidance_data.get("guidance", "No person detected"),
                    "duration_seconds": int(exercise.get_elapsed_seconds()),
                    "fatigue": fatigue.evaluate_fatigue(),
                    "landmarks": []
                })
                continue

            # Process with active exercise detector
            result = exercise.process_frame(landmarks)

            # Check if a new rep was completed
            if exercise.reps > last_logged_rep:
                last_logged_rep = exercise.reps
                if exercise.last_rep_data:
                    faults_count = len(exercise.last_rep_data.get("faults", "").split(",")) if "Clean" not in exercise.last_rep_data.get("faults", "") else 0
                    fatigue.record_rep(
                        duration_seconds=exercise.last_rep_data.get("duration", 1.5),
                        quality_score=exercise.last_rep_data.get("score", 90.0),
                        fault_count=faults_count
                    )

            fatigue_info = fatigue.evaluate_fatigue()

            # Construct real-time response
            response = {
                "exercise": result.get("exercise", exercise.name),
                "reps": result.get("reps", exercise.reps),
                "hold_seconds": result.get("hold_seconds", 0),
                "stage": result.get("stage", exercise.stage),
                "quality_score": result.get("quality_score", 100.0),
                "angles": result.get("angles", {}),
                "feedback": result.get("feedback", "Good form"),
                "status": result.get("status", "good"),
                "person_visible": True,
                "guidance": guidance_data.get("guidance", "Good positioning"),
                "duration_seconds": result.get("duration_seconds", 0),
                "last_rep": result.get("last_rep"),
                "fatigue": fatigue_info,
                "landmarks": landmarks
            }

            await websocket.send_json(response)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        detector.close()
