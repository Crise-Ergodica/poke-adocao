/**
 * Author: Aurora Drumond Costa Magalhães
 *
 * Service to handle Pokemon API calls.
 */

const API_URL = 'http://localhost:8000/api/v1/map'; // Adjust as needed

export const spawnPokemon = async (latitude: number, longitude: number, token: string | null = null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/spawn`, {
    method: 'POST',
    headers,
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

export const getNearby = async (latitude: number, longitude: number, token: string | null = null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/nearby?latitude=${latitude}&longitude=${longitude}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to fetch nearby entities');
  }

  return response.json();
};
