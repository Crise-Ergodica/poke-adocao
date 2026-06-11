/**
 * Author: Aurora Drumond Costa Magalhães
 *
 * Service to handle authentication API calls.
 */

const API_URL = 'http://localhost:8000/api/v1/auth'; // Adjust as needed for local network

export const login = async (username: string) => {
  const response = await fetch(`${API_URL}/login`, {
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
