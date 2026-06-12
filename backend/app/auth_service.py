"""
Author: Aurora Drumond Costa Magalhães

Authentication service containing business logic for user login.
"""

from sqlalchemy.orm import Session
from app.models import User
from app.schemas import UserSchema
from datetime import datetime

def login_or_create_user(db: Session, username: str) -> UserSchema:
    """
    Looks up a user by username. If the user doesn't exist, creates a new one.

    Args:
        db (Session): Database session.
        username (str): The provided username.

    Returns:
        UserSchema: The authenticated user.
    """
    user = db.query(User).filter(User.user_id == username).first()

    if not user:
        user = User(
            user_id=username,
            latitude=0.0,
            longitude=0.0,
            last_updated=datetime.utcnow()
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user
