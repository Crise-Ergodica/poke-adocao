"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington
"""
"""
Pydantic schemas for the application API.
"""


from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models import AdoptionStatus

class UserCreate(BaseModel):
    """
    Schema for creating a new user.

    Attributes:
        email (str): The user's email address.
        username (str): The user's chosen username.
        password (str): The user's password.
    """
    email: str
    username: str
    password: str

class UserLogin(BaseModel):
    """
    Schema for login request.

    Attributes:
        email (str): The user's email.
        password (str): The user's password.
    """
    email: str
    password: str

class UsernameUpdate(BaseModel):
    """
    Schema for updating a user's username.

    Attributes:
        username (str): The user's new username.
    """
    username: str

class PasswordUpdate(BaseModel):
    """
    Schema for updating a user's password.

    Attributes:
        password (str): The user's new password.
    """
    password: str

class CompanionUpdate(BaseModel):
    """
    Schema for updating a user's companion pokemon.

    Attributes:
        companion_pokemon_id (Optional[int]): The PokeAPI ID of the companion pokemon.
    """
    companion_pokemon_id: Optional[int] = Field(default=None, ge=1, le=1025)

class Token(BaseModel):
    """
    Schema for JWT token response.
    """
    access_token: str
    token_type: str
    user_id: str
    icon_url: Optional[str] = None
    companion_pokemon_id: Optional[int] = None


class PokemonRenameRequest(BaseModel):
    """
    Schema for renaming a pokemon in a user's party.

    Attributes:
        name (str): The new name for the pokemon.
    """
    name: str

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
    name: Optional[str] = None
    class Config:
        from_attributes = True

class UserSchema(BaseModel):
    """
    Schema representing a User in API responses.

    Attributes:
        user_id (str): Unique user identifier.
        latitude (float): User's latitude.
        longitude (float): User's longitude.
        icon_url (Optional[str]): URL of the user's icon.
        companion_pokemon_id (Optional[int]): The PokeAPI ID of the companion pokemon.
        party (List[UserPokemonSchema]): The user's party of Pokemon.
    """
    user_id: str
    latitude: float
    longitude: float
    icon_url: Optional[str] = None
    companion_pokemon_id: Optional[int] = None
    party: List[UserPokemonSchema] = []

    class Config:
        from_attributes = True

class PokemonEntitySchema(BaseModel):
    """
    Schema representing a Pokemon Entity in API responses.
    """
    id: int
    pokemon_id: int
    name: Optional[str] = None  # <--- Adicione esta linha
    latitude: float
    longitude: float
    sprite_url: Optional[str] = None
    is_shiny: bool
    gender: str
    type_1: str
    type_2: Optional[str] = None
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
        receiver_user_id (Optional[str]): ID of the user receiving the Pokemon.
    """
    pokemon_entity_id: int
    provider_user_id: Optional[str] = None
    receiver_user_id: Optional[str] = None


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
    provider_user_id: Optional[str] = None
    receiver_user_id: Optional[str] = None
    status: AdoptionStatus
    created_at: datetime
    updated_at: datetime
    pokemon: Optional[PokemonEntitySchema] = None

    class Config:
        from_attributes = True
