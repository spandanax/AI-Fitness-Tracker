from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import OverallAnalytics
from app.services.analytics_service import get_user_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/{user_id}", response_model=OverallAnalytics)
def get_analytics(user_id: int, db: Session = Depends(get_db)):
    data = get_user_analytics(db, user_id)
    return data
