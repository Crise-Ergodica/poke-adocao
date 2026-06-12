"""
Author: Aurora Drumond Costa Magalhães

Tests for the authentication service.
"""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from app.main import app
from app.database import get_db
from app.models import Base, User


def test_login_new_user(client, db_session):
    """
    Test logging in with a new user creates the user.

    Returns:
        None
    """
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "new_trainer_123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "new_trainer_123"
    assert data["latitude"] is None or data["latitude"] == 0.0
    assert data["longitude"] is None or data["longitude"] == 0.0

    # Verify in DB
    db = db_session
    user = db.query(User).filter(User.user_id == "new_trainer_123").first()
    assert user is not None


def test_login_existing_user(client, db_session):
    """
    Test logging in with an existing user returns the user.
    """
    # Create user first
    client.post(
        "/api/v1/auth/login",
        json={"username": "existing_trainer"}
    )

    # Login again
    response = client.post(
        "/api/v1/auth/login",
        json={"username": "existing_trainer"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "existing_trainer"

    # Verify no duplicates in DB
    db = db_session
    users = db.query(User).filter(User.user_id == "existing_trainer").all()
    assert len(users) == 1
