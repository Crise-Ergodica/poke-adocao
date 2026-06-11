/**
 * Author: Aurora Drumond Costa Magalhães
 *
 * Service to handle adoption API calls.
 */

const API_URL = 'http://localhost:8000/api/v1/adoptions'; // Adjust as needed for local network

export const initiateAdoption = async (pokemon_entity_id: number, receiver_user_id: string, provider_user_id?: string) => {
  const response = await fetch(`${API_URL}/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pokemon_entity_id,
      receiver_user_id,
      provider_user_id,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to initiate adoption');
  }

  return response.json();
};

export const finalizeAdoption = async (adoption_id: number) => {
  const response = await fetch(`${API_URL}/${adoption_id}/finalize`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || 'Failed to finalize adoption');
  }

  return response.json();
};
