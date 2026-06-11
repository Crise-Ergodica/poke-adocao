"""
Author: Aurora Drumond Costa Magalhães

Database models for the application.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class User(Base):
    """
    User model.

    Attributes:
        id (int): Primary key.
        user_id (str): Unique user identifier from frontend.
        latitude (float): Current user latitude.
        longitude (float): Current user longitude.
        last_updated (DateTime): Timestamp of the last location update.
        party (List[UserPokemon]): List of Pokemon in the user's party.
    """
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    last_updated = Column(DateTime)

    party = relationship("UserPokemon", back_populates="user")


class UserPokemon(Base):
    """
    Model representing a Pokemon in a User's party.

    Attributes:
        id (int): Primary key.
        user_id (int): Foreign key to the User table.
        pokemon_id (int): The ID of the Pokemon from PokeAPI.
    """
    __tablename__ = 'user_pokemon'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    pokemon_id = Column(Integer, index=True)

    user = relationship("User", back_populates="party")


class PokemonEntity(Base):
    """
    Pokemon Entity model representing an abandoned Pokemon.

    Attributes:
        id (int): Primary key.
        pokemon_id (int): The ID of the Pokemon from PokeAPI.
        latitude (float): Latitude of the Pokemon.
        longitude (float): Longitude of the Pokemon.
        created_at (DateTime): Timestamp when the Pokemon was abandoned.
    """
    __tablename__ = 'pokemon_entities'

    id = Column(Integer, primary_key=True, index=True)
    pokemon_id = Column(Integer, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime)
