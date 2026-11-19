from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.core.database import get_db
from app.models.user import User
from app.models.achievement import UserAchievement
from app.services.achievement_service import ACHIEVEMENT_DEFINITIONS

router = APIRouter(prefix="/achievements", tags=["Achievements"])

@router.get("/{user_id}", response_model=List[Dict[str, Any]])
def get_user_achievements(user_id: int, db: Session = Depends(get_db)):
    unlocked_records = db.query(UserAchievement).filter(UserAchievement.user_id == user_id).all()
    unlocked_keys = {u.badge_key: u.unlocked_at for u in unlocked_records}

    result = []
    for key, definition in ACHIEVEMENT_DEFINITIONS.items():
        is_unlocked = key in unlocked_keys
        result.append({
            "badge_key": key,
            "title": definition["title"],
            "description": definition["description"],
            "icon": definition["icon"],
            "points": definition["points"],
            "unlocked": is_unlocked,
            "unlocked_at": unlocked_keys[key].isoformat() if is_unlocked else None
        })

    return result
