import os
import sys
import uvicorn

if __name__ == "__main__":
    # Add backend directory to sys.path
    backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
        
    print("=" * 60)
    print("  AI FITNESS TRACKER - SMART PERSONAL TRAINER BACKEND")
    print("  MediaPipe Pose + FastAPI + WebSocket Biomechanical Engine")
    print("=" * 60)
    print("  REST API:      http://127.0.0.1:8000")
    print("  Swagger Docs:  http://127.0.0.1:8000/docs")
    print("  WebSocket:     ws://127.0.0.1:8000/ws/workout/<exercise>")
    print("=" * 60)
    
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True, app_dir=backend_dir)
