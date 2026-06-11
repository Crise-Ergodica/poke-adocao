"""
Author: Aurora Drumond Costa Magalhães

Pydantic schemas for the application API.
"""

from pydantic import BaseModel, Field
from typing import List
from datetime import datetime

class LocationUpdate(BaseModel):
    """
    Schema for incoming location updates.

    Attributes:
        userId (str): The ID of the user.
        latitude (float): Current latitude of the device.
        longitude (float): Current longitude of the device.
        accuracy (float): Precision of the coordinates in meters.
        timestamp (str | None): Timestamp of the update.
    """
    userId: str
    latitude: float
    longitude: float
    accuracy: float
    timestamp: str | None = None


class UserPokemonSchema(BaseModel):
    """
    Schema representing a Pokemon in a User's party.

    Attributes:
        id (int): Database ID.
        pokemon_id (int): PokeAPI ID.
    """
    id: int
    pokemon_id: int

    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    """
    Schema representing a User in API responses.

    Attributes:
        user_id (str): Unique user identifier.
        latitude (float): User's latitude.
        longitude (float): User's longitude.
        party (List[UserPokemonSchema]): The user's party of Pokemon.
    """
    user_id: str
    latitude: float
    longitude: float
    party: List[UserPokemonSchema] = []

    class Config:
        from_attributes = True

class PokemonEntitySchema(BaseModel):
    """
    Schema representing a Pokemon Entity in API responses.

    Attributes:
        id (int): Entity database ID.
        pokemon_id (int): PokeAPI ID.
        latitude (float): Entity latitude.
        longitude (float): Entity longitude.
    """
    id: int
    pokemon_id: int
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

class NearbyResponse(BaseModel):
    """
    Schema for the response of nearby entities.

    Attributes:
        users (List[UserSchema]): List of nearby users.
        pokemon (List[PokemonEntitySchema]): List of nearby Pokemon entities.
    """
    users: List[UserSchema]
    pokemon: List[PokemonEntitySchema]
