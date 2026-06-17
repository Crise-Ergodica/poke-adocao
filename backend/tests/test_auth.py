"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington

Tests for the authentication service.
"""

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import pytest

from app.main import app
from app.database import get_db
from app.models import Base, User


def test_register_new_user(client, db_session):
    """
    Test registering a new user.

    Returns:
        None
    """
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "test@example.com",
            "username": "new_trainer_123",
            "password": "securepassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "new_trainer_123"

    # Verify in DB
    db = db_session
    user = db.query(User).filter(User.user_id == "new_trainer_123").first()
    assert user is not None
    assert user.email == "test@example.com"


def test_login_existing_user(client, db_session):
    """
    Test logging in with an existing user returns a token.
    """
    # Register user first
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "username": "existing_trainer",
            "password": "securepassword"
        }
    )

    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "login@example.com",
            "password": "securepassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
