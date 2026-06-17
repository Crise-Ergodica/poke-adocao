"""
Author: Aurora Drumond Costa Magalhães

Spatial service module to calculate bounding boxes and distances using the Haversine formula.
"""

import random
import math
from typing import Tuple

def generate_random_coordinates(lat, lon, radius_meters=100):
    """Gera coordenadas aleatorias dentro de um raio."""
    radius_in_degrees = radius_meters / 111320
    u = random.random()
    v = random.random()
    w = radius_in_degrees * math.sqrt(u)
    t = 2 * math.pi * v
    x = w * math.cos(t)
    y = w * math.sin(t)
    return lat + x, lon + y

def calculate_bounding_box(lat: float, lon: float, distance_m: float = 50.0) -> Tuple[float, float, float, float]:
    """
    Calculate the bounding box for a given latitude, longitude, and distance.

    Args:
        lat (float): The central latitude.
        lon (float): The central longitude.
        distance_m (float, optional): The distance in meters. Defaults to 50.0.

    Returns:
        Tuple[float, float, float, float]: The bounding box defined by
        (min_lat, max_lat, min_lon, max_lon).
    """
    earth_radius_m = 6371000.0

    # Coordinate offsets in radians
    lat_offset = distance_m / earth_radius_m
    lon_offset = distance_m / (earth_radius_m * math.cos(math.radians(lat)))

    # Convert offsets to degrees
    lat_offset_deg = math.degrees(lat_offset)
    lon_offset_deg = math.degrees(lon_offset)

    min_lat = lat - lat_offset_deg
    max_lat = lat + lat_offset_deg
    min_lon = lon - lon_offset_deg
    max_lon = lon + lon_offset_deg

    return min_lat, max_lat, min_lon, max_lon

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth (specified in decimal degrees)
    using the Haversine formula.

    Args:
        lat1 (float): Latitude of the first point.
        lon1 (float): Longitude of the first point.
        lat2 (float): Latitude of the second point.
        lon2 (float): Longitude of the second point.

    Returns:
        float: The distance between the two points in meters.
    """
    earth_radius_m = 6371000.0

    # Convert decimal degrees to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2

    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    distance = earth_radius_m * c

    return distance
