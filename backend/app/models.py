"""
Author: Aurora Drumond Costa Magalhães
"""
"""
Database models for the application.
"""


import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import relationship
from app.database import Base

class AdoptionStatus(enum.Enum):
    """
    Enum representing the state of an adoption.
    """
    NEW = "NEW"
    PENDING_MEETUP = "PENDING_MEETUP"
    CANCELLED = "CANCELLED"
    ADOPTED = "ADOPTED"

class User(Base):
    """
    Database model representing a user in the system.

    Attributes:
        id (int): Primary key.
        email (str): Unique email address of the user.
        hashed_password (str): Bcrypt hash of the user's password.
        user_id (str): Unique user identifier (username) from frontend.
        latitude (float): Current user latitude.
        longitude (float): Current user longitude.
        last_updated (DateTime): Timestamp of the last location update.
        party (List[UserPokemon]): List of Pokemon in the user's party.
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    user_id = Column(String, unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    icon_url = Column(String, nullable=True)
    last_updated = Column(DateTime)

    party = relationship("UserPokemon", back_populates="user")


class UserPokemon(Base):
    """
    Database model representing a relationship between a User and an adopted Pokemon.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to the User table.
        pokemon_id (int): The ID of the Pokemon from PokeAPI.
    """
    __tablename__ = 'user_pokemon'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    pokemon_id = Column(Integer, index=True)
    pokemon_entity_id = Column(Integer, ForeignKey('pokemon_entities.id'), nullable=True)

    user = relationship("User", back_populates="party")


class PokemonEntity(Base):
    """
    Database model representing a physical instance of a Pokemon on the map.

    Attributes:
        id (int): Primary key.
        pokemon_id (int): PokeAPI Pokemon ID.
        latitude (float): Latitude of the Pokemon.
        longitude (float): Longitude of the Pokemon.
        created_at (datetime): Timestamp when the entity was spawned.
        expires_at (datetime): Timestamp when the entity despawns.
        version_id (int): Optimistic locking version.

    """
    __tablename__ = 'pokemon_entities'

    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    sprite_url = Column(String, nullable=True)
    is_shiny = Column(Boolean, default=False)
    gender = Column(String)
    type_1 = Column(String)
    type_2 = Column(String, nullable=True)
    created_at = Column(DateTime)
    expires_at = Column(DateTime)
    version_id = Column(Integer, nullable=False, default=1)

    __mapper_args__ = {
        "version_id_col": version_id
    }


class Adoption(Base):
    """
    Database model representing the lifecycle of an adoption process.

    Attributes:
        id (int): Primary key.
        pokemon_entity_id (int): Foreign key to the PokemonEntity table.
        provider_user_id (str): ID of the user providing the Pokemon (nullable).
        receiver_user_id (str): ID of the user receiving the Pokemon.
        status (AdoptionStatus): The current state of the adoption.
        created_at (DateTime): Timestamp when the adoption was created.
        updated_at (DateTime): Timestamp when the adoption was last updated.
    """
    __tablename__ = 'adoptions'

    id = Column(Integer, primary_key=True, index=True)
    pokemon_entity_id = Column(Integer, ForeignKey('pokemon_entities.id'), index=True)
    provider_user_id = Column(String, ForeignKey('users.user_id', onupdate='CASCADE'), nullable=True)
    receiver_user_id = Column(String, ForeignKey('users.user_id', onupdate='CASCADE'))
    status = Column(Enum(AdoptionStatus), default=AdoptionStatus.NEW)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    pokemon_entity = relationship("PokemonEntity")
    provider = relationship("User", foreign_keys=[provider_user_id])
    receiver = relationship("User", foreign_keys=[receiver_user_id])
