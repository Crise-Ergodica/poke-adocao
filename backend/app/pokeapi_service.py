"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington

Service to integrate with PokeAPI and spawn wild Pokemon.
"""

import httpx
import random
import math
from fastapi import HTTPException
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models import PokemonEntity

async def spawn_wild_pokemon(db: Session, latitude: float, longitude: float) -> PokemonEntity:
    """
    Spawns a wild Pokemon at the given coordinates with spatial jitter and saves to DB.

    Args:
        db (Session): Database session.
        latitude (float): Base latitude.
        longitude (float): Base longitude.

    Returns:
        PokemonEntity: The spawned Pokemon entity.
    """
    # 1. Roll a random ID (1 to 151 for MVP)
    pokemon_id = random.randint(1, 151)

    # 2. Fetch data from PokeAPI
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
    sprite_url = None
    type_1 = "unknown"
    type_2 = None
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            sprite_url = data.get("sprites", {}).get("front_default")

            types = data.get("types", [])
            if len(types) > 0:
                type_1 = types[0].get("type", {}).get("name", "unknown")
            if len(types) > 1:
                type_2 = types[1].get("type", {}).get("name")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail="PokeAPI is currently unavailable.")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=503, detail="PokeAPI returned an error.")

    is_shiny = random.random() < 0.05
    gender = random.choice(["male", "female", "genderless"])

    # 3. Add spatial jitter (~5 to 10 meters)
    # 1 degree of latitude is ~111,320 meters.
    # 1 degree of longitude is ~111,320 * cos(latitude) meters.
    # 5-10 meters is approximately 0.000045 to 0.000090 degrees.
    jitter_lat_m = random.uniform(5, 10) * random.choice([-1, 1])
    jitter_lon_m = random.uniform(5, 10) * random.choice([-1, 1])

    earth_radius_m = 6371000.0

    # Coordinate offsets in radians
    lat_offset_rad = jitter_lat_m / earth_radius_m
    lon_offset_rad = jitter_lon_m / (earth_radius_m * math.cos(math.radians(latitude)))

    # Convert to degrees
    jitter_lat_deg = math.degrees(lat_offset_rad)
    jitter_lon_deg = math.degrees(lon_offset_rad)

    new_latitude = latitude + jitter_lat_deg
    new_longitude = longitude + jitter_lon_deg

    # 4. Define expires_at (12 hours TTL)
    now = datetime.utcnow()
    expires_at = now + timedelta(hours=12)

    entity = PokemonEntity(
        pokemon_id=pokemon_id,
        latitude=new_latitude,
        longitude=new_longitude,
        sprite_url=sprite_url,
        is_shiny=is_shiny,
        gender=gender,
        type_1=type_1,
        type_2=type_2,
        created_at=now,
        expires_at=expires_at
    )

    db.add(entity)
    db.commit()
    db.refresh(entity)

    return entity
