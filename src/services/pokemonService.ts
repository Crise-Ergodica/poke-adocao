/**
 * Author: Aurora Drumond Costa Magalhães
 *
 * Service to handle Pokemon API calls.
 */

const API_URL = 'http://localhost:8000/api/v1/map'; // Adjust as needed

export const spawnPokemon = async (latitude: number, longitude: number) => {
  const response = await fetch(`${API_URL}/spawn`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to spawn Pokemon');
  }

  return response.json();
};

export const getNearby = async (latitude: number, longitude: number) => {
  const response = await fetch(`${API_URL}/nearby?latitude=${latitude}&longitude=${longitude}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to fetch nearby entities');
  }

  return response.json();
};
