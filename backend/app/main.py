"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington

Main FastAPI application defining spatial endpoints.
"""
import httpx
from typing import List, Optional

import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import User, UserPokemon, PokemonEntity, Adoption, AdoptionStatus
from app.schemas import (
    LocationUpdate,
    NearbyResponse,
    UserSchema,
    PokemonEntitySchema,
    AdoptionCreate,
    AdoptionSchema,
    AdoptionUpdateStatus,
    UserCreate,
    UserLogin,
    Token,
    PokemonRenameRequest,
    UsernameUpdate,
    PasswordUpdate,
    CompanionUpdate,
)
from app.database import engine, get_db, SessionLocal, Base
from app.spatial_service import calculate_bounding_box, haversine_distance
from app.pokeapi_service import spawn_wild_pokemon
from app.adoption_service import create_adoption, transition_state, return_pokemon, get_available_adoptions
from app.models import AdoptionStatus
from pydantic import BaseModel
from app.auth_service import register_user, authenticate_user, create_access_token, SECRET_KEY, ALGORITHM, get_password_hash
from fastapi.security import OAuth2PasswordBearer
import jwt
import logging

logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI()


async def pokemon_spawner_task():
    """
    Background task to spawn wild Pokemon every 3 minutes.
    Generates Pokemon around active users (last updated within 30 minutes).
    If no active users are found, defaults to Timoteo, MG (-19.5312, -42.6105).
    Spawns occur within a 150-meter radius (approx. 0.00135 degrees).
    """
    import random
    import math

    default_lat = -19.5312
    default_lon = -42.6105
    radius_degrees = 0.00135  # ~150 meters

    while True:
        await asyncio.sleep(180) # 3 minutes

        db = SessionLocal()
        try:
            # Find active users (updated within last 30 minutes)
            time_threshold = datetime.now() - timedelta(minutes=30)
            active_users = db.query(User).filter(
                User.last_updated != None,
                User.last_updated >= time_threshold
            ).all()

            if active_users:
                # Spawn around each active user
                for user in active_users:
                    # Random coordinate within 150m radius
                    u = random.random()
                    v = random.random()
                    w = radius_degrees * math.sqrt(u)
                    t = 2 * math.pi * v
                    x = w * math.cos(t)
                    y = w * math.sin(t)

                    # Adjust longitude for latitude
                    x = x / math.cos(math.radians(user.latitude))

                    new_lat = user.latitude + y
                    new_lon = user.longitude + x

                    try:
                        await spawn_wild_pokemon(db, new_lat, new_lon)
                    except Exception as e:
                        logger.error(f"Error occurred while spawning wild Pokémon for user {user.user_id}: {e}")
            else:
                # No active users, fallback to default coordinates
                u = random.random()
                v = random.random()
                w = radius_degrees * math.sqrt(u)
                t = 2 * math.pi * v
                x = w * math.cos(t)
                y = w * math.sin(t)

                # Adjust longitude for latitude
                x = x / math.cos(math.radians(default_lat))

                new_lat = default_lat + y
                new_lon = default_lon + x

                try:
                    await spawn_wild_pokemon(db, new_lat, new_lon)
                except Exception as e:
                    pass

        except Exception as e:
            # Silently handle or log errors so the loop doesn't crash
            pass
        finally:
            db.close()

@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(pokemon_spawner_task())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """
    Extracts and validates the JWT token to return the current authenticated user.

    Args:
        token (str): The JWT access token.
        db (Session): The database session.

    Raises:
        HTTPException: If the token is invalid or user not found.

    Returns:
        User: The authenticated user object.
    """
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/api/v1/users/{user_id}", response_model=UserSchema)
def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    """
    Get a user's profile and their adopted party.

    Args:
        user_id (str): The unique ID of the user.
        db (Session): The database session.

    Raises:
        HTTPException: If the user is not found.

    Returns:
        UserSchema: The user profile including their party.
    """
    from sqlalchemy.orm import joinedload
    user = db.query(User).options(joinedload(User.party)).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@app.post("/api/v1/auth/register", response_model=UserSchema)
def register_endpoint(request: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        request (UserCreate): The user registration details.
        db (Session): The database session.

    Returns:
        UserSchema: The newly created user.
    """
    return register_user(db, request)

@app.post("/api/v1/auth/login", response_model=Token)
def login_endpoint(request: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT.
    """
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    
    # Retorne os dados do perfil recém-extraídos do banco
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user_id": user.user_id,
        "icon_url": user.icon_url,
        "companion_pokemon_id": user.companion_pokemon_id
    }

@app.post("/api/v1/location/update")
def update_location(location: LocationUpdate, db: Session = Depends(get_db)):
    # Aumentado para 500m para permitir testes em ambientes fechados (escritórios/casas)
    if location.accuracy > 500.0:
        raise HTTPException(status_code=400, detail="Accuracy insufficient. Must be <= 500m.")

    user = db.query(User).filter(User.user_id == location.userId).first()
    
    # Consolidado para UTC, mesma base de tempo usada no PokeAPI Service
    now_utc = datetime.utcnow()

    if user:
        user.latitude = location.latitude
        user.longitude = location.longitude
        user.last_updated = now_utc
    else:
        user = User(
            user_id=location.userId,
            latitude=location.latitude,
            longitude=location.longitude,
            last_updated=now_utc
        )
        db.add(user)

    db.commit()
    return {"message": "Location updated successfully"}

class IconUpdateRequest(BaseModel):
    icon_url: str

@app.patch("/api/v1/users/{user_id}/icon", response_model=UserSchema)
def update_user_icon(
    user_id: str, 
    request: IconUpdateRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's icon URL.

    Args:
        user_id (str): The ID of the user.
        request (IconUpdateRequest): The new icon URL.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the user is not found or unauthorized.

    Returns:
        UserSchema: The updated user entity.
    """
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.icon_url = request.icon_url
    db.commit()
    db.refresh(user)
    return user


@app.get("/api/v1/map/nearby", response_model=NearbyResponse)
def get_nearby(latitude: float, longitude: float, db: Session = Depends(get_db)):
    """
    Get all users and pokemon within a 150m radius.
    First filters by bounding box for efficiency, then by exact Haversine distance.

    Args:
        latitude (float): Center latitude.
        longitude (float): Center longitude.
        db (Session): The database session.

    Returns:
        NearbyResponse: An object containing nearby users and pokemon.
    """
    distance_limit = 150.0
    min_lat, max_lat, min_lon, max_lon = calculate_bounding_box(latitude, longitude, distance_limit)

    # Bounding box filter
    box_users = db.query(User).filter(
        User.latitude >= min_lat,
        User.latitude <= max_lat,
        User.longitude >= min_lon,
        User.longitude <= max_lon
    ).all()

    box_pokemon = db.query(PokemonEntity).outerjoin(
        UserPokemon, PokemonEntity.id == UserPokemon.pokemon_entity_id
    ).filter(
        PokemonEntity.latitude >= min_lat,
        PokemonEntity.latitude <= max_lat,
        PokemonEntity.longitude >= min_lon,
        PokemonEntity.longitude <= max_lon,
        UserPokemon.id.is_(None) # <-- O filtro crucial: exige que a relação com um utilizador seja nula
    ).all()

    # Exact distance filter
    nearby_users = []
    for u in box_users:
        if haversine_distance(latitude, longitude, u.latitude, u.longitude) <= distance_limit:
            nearby_users.append(u)

    nearby_pokemon = []
    for p in box_pokemon:
        if haversine_distance(latitude, longitude, p.latitude, p.longitude) <= distance_limit:
            nearby_pokemon.append(p)

    return {
        "users": nearby_users,
        "pokemon": nearby_pokemon
    }

class SpawnRequest(BaseModel):
    latitude: float
    longitude: float

@app.patch("/api/v1/users/pokemon/{id}/name")
def rename_pokemon(
    id: int,
    request: PokemonRenameRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rename a pokemon in the user's party.

    Args:
        id (int): The ID of the pokemon in the user's party.
        request (PokemonRenameRequest): The rename request data.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the pokemon is not found or user is not authorized.

    Returns:
        dict: A success message.
    """
    from app.models import UserPokemon
    user_pokemon = db.query(UserPokemon).filter(UserPokemon.id == id).first()
    if not user_pokemon:
        raise HTTPException(status_code=404, detail="Pokemon not found in party")
    if user_pokemon.user.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to rename this pokemon")

    try:
        # Since we cannot add a schema field to UserPokemon, but must rename
        user_pokemon.name = request.name
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to rename pokemon")

    return {"message": "Pokemon renamed successfully"}


@app.post("/api/v1/users/pokemon/{id}/list_for_adoption")
def list_pokemon_for_adoption(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List a pokemon from the user's party for public adoption.

    Args:
        id (int): The ID of the pokemon in the user's party.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the pokemon is not found, user is not authorized, or entity is missing.

    Returns:
        dict: A success message.
    """
    from app.models import UserPokemon, PokemonEntity
    user_pokemon = db.query(UserPokemon).filter(UserPokemon.id == id).first()
    if not user_pokemon:
        raise HTTPException(status_code=404, detail="Pokemon not found in party")
    if user_pokemon.user.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to list this pokemon")

    entity = db.query(PokemonEntity).filter(PokemonEntity.id == user_pokemon.pokemon_entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Pokemon Entity not found")

    entity.latitude = current_user.latitude
    entity.longitude = current_user.longitude
    entity.version_id = entity.version_id + 1

    create_adoption(
        db,
        pokemon_entity_id=entity.id,
        receiver_user_id=None,
        provider_user_id=current_user.user_id
    )

    db.delete(user_pokemon)
    db.commit()

    return {"message": "Pokemon listed for adoption successfully"}

@app.delete("/api/v1/users/pokemon/{id}")
def release_pokemon(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Abandon or release a pokemon from the user's party.

    Args:
        id (int): The ID of the pokemon in the user's party.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the pokemon is not found or user is not authorized.

    Returns:
        dict: A success message.
    """
    from app.models import UserPokemon
    user_pokemon = db.query(UserPokemon).filter(UserPokemon.id == id).first()
    if not user_pokemon:
        raise HTTPException(status_code=404, detail="Pokemon not found in party")
    if user_pokemon.user.user_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized to release this pokemon")

    db.delete(user_pokemon)
    db.commit()

    return {"message": "Pokemon released successfully"}


@app.post("/api/v1/map/spawn", response_model=PokemonEntitySchema)
async def spawn_pokemon_endpoint(request: SpawnRequest, db: Session = Depends(get_db)):
    """
    Spawn a wild Pokemon at the given coordinates.

    Args:
        request (SpawnRequest): The spawn request data containing coordinates.
        db (Session): The database session.

    Returns:
        PokemonEntitySchema: The spawned pokemon entity.
    """
    return await spawn_wild_pokemon(db, request.latitude, request.longitude)


@app.post("/api/v1/adoptions/initiate", response_model=AdoptionSchema)
def initiate_adoption_endpoint(
    adoption_create: AdoptionCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """
    Initiate an adoption process.

    Args:
        adoption_create (AdoptionCreate): The adoption creation payload.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Returns:
        AdoptionSchema: The initiated adoption object.
    """
    if current_user.user_id != adoption_create.receiver_user_id and current_user.user_id != adoption_create.provider_user_id:
         raise HTTPException(status_code=403, detail="Not authorized to initiate this adoption")

    return create_adoption(
        db,
        pokemon_entity_id=adoption_create.pokemon_entity_id,
        receiver_user_id=adoption_create.receiver_user_id,
        provider_user_id=adoption_create.provider_user_id
    )

@app.post("/api/v1/adoptions/{adoption_id}/accept", response_model=AdoptionSchema)
def accept_adoption_endpoint(adoption_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Accept a public adoption listing.

    Args:
        adoption_id (int): The ID of the adoption to accept.
        db (Session): The database session.
        current_user (User): The authenticated user claiming the adoption.

    Raises:
        HTTPException: If the adoption is already claimed or not found.

    Returns:
        AdoptionSchema: The finalized adoption object.
    """
    from app.models import Adoption, UserPokemon
    
    adoption = db.query(Adoption).filter(Adoption.id == adoption_id).first()
    if not adoption:
        raise HTTPException(status_code=404, detail="Adoption not found")

    # Allow the current user to retry a stuck transaction, block other users
    if adoption.receiver_user_id is not None and adoption.receiver_user_id != current_user.user_id:
        raise HTTPException(status_code=400, detail="Adoption is already claimed")

    # Assign ownership in memory ONLY. Do not commit prematurely.
    adoption.receiver_user_id = current_user.user_id

    existing_ids = [up.id for up in db.query(UserPokemon).filter(UserPokemon.user_id == current_user.id).all()]

    try:
        updated_adoption = transition_state(db, adoption_id, AdoptionStatus.ADOPTED, ignore_distance=True)

        new_user_pokemon = db.query(UserPokemon).filter(
            UserPokemon.user_id == current_user.id,
            ~UserPokemon.id.in_(existing_ids)
        ).first()

        if new_user_pokemon:
            new_user_pokemon.pokemon_entity_id = updated_adoption.pokemon_entity_id
            db.commit()

        return updated_adoption
    except ValueError as e:
        # Rollback the session to clear the uncommitted receiver_user_id assignment
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@app.patch("/api/v1/adoptions/{adoption_id}/finalize", response_model=AdoptionSchema)
def finalize_adoption_endpoint(adoption_id: int, db: Session = Depends(get_db)):
    """
    Finalize an adoption process.

    Args:
        adoption_id (int): The ID of the adoption to finalize.
        db (Session): The database session.

    Raises:
        HTTPException: If the state transition is invalid.

    Returns:
        AdoptionSchema: The finalized adoption object.
    """
    try:
        adoption = transition_state(db, adoption_id, AdoptionStatus.ADOPTED)
        return adoption
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/v1/adoptions/{pokemon_entity_id}/return", response_model=AdoptionSchema)
def return_pokemon_endpoint(
    pokemon_entity_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return a fostered Pokemon to the map.

    Args:
        pokemon_entity_id (int): The ID of the Pokemon entity to return.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the user cannot return the Pokemon.

    Returns:
        AdoptionSchema: The updated adoption object.
    """
    try:
        adoption = return_pokemon(db, pokemon_entity_id, current_user)
        return adoption
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/v1/adoptions/available", response_model=List[AdoptionSchema])
async def get_available_adoptions_endpoint(
    pokemon_name: Optional[str] = None,
    provider_name: Optional[str] = None,
    type: Optional[str] = None,
    is_shiny: Optional[bool] = None,
    gender: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Get a list of available adoptions.

    Observação importante:
    O model Adoption possui a relação chamada pokemon_entity,
    mas o schema AdoptionSchema espera o campo pokemon.

    Por isso o retorno é montado manualmente, copiando:
    adoption.pokemon_entity -> pokemon

    Isso permite que o frontend receba:
    adoption.pokemon.pokemon_id
    adoption.pokemon.type_1
    adoption.pokemon.gender
    adoption.pokemon.is_shiny
    """
    pokemon_id = None

    if pokemon_name:
        if pokemon_name.isdigit():
            pokemon_id = int(pokemon_name)
        else:
            return []

    from sqlalchemy import or_
    from sqlalchemy.orm import joinedload

    query = (
        db.query(Adoption)
        .options(joinedload(Adoption.pokemon_entity))
        .join(PokemonEntity)
        .filter(Adoption.status == AdoptionStatus.NEW)
    )

    if pokemon_id is not None:
        query = query.filter(PokemonEntity.pokemon_id == pokemon_id)

    if provider_name is not None:
        query = query.outerjoin(User, Adoption.provider_user_id == User.user_id)
        query = query.filter(User.user_id.ilike(f"%{provider_name}%"))

    if type:
        query = query.filter(or_(PokemonEntity.type_1 == type, PokemonEntity.type_2 == type))

    if is_shiny is not None:
        query = query.filter(PokemonEntity.is_shiny == is_shiny)

    if gender:
        query = query.filter(PokemonEntity.gender == gender)

    adoptions = query.all()

    return [
        {
            "id": adoption.id,
            "pokemon_entity_id": adoption.pokemon_entity_id,
            "provider_user_id": adoption.provider_user_id,
            "receiver_user_id": adoption.receiver_user_id,
            "status": adoption.status,
            "created_at": adoption.created_at,
            "updated_at": adoption.updated_at,
            "pokemon": adoption.pokemon_entity,
        }
        for adoption in adoptions
    ]

# --- # LEGACY CODE, REPLACED BY "async def spawn_pokemon_endpoint" ---
# @app.post("/api/v1/map/spawn")
# async def spawn_pokemon(latitude: float, longitude: float, db: Session = Depends(get_db)):
#     new_lat, new_lon = generate_random_coordinates(latitude, longitude)
    
#     pokemon_data = await fetch_random_pokemon()
    
#     new_pokemon = PokemonEntity(
#         pokemon_id=pokemon_data['id'],
#         latitude=new_lat,
#         longitude=new_lon,
#         sprite_url=pokemon_data['sprites']['front_default'],
#         is_shiny=random.random() < 0.1, # 10% de chance de ser shiny
#         type_1=pokemon_data['types'][0]['type']['name']
#     )
    
#     db.add(new_pokemon)
#     db.commit()
#     return {"message": "Spawned", "pokemon": new_pokemon.pokemon_id}

@app.patch("/api/v1/users/{user_id}/username", response_model=UserSchema)
def update_user_username(
    user_id: str,
    request: UsernameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's username.

    Args:
        user_id (str): The ID of the user.
        request (UsernameUpdate): The new username data.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the user is unauthorized or the username is already taken.

    Returns:
        UserSchema: The updated user entity.
    """
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    existing_user = db.query(User).filter(User.user_id == request.username).first()
    if existing_user and existing_user.id != current_user.id:
        raise HTTPException(status_code=400, detail="Username already taken")

    current_user.user_id = request.username
    db.commit()
    db.refresh(current_user)
    return current_user

@app.patch("/api/v1/users/{user_id}/password")
def update_user_password(
    user_id: str,
    request: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's password.

    Args:
        user_id (str): The ID of the user.
        request (PasswordUpdate): The new password data.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the user is unauthorized.

    Returns:
        dict: A success message.
    """
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    current_user.hashed_password = get_password_hash(request.password)
    db.commit()
    return {"message": "Password updated successfully"}

@app.patch("/api/v1/users/{user_id}/companion", response_model=UserSchema)
def update_user_companion(
    user_id: str,
    request: CompanionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the user's companion pokemon.

    Args:
        user_id (str): The ID of the user.
        request (CompanionUpdate): The new companion pokemon data.
        db (Session): The database session.
        current_user (User): The authenticated user.

    Raises:
        HTTPException: If the user is unauthorized.

    Returns:
        UserSchema: The updated user entity.
    """
    if current_user.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this user")

    current_user.companion_pokemon_id = request.companion_pokemon_id
    db.commit()
    db.refresh(current_user)
    return current_user