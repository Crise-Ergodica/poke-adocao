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
from fastapi.concurrency import run_in_threadpool
import logging

logger = logging.getLogger(__name__)

async def spawn_wild_pokemon(db: Session, latitude: float, longitude: float) -> PokemonEntity:
    pokemon_id = random.randint(1, 151)
    url = f"https://pokeapi.co/api/v2/pokemon/{pokemon_id}"
    
    # Previsibilidade (Fallback): Se a API falhar, deduzimos a URL da imagem.
    sprite_url = f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pokemon_id}.png"
    type_1 = "unknown"
    type_2 = None
    
    pokemon_name = "unknown"

    try:
        # Timeout obrigatório para impedir gargalo na task
        async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
            
            sprite_url = data.get("sprites", {}).get("front_default") or sprite_url
            
            # 1. Intercepta o nome direto da PokeAPI
            pokemon_name = data.get("name", "unknown").capitalize() 

            types = data.get("types", [])

            if len(types) > 0:
                type_1 = types[0].get("type", {}).get("name", "unknown")
            if len(types) > 1:
                type_2 = types[1].get("type", {}).get("name")
    except Exception as e:
        logger.warning(f"PokeAPI falhou. Gerando pokemon {pokemon_id} com dados mínimos. Erro: {e}")

    is_shiny = random.random() < 0.05
    gender = random.choice(["male", "female", "genderless"])

    # Jitter espacial
    jitter_lat_m = random.uniform(5, 10) * random.choice([-1, 1])
    jitter_lon_m = random.uniform(5, 10) * random.choice([-1, 1])
    earth_radius_m = 6371000.0
    lat_offset_rad = jitter_lat_m / earth_radius_m
    lon_offset_rad = jitter_lon_m / (earth_radius_m * math.cos(math.radians(latitude)))



    new_latitude = latitude + math.degrees(lat_offset_rad)
    new_longitude = longitude + math.degrees(lon_offset_rad)

    now = datetime.utcnow()
    expires_at = now + timedelta(hours=12)

    entity = PokemonEntity(
        pokemon_id=pokemon_id,
        name=pokemon_name, 
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

    # Isolando a transação síncrona do banco para não congelar o servidor FastAPI
    def db_transaction():
        db.add(entity)
        db.commit()
        db.refresh(entity)
    
    await run_in_threadpool(db_transaction)

    return entity