"""
Author: Aurora Drumond Costa Magalhães

Main FastAPI application defining spatial endpoints.
"""

from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Base, User, PokemonEntity
from app.schemas import LocationUpdate, NearbyResponse, UserSchema, PokemonEntitySchema, AdoptionCreate, AdoptionSchema, AdoptionUpdateStatus
from app.database import engine, get_db
from app.spatial_service import calculate_bounding_box, haversine_distance
from app.pokeapi_service import spawn_wild_pokemon
from app.adoption_service import create_adoption, transition_state
from app.models import AdoptionStatus

Base.metadata.create_all(bind=engine)

app = FastAPI()

@app.post("/api/v1/location/update")
def update_location(location: LocationUpdate, db: Session = Depends(get_db)):
    """
    Update the user's location if the accuracy is sufficient.
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


@app.get("/api/v1/map/nearby", response_model=NearbyResponse)
def get_nearby(latitude: float, longitude: float, db: Session = Depends(get_db)):
    """
    Get all users and pokemon within a 50m radius.
    First filters by bounding box for efficiency, then by exact Haversine distance.
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

from pydantic import BaseModel

class SpawnRequest(BaseModel):
    latitude: float
    longitude: float

@app.post("/api/v1/map/spawn", response_model=PokemonEntitySchema)
async def spawn_pokemon_endpoint(request: SpawnRequest, db: Session = Depends(get_db)):
    """
    Spawn a wild Pokemon at the given coordinates.
    """
    return await spawn_wild_pokemon(db, request.latitude, request.longitude)


@app.post("/api/v1/adoptions/initiate", response_model=AdoptionSchema)
def initiate_adoption_endpoint(adoption_create: AdoptionCreate, db: Session = Depends(get_db)):
    """
    Initiate an adoption process.
    """
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
    """
    try:
        adoption = transition_state(db, adoption_id, AdoptionStatus.ADOPTED)
        return adoption
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
