from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.models.user import User
from app.api import (
    users,
    exercises,
    workouts,
    analytics,
    achievements,
    leaderboard,
    websocket
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed initial athlete profile if table is empty
def init_db():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            default_athlete = User(
                username="alex_fit",
                email="alex@fitness.ai",
                full_name="Alex Mercer",
                weight_kg=72.5,
                height_cm=178.0,
                fitness_goal="muscle_building",
                points=150
            )
            db.add(default_athlete)
            db.commit()
    finally:
        db.close()

init_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="AI Fitness Tracker Backend API with MediaPipe Pose Estimation & Exercise Tracking"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST Routers
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(exercises.router, prefix=settings.API_V1_STR)
app.include_router(workouts.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(achievements.router, prefix=settings.API_V1_STR)
app.include_router(leaderboard.router, prefix=settings.API_V1_STR)

# Include WebSocket Router
app.include_router(websocket.router)

@app.get("/")
def root():
    return {
        "message": "AI Fitness Tracker API is running",
        "version": settings.PROJECT_VERSION,
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
