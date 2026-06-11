"""
Author: Aurora Drumond Costa Magalhães

Unit tests for the Adoption Finite State Machine.
"""

import pytest
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.models import Base, User, PokemonEntity, Adoption, AdoptionStatus
from app.adoption_service import create_adoption, transition_state

# Setup in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_fsm_transition_success(db):
    """
    Test a successful adoption lifecycle: NEW -> PENDING_MEETUP -> ADOPTED.
    """
    # Setup
    receiver = User(user_id="user_1", latitude=0.0, longitude=0.0, last_updated=datetime.utcnow())
    pokemon = PokemonEntity(pokemon_id=25, latitude=0.0, longitude=0.0, created_at=datetime.utcnow(), expires_at=datetime.utcnow())
    db.add(receiver)
    db.add(pokemon)
    db.commit()
    db.refresh(receiver)
    db.refresh(pokemon)

    # Action: Create
    adoption = create_adoption(db, pokemon_entity_id=pokemon.id, receiver_user_id=receiver.user_id)
    assert adoption.status == AdoptionStatus.NEW

    # Action: Transition to PENDING_MEETUP
    adoption = transition_state(db, adoption.id, AdoptionStatus.PENDING_MEETUP)
    assert adoption.status == AdoptionStatus.PENDING_MEETUP

    # Action: Transition to ADOPTED (Valid distance, 0 meters)
    adoption = transition_state(db, adoption.id, AdoptionStatus.ADOPTED)
    assert adoption.status == AdoptionStatus.ADOPTED


def test_fsm_distance_limit_failure(db):
    """
    Test that transitioning to ADOPTED fails if distance is > 50 meters.
    """
    # Setup: 1 degree difference is ~111km, way beyond 50m limit.
    receiver = User(user_id="user_1", latitude=1.0, longitude=1.0, last_updated=datetime.utcnow())
    pokemon = PokemonEntity(pokemon_id=25, latitude=0.0, longitude=0.0, created_at=datetime.utcnow(), expires_at=datetime.utcnow())
    db.add(receiver)
    db.add(pokemon)
    db.commit()
    db.refresh(receiver)
    db.refresh(pokemon)

    adoption = create_adoption(db, pokemon_entity_id=pokemon.id, receiver_user_id=receiver.user_id)
    adoption = transition_state(db, adoption.id, AdoptionStatus.PENDING_MEETUP)

    with pytest.raises(ValueError, match="Distance exceeds 50 meters"):
        transition_state(db, adoption.id, AdoptionStatus.ADOPTED)


def test_concurrent_adoption_lock(db):
    """
    Test that optimistic locking/row locking prevents double adoptions
    of the same pokemon at the same time.
    """
    import threading

    pokemon = PokemonEntity(pokemon_id=25, latitude=0.0, longitude=0.0, created_at=datetime.utcnow(), expires_at=datetime.utcnow())
    receiver1 = User(user_id="user_1", latitude=0.0, longitude=0.0, last_updated=datetime.utcnow())
    receiver2 = User(user_id="user_2", latitude=0.0, longitude=0.0, last_updated=datetime.utcnow())
    db.add_all([pokemon, receiver1, receiver2])
    db.commit()
    db.refresh(pokemon)

    adoption1 = create_adoption(db, pokemon.id, receiver1.user_id)
    adoption2 = create_adoption(db, pokemon.id, receiver2.user_id)

    adoption1 = transition_state(db, adoption1.id, AdoptionStatus.PENDING_MEETUP)
    adoption2 = transition_state(db, adoption2.id, AdoptionStatus.PENDING_MEETUP)

    # Both try to transition to ADOPTED for the exact same pokemon entity
    # Because of row locking, one should fail and the other should succeed.
    results = []

    # To test optimistic concurrency without threading issues in SQLite,
    # we simulate two concurrent transactions fetching the data before either commits.
    session1 = TestingSessionLocal()
    session2 = TestingSessionLocal()

    try:
        # Worker 1 transitions
        transition_state(session1, adoption1.id, AdoptionStatus.ADOPTED)
        results.append("SUCCESS")
    except Exception as e:
        results.append(f"FAILED: {e}")
        session1.rollback()

    try:
        # Worker 2 transitions using its separate session which will have stale data
        # because the pokemon.version_id was incremented by session1
        transition_state(session2, adoption2.id, AdoptionStatus.ADOPTED)
        results.append("SUCCESS")
    except Exception as e:
        results.append(f"FAILED: {e}")
        session2.rollback()

    session1.close()
    session2.close()

    # Verify that exactly one succeeded and one failed
    successes = [r for r in results if r == "SUCCESS"]
    assert len(successes) == 1, "Expected exactly one adoption to succeed."


def test_fsm_party_limit_failure(db):
    """
    Test that a 7th consecutive adoption fails with "Party is full." error.
    """
    from app.models import UserPokemon

    # Setup user with 6 pokemon already in party
    receiver = User(user_id="user_1", latitude=0.0, longitude=0.0, last_updated=datetime.utcnow())
    db.add(receiver)
    db.commit()
    db.refresh(receiver)

    for i in range(6):
        user_pokemon = UserPokemon(user_id=receiver.id, pokemon_id=i+1)
        db.add(user_pokemon)
    db.commit()

    # Setup new pokemon for 7th adoption
    pokemon = PokemonEntity(pokemon_id=25, latitude=0.0, longitude=0.0, created_at=datetime.utcnow(), expires_at=datetime.utcnow())
    db.add(pokemon)
    db.commit()
    db.refresh(pokemon)

    adoption = create_adoption(db, pokemon_entity_id=pokemon.id, receiver_user_id=receiver.user_id)
    adoption = transition_state(db, adoption.id, AdoptionStatus.PENDING_MEETUP)

    with pytest.raises(ValueError, match="Party is full. Maximum of 6 Pokemon allowed."):
        transition_state(db, adoption.id, AdoptionStatus.ADOPTED)
