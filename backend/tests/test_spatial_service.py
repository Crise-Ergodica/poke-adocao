"""
Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington

Tests for the spatial service, covering Haversine distance and Bounding Box calculations.
"""

import pytest
from app.spatial_service import haversine_distance, calculate_bounding_box

def test_haversine_distance():
    """
    Test that the Haversine formula correctly calculates the distance
    between two known points.

    Returns:
        None
    """
    # Coordinates of New York City and Los Angeles
    nyc_lat, nyc_lon = 40.7128, -74.0060
    la_lat, la_lon = 34.0522, -118.2437

    # Expected distance is around 3935 km ~ 3,935,000 meters
    distance = haversine_distance(nyc_lat, nyc_lon, la_lat, la_lon)

    # Distance should be within a reasonable margin of error (1%)
    assert 3900000 < distance < 3980000

def test_haversine_close_distance():
    """
    Test small distance calculation.

    Returns:
        None
    """
    # Roughly 50 meters apart
    lat1, lon1 = 0.0, 0.0
    lat2, lon2 = 0.00045, 0.0 # ~50 meters along meridian

    distance = haversine_distance(lat1, lon1, lat2, lon2)

    assert 49.0 < distance < 51.0

def test_calculate_bounding_box():
    """
    Test bounding box calculation.

    Returns:
        None
    """
    lat, lon = 0.0, 0.0
    distance_m = 50

    min_lat, max_lat, min_lon, max_lon = calculate_bounding_box(lat, lon, distance_m)

    assert min_lat < lat < max_lat
    assert min_lon < lon < max_lon

    # Verify that the corners are slightly further than 50m
    corner_distance = haversine_distance(lat, lon, min_lat, min_lon)
    assert corner_distance > 50.0

    # Verify that the boundaries are exactly 50m away in cardinal directions
    north_distance = haversine_distance(lat, lon, max_lat, lon)
    assert 49.9 < north_distance < 50.1

def test_rejects_entities_at_51m():
    """
    Verify the rejection logic for entities outside the 50m radius limit.

    Returns:
        None
    """
    lat1, lon1 = 0.0, 0.0
    lat2, lon2 = 0.00046, 0.0 # ~51 meters

    distance = haversine_distance(lat1, lon1, lat2, lon2)
    assert distance > 50.0
