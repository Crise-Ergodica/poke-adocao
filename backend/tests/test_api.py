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

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    """
    Setup and teardown the database for each test.
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


def test_update_location_success():
    """
    Test successful location update with accuracy <= 50m.
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


def test_update_location_accuracy_insufficient():
    """
    Test location update rejection when accuracy > 50m.
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


def test_get_nearby_entities():
    """
    Test fetching nearby entities within 50m.
    """
    db = TestingSessionLocal()

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
    db.close()

    response = client.get(f"/api/v1/map/nearby?latitude={center_lat}&longitude={center_lon}")
    assert response.status_code == 200

    data = response.json()
    assert len(data["users"]) == 1
    assert data["users"][0]["user_id"] == "user1"

    assert len(data["pokemon"]) == 1
    assert data["pokemon"][0]["pokemon_id"] == 25
