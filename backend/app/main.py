import httpx
from typing import List, Optional
"""
Author: Aurora Drumond Costa Magalhães

Main FastAPI application defining spatial endpoints.
"""

import asyncio
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Base, User, PokemonEntity
from app.schemas import LocationUpdate, NearbyResponse, UserSchema, PokemonEntitySchema, AdoptionCreate, AdoptionSchema, AdoptionUpdateStatus, UserCreate, UserLogin, Token
from app.database import engine, get_db, SessionLocal
from app.spatial_service import calculate_bounding_box, haversine_distance
from app.pokeapi_service import spawn_wild_pokemon
from app.adoption_service import create_adoption, transition_state, return_pokemon, get_available_adoptions
from app.models import AdoptionStatus
from pydantic import BaseModel
from app.auth_service import register_user, authenticate_user, create_access_token, SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer
import jwt


Base.metadata.create_all(bind=engine)

app = FastAPI()


async def pokemon_spawner_task():
    """
    Background task to spawn wild Pokemon every 5 minutes
    within a 2km radius of Timoteo, MG (-19.5312, -42.6105).
    """
    import random
    import math
    base_lat = -19.5312
    base_lon = -42.6105
    radius_km = 2.0

    while True:
        await asyncio.sleep(300) # 5 minutes

        # Generate random coordinates within radius
        # 1 degree lat is ~111km. So 2km is ~0.018 degrees.
        # Use simple approximation
        r = radius_km / 111.320
        u = random.random()
        v = random.random()
        w = r * math.sqrt(u)
        t = 2 * math.pi * v
        x = w * math.cos(t)
        y = w * math.sin(t)

        # Adjust longitude for latitude
        x = x / math.cos(math.radians(base_lat))

        new_lat = base_lat + y
        new_lon = base_lon + x

        db = SessionLocal()
        try:
            await spawn_wild_pokemon(db, new_lat, new_lon)
        except Exception as e:
            # Silently handle or log errors so the loop doesn't crash
            pass
        finally:
            db.close()

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

    Args:
        request (UserLogin): The login request containing email and password.
        db (Session): The database session.

    Raises:
        HTTPException: If authentication fails.

    Returns:
        Token: The access token response.
    """
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/location/update")
def update_location(location: LocationUpdate, db: Session = Depends(get_db)):
    """
    Update the user's location if the accuracy is sufficient.

    Args:
        location (LocationUpdate): The location update data.
        db (Session): The database session.

    Raises:
        HTTPException: If accuracy is > 50m.

    Returns:
        dict: A success message.
    """
    if location.accuracy > 50.0:
        raise HTTPException(status_code=400, detail="Accuracy insufficient. Must be <= 50m.")

    user = db.query(User).filter(User.user_id == location.userId).first()

    if user:
        user.latitude = location.latitude
        user.longitude = location.longitude
        user.last_updated = datetime.now()
    else:
        user = User(
            user_id=location.userId,
            latitude=location.latitude,
            longitude=location.longitude,
            last_updated=datetime.now()
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
    Get all users and pokemon within a 50m radius.
    First filters by bounding box for efficiency, then by exact Haversine distance.

    Args:
        latitude (float): Center latitude.
        longitude (float): Center longitude.
        db (Session): The database session.

    Returns:
        NearbyResponse: An object containing nearby users and pokemon.
    """
    distance_limit = 50.0
    min_lat, max_lat, min_lon, max_lon = calculate_bounding_box(latitude, longitude, distance_limit)

    # Bounding box filter
    box_users = db.query(User).filter(
        User.latitude >= min_lat,
        User.latitude <= max_lat,
        User.longitude >= min_lon,
        User.longitude <= max_lon
    ).all()

    box_pokemon = db.query(PokemonEntity).filter(
        PokemonEntity.latitude >= min_lat,
        PokemonEntity.latitude <= max_lat,
        PokemonEntity.longitude >= min_lon,
        PokemonEntity.longitude <= max_lon
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
    db: Session = Depends(get_db)
):
    """
    Get a list of available adoptions.

    Args:
        pokemon_name (Optional[str]): Optional Pokemon name to filter by.
        provider_name (Optional[str]): Optional provider name to filter by.
        db (Session): Database session.

    Returns:
        List[AdoptionSchema]: A list of available adoptions.
    """
    pokemon_id = None
    if pokemon_name:
        url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_name.lower()}"
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(url)
                if response.status_code == 404:
                    return []
                response.raise_for_status()
                data = response.json()
                pokemon_id = data.get("id")
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="PokeAPI is currently unavailable.")
        except httpx.HTTPStatusError:
            raise HTTPException(status_code=503, detail="PokeAPI returned an error.")

    adoptions = get_available_adoptions(db, pokemon_id=pokemon_id, provider_name=provider_name)
    return adoptions
