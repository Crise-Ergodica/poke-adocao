"""
Author: Aurora Drumond Costa Magalhães

Tests for the FastAPI endpoints.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Base, User, PokemonEntity
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import get_db



def test_update_location_success(client):
    """
    Test successful location update with accuracy <= 50m.

    Returns:
        None
    """
    payload = {
        "userId": "user123",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 15.0
    }

    response = client.post("/api/v1/location/update", json=payload)
    assert response.status_code == 200
    assert response.json()["message"] == "Location updated successfully"


def test_update_location_accuracy_insufficient(client):
    """
    Test location update rejection when accuracy > 50m.

    Returns:
        None
    """
    payload = {
        "userId": "user123",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "accuracy": 55.0 # Insufficient accuracy
    }

    response = client.post("/api/v1/location/update", json=payload)
    assert response.status_code == 400
    assert "accuracy" in response.json()["detail"].lower()


def test_get_nearby_entities(client, db_session):
    """
    Test fetching nearby entities within 50m.

    Returns:
        None
    """
    db = db_session

    # Center point
    center_lat, center_lon = 40.7128, -74.0060

    # Insert user exactly at center
    user1 = User(user_id="user1", latitude=center_lat, longitude=center_lon)
    db.add(user1)

    # Insert another user far away
    user2 = User(user_id="user2", latitude=34.0522, longitude=-118.2437)
    db.add(user2)

    # Insert Pokemon close by (~30m)
    poke1 = PokemonEntity(pokemon_id=25, latitude=40.7128, longitude=-74.0058)
    db.add(poke1)

    # Insert Pokemon far away
    poke2 = PokemonEntity(pokemon_id=1, latitude=40.7200, longitude=-74.0100)
    db.add(poke2)

    db.commit()

    response = client.get(f"/api/v1/map/nearby?latitude={center_lat}&longitude={center_lon}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["users"]) == 1
    assert data["users"][0]["user_id"] == "user1"

    assert len(data["pokemon"]) == 1
    assert data["pokemon"][0]["pokemon_id"] == 25


def test_get_user_profile(client, db_session):
    """
    Test fetching a user's profile and their party.

    Returns:
        None
    """
    from app.models import UserPokemon

    db = db_session
    user_id = "test_user"
    user = User(user_id=user_id, latitude=0.0, longitude=0.0)
    db.add(user)
    db.commit()

    # Add a pokemon to the user's party
    party_member = UserPokemon(user_id=user.id, pokemon_id=25)
    db.add(party_member)
    db.commit()

    response = client.get(f"/api/v1/users/{user_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["user_id"] == user_id
    assert len(data["party"]) == 1
    assert data["party"][0]["pokemon_id"] == 25
