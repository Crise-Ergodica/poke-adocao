"""
Author: Aurora Drumond Costa Magalhães

Unit tests for PokeAPI service.
"""

import pytest
import httpx
from fastapi import HTTPException
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

from app.pokeapi_service import spawn_wild_pokemon

@pytest.mark.asyncio
@patch('app.pokeapi_service.httpx.AsyncClient.get')
async def test_spawn_wild_pokemon_success(mock_get):
    """
    Test spawning a wild pokemon successfully.

    Args:
        mock_get: The mocked HTTP GET method.

    Returns:
        None
    """
    mock_db = MagicMock()

    # Mock the HTTP response
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "id": 25,
        "name": "pikachu",
        "sprites": {
            "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
        }
    }
    mock_get.return_value = mock_response

    lat = -23.550520
    lon = -46.633308

    pokemon_entity = await spawn_wild_pokemon(mock_db, lat, lon)

    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

    # Verify ID is within 1-151
    assert 1 <= pokemon_entity.pokemon_id <= 151

    # Verify spatial jitter (it shouldn't be exactly the same coordinate)
    assert pokemon_entity.latitude != lat
    assert pokemon_entity.longitude != lon

    # Check if the jitter is within reasonable bounds (5-10m roughly corresponds to 0.000045 - 0.000090 degrees)
    lat_diff = abs(pokemon_entity.latitude - lat)
    lon_diff = abs(pokemon_entity.longitude - lon)
    assert 0.000010 <= lat_diff <= 0.000200 # Giving a safe margin
    assert 0.000010 <= lon_diff <= 0.000200

    # Verify sprite_url was parsed
    assert pokemon_entity.sprite_url == "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"

    # Verify TTL is ~12 hours
    now = datetime.utcnow()
    expected_expires_at = now + timedelta(hours=12)
    diff = abs((pokemon_entity.expires_at - expected_expires_at).total_seconds())
    assert diff < 5  # Allow up to 5 seconds difference for execution time

@pytest.mark.asyncio
@patch('app.pokeapi_service.httpx.AsyncClient.get')
async def test_spawn_wild_pokemon_failure(mock_get):
    """
    Test spawning a wild pokemon when PokeAPI fails.

    Args:
        mock_get: The mocked HTTP GET method.

    Returns:
        None
    """
    mock_db = MagicMock()

    # Mock the HTTP request error
    mock_get.side_effect = httpx.RequestError("Network Error", request=MagicMock())

    lat = -23.550520
    lon = -46.633308

    with pytest.raises(HTTPException) as exc_info:
        await spawn_wild_pokemon(mock_db, lat, lon)

    assert exc_info.value.status_code == 503
    assert exc_info.value.detail == "PokeAPI is currently unavailable."

    mock_db.add.assert_not_called()
