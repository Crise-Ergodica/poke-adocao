/**
 * Author: Aurora Drumond Costa Magalhães
 *
 * Service to handle authentication API calls.
 */

const API_URL = 'http://localhost:8000/api/v1'; // Adjust as needed for local network

export const login = async (username: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to login');
  }

  return response.json();
};

export const updateIcon = async (userId: string, iconUrl: string) => {
  const response = await fetch(`${API_URL}/users/${userId}/icon`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      icon_url: iconUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to update icon');
  }

  return response.json();
};
