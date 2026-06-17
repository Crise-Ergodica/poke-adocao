"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington

Service to manage the Finite State Machine (FSM) for Pokemon adoptions.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import Adoption, AdoptionStatus, PokemonEntity, User, UserPokemon
from app.spatial_service import haversine_distance

def create_adoption(db: Session, pokemon_entity_id: int, receiver_user_id: str = None, provider_user_id: str = None) -> Adoption:
    """
    Initiates an adoption process by creating a new record with status NEW.

    Args:
        db (Session): Database session.
        pokemon_entity_id (int): The ID of the Pokemon to adopt.
        receiver_user_id (str, optional): The ID of the user receiving. Defaults to None.
        provider_user_id (str, optional): The ID of the provider. Defaults to None.

    Returns:
        Adoption: The newly created adoption.
    """
    now = datetime.utcnow()
    adoption = Adoption(
        pokemon_entity_id=pokemon_entity_id,
        receiver_user_id=receiver_user_id,
        provider_user_id=provider_user_id,
        status=AdoptionStatus.NEW,
        created_at=now,
        updated_at=now
    )
    db.add(adoption)
    db.commit()
    db.refresh(adoption)
    return adoption

def transition_state(db: Session, adoption_id: int, new_status: AdoptionStatus) -> Adoption:
    """
    Transitions an adoption to a new state with validations and row locking.

    Args:
        db (Session): Database session.
        adoption_id (int): The ID of the adoption to update.
        new_status (AdoptionStatus): The new state to transition to.

    Raises:
        ValueError: If validation fails or another user has already adopted the Pokemon.

    Returns:
        Adoption: The updated adoption.
    """
    # Fetch adoption
    adoption = db.query(Adoption).filter(Adoption.id == adoption_id).first()
    if not adoption:
        raise ValueError("Adoption not found")

    # If transitioning to ADOPTED, validate distance and lock the Pokemon entity
    if new_status == AdoptionStatus.ADOPTED:
        # Validate pokemon
        pokemon = db.query(PokemonEntity).filter(PokemonEntity.id == adoption.pokemon_entity_id).first()

        if not pokemon:
             raise ValueError("Pokemon entity not found")

        # Ensure no other adoption has been finalized for this pokemon
        existing_adoption = db.query(Adoption).filter(
             Adoption.pokemon_entity_id == pokemon.id,
             Adoption.status == AdoptionStatus.ADOPTED
        ).first()

        if existing_adoption:
             raise ValueError("This Pokemon has already been adopted.")

        receiver = db.query(User).filter(User.user_id == adoption.receiver_user_id).first()
        if not receiver:
             raise ValueError("Receiver user not found")

        # Determine target to check distance against
        target_lat = pokemon.latitude
        target_lon = pokemon.longitude

        if adoption.provider_user_id:
            provider = db.query(User).filter(User.user_id == adoption.provider_user_id).first()
            if provider:
                target_lat = provider.latitude
                target_lon = provider.longitude

        # Validate distance <= 50 meters
        distance = haversine_distance(receiver.latitude, receiver.longitude, target_lat, target_lon)
        if distance > 50.0:
            raise ValueError(f"Distance exceeds 50 meters. Current distance is {distance:.2f} meters.")

        # Check party limit
        party_count = db.query(UserPokemon).filter(UserPokemon.user_id == receiver.id).count()
        if party_count >= 6:
            raise ValueError("Party is full. Maximum of 6 Pokemon allowed.")

    # Apply state transition
    adoption.status = new_status
    adoption.updated_at = datetime.utcnow()

    # If transitioning to ADOPTED, validate distance and lock the Pokemon entity
    if new_status == AdoptionStatus.ADOPTED:
        # Update pokemon to trigger optimistic lock verification
        # By modifying something on the pokemon instance (e.g. version_id),
        # SQLAlchemy evaluates __mapper_args__["version_id_col"] during flush.
        # This update block is necessary because optimistic locking in SA
        # happens when the locked row itself is updated or deleted.
        pokemon.version_id = pokemon.version_id + 1

        # Add to user's party
        user_pokemon = UserPokemon(user_id=receiver.id, pokemon_id=pokemon.pokemon_id, pokemon_entity_id=pokemon.id)
        db.add(user_pokemon)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    db.refresh(adoption)

    return adoption

def return_pokemon(db: Session, pokemon_entity_id: int, user: User) -> Adoption:
    """
    Returns an adopted Pokemon to the map.

    Args:
        db (Session): Database session.
        pokemon_entity_id (int): The ID of the Pokemon to return.
        user (User): The user returning the Pokemon.

    Raises:
        ValueError: If validation fails or the adoption record is not found.

    Returns:
        Adoption: The updated adoption record.
    """
    # Find the adoption record
    adoption = db.query(Adoption).filter(
        Adoption.pokemon_entity_id == pokemon_entity_id,
        Adoption.status == AdoptionStatus.ADOPTED,
        Adoption.receiver_user_id == user.user_id
    ).first()

    if not adoption:
        raise ValueError("Adoption record not found or not owned by user.")

    # Find the Pokemon entity
    pokemon = db.query(PokemonEntity).filter(PokemonEntity.id == pokemon_entity_id).first()
    if not pokemon:
        raise ValueError("Pokemon entity not found.")

    # Find the UserPokemon entry
    user_pokemon = db.query(UserPokemon).filter(
        UserPokemon.user_id == user.id,
        UserPokemon.pokemon_id == pokemon.pokemon_id
    ).first()

    if not user_pokemon:
        raise ValueError("Pokemon not found in user's party.")

    # Update state
    adoption.status = AdoptionStatus.NEW
    adoption.provider_user_id = user.user_id
    adoption.updated_at = datetime.utcnow()

    # Update Pokemon entity to match user's location and increment version_id
    pokemon.latitude = user.latitude
    pokemon.longitude = user.longitude
    pokemon.version_id = pokemon.version_id + 1

    # Remove from user's party
    db.delete(user_pokemon)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    db.refresh(adoption)

    return adoption


def get_available_adoptions(db: Session, pokemon_id: int = None, provider_name: str = None) -> list[Adoption]:
    """
    Fetches available adoptions (status NEW) optionally filtered by Pokemon ID and provider name.

    Args:
        db (Session): Database session.
        pokemon_id (int, optional): The ID of the Pokemon to filter by. Defaults to None.
        provider_name (str, optional): The user ID of the provider to filter by. Defaults to None.

    Returns:
        list[Adoption]: A list of available adoptions matching the criteria.
    """
    query = db.query(Adoption).join(PokemonEntity).filter(Adoption.status == AdoptionStatus.NEW)

    if pokemon_id is not None:
        query = query.filter(PokemonEntity.pokemon_id == pokemon_id)

    if provider_name is not None:
        query = query.outerjoin(User, Adoption.provider_user_id == User.user_id)
        query = query.filter(User.user_id.ilike(f"%{provider_name}%"))

    return query.all()
