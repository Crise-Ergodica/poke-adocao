"""
Author: Aurora Drumond Costa Magalhães

Pydantic schemas for the application API.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models import AdoptionStatus

class LoginRequest(BaseModel):
    """
    Schema for login request.

    Attributes:
        username (str): The provided username.
    """
    username: str

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
    icon_url: Optional[str] = None
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
    sprite_url: Optional[str] = None

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


class AdoptionCreate(BaseModel):
    """
    Schema for creating a new adoption.

    Attributes:
        pokemon_entity_id (int): ID of the PokemonEntity to adopt.
        provider_user_id (Optional[str]): ID of the user providing the Pokemon.
        receiver_user_id (str): ID of the user receiving the Pokemon.
    """
    pokemon_entity_id: int
    provider_user_id: Optional[str] = None
    receiver_user_id: str


class AdoptionUpdateStatus(BaseModel):
    """
    Schema for updating the status of an adoption.

    Attributes:
        status (AdoptionStatus): The new status to transition to.
    """
    status: AdoptionStatus


class AdoptionSchema(BaseModel):
    """
    Schema representing an Adoption in API responses.

    Attributes:
        id (int): Adoption ID.
        pokemon_entity_id (int): ID of the PokemonEntity.
        provider_user_id (Optional[str]): ID of the user providing the Pokemon.
        receiver_user_id (str): ID of the user receiving the Pokemon.
        status (AdoptionStatus): Current status.
        created_at (datetime): Creation timestamp.
        updated_at (datetime): Last update timestamp.
    """
    id: int
    pokemon_entity_id: int
    provider_user_id: Optional[str]
    receiver_user_id: str
    status: AdoptionStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
