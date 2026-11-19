import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "AI Fitness Tracker"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'fitness_tracker.db')}"
    
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

settings = Settings()
