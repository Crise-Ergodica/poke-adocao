"""
Author: Aurora Drumond Costa Magalhães

Pytest configuration providing centralized and transactional fixtures.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.models import Base
from app.database import get_db
from app.main import app

# Use an in-memory SQLite database, forcing a single connection pool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database_schema():
    """
    Creates all tables in the test database once per session.

    Yields:
        None
    """
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """
    Yields a transactional database session for a single test.
    Rolls back the transaction after the test to guarantee isolation.

    Yields:
        Session: A transactional database session.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    """
    Provides a FastAPI TestClient that overrides the get_db dependency
    to use the isolated, transactional test database session.

    Args:
        db_session (Session): The injected transactional database session.

    Yields:
        TestClient: A configured FastAPI test client.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
