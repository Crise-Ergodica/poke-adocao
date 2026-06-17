/**
 * Author: Aurora Drumond Magalhães, Ana Clara de Souza e Kayke Wellington
 *
 * Service to handle Pokemon API calls.
 */

const API_URL = 'http://localhost:8000/api/v1/map';

export const spawnPokemon = async (lat: number, lon: number, token: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/spawn?latitude=${lat}&longitude=${lon}`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to spawn Pokemon');
  }

  return response.json();
};

export const getNearby = async (
  latitude: number,
  longitude: number,
  token: string | null = null,
) => {
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
