from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    if not users:
        # Create default athlete profile
        default_user = User(
            username="alex_fit",
            email="alex@fitness.ai",
            full_name="Alex Mercer",
            weight_kg=72.5,
            height_cm=178.0,
            fitness_goal="muscle_building",
            points=120
        )
        db.add(default_user)
        db.commit()
        db.refresh(default_user)
        return [default_user]
    return users

@router.post("/", response_model=UserResponse)
def create_user(user_in: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name or "Fitness Athlete",
        weight_kg=user_in.weight_kg or 70.0,
        height_cm=user_in.height_cm or 175.0,
        fitness_goal=user_in.fitness_goal or "general_fitness"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        # If user_id is 1 and no user exists, create default
        if user_id == 1:
            default_user = User(
                username="alex_fit",
                email="alex@fitness.ai",
                full_name="Alex Mercer",
                weight_kg=72.5,
                height_cm=178.0,
                fitness_goal="muscle_building",
                points=120
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
            return default_user
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def update_user_profile(user_id: int, update_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if update_data.full_name is not None:
        user.full_name = update_data.full_name
    if update_data.weight_kg is not None:
        user.weight_kg = update_data.weight_kg
    if update_data.height_cm is not None:
        user.height_cm = update_data.height_cm
    if update_data.fitness_goal is not None:
        user.fitness_goal = update_data.fitness_goal
        
    db.commit()
    db.refresh(user)
    return user
