"""
Author: Aurora Drumond Costa Magalhães

Service to manage the Finite State Machine (FSM) for Pokemon adoptions.
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models import Adoption, AdoptionStatus, PokemonEntity, User, UserPokemon
from app.spatial_service import haversine_distance

def create_adoption(db: Session, pokemon_entity_id: int, receiver_user_id: str, provider_user_id: str = None) -> Adoption:
    """
    Initiates an adoption process by creating a new record with status NEW.

    Args:
        db (Session): Database session.
        pokemon_entity_id (int): The ID of the Pokemon to adopt.
        receiver_user_id (str): The ID of the user receiving.
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
        user_pokemon = UserPokemon(user_id=receiver.id, pokemon_id=pokemon.pokemon_id)
        db.add(user_pokemon)

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

    db.refresh(adoption)

    return adoption
