"""
Author: Aurora Drumond Costa Magalhães

Authentication service containing business logic for user login and registration with JWT.
"""

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
import jwt
from fastapi import HTTPException, status
from app.models import User
from app.schemas import UserSchema, UserCreate, Token

SECRET_KEY = "my_super_secret_jwt_key_for_mvp"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """
    Generates a bcrypt hash from a plain text password.

    Args:
        password (str): The plain text password.

    Returns:
        str: The hashed password.
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a hashed password.

    Args:
        plain_password (str): The plain text password.
        hashed_password (str): The hashed password.

    Returns:
        bool: True if password matches, False otherwise.
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Creates a JWT access token.

    Args:
        data (dict): The payload data to encode in the token.
        expires_delta (timedelta | None): Optional expiration time delta.

    Returns:
        str: The encoded JWT token.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def register_user(db: Session, user_create: UserCreate) -> UserSchema:
    """
    Registers a new user in the database.

    Args:
        db (Session): The database session.
        user_create (UserCreate): The user creation schema with email, username, and password.

    Raises:
        HTTPException: If the email or username already exists.

    Returns:
        UserSchema: The newly created user entity.
    """
    # Check if user already exists
    existing_user_email = db.query(User).filter(User.email == user_create.email).first()
    if existing_user_email:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    existing_user_id = db.query(User).filter(User.user_id == user_create.username).first()
    if existing_user_id:
        raise HTTPException(status_code=400, detail="Username already taken")

    hashed_pwd = get_password_hash(user_create.password)
    
    new_user = User(
        email=user_create.email,
        hashed_password=hashed_pwd,
        user_id=user_create.username,
        latitude=0.0,
        longitude=0.0,
        last_updated=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticates a user using email and password.

    Args:
        db (Session): The database session.
        email (str): The user's email.
        password (str): The user's plain text password.

    Returns:
        User: The authenticated user object, or None if authentication fails.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
