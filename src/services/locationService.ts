/**
 * Interface representing the formatted payload to update user location.
 */
export interface LocationPayload {
  userId: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

/**
 * Updates the user location data by calling the backend API.
 * @param userId - The ID of the user.
 * @param latitude - The current latitude of the device.
 * @param longitude - The current longitude of the device.
 * @param accuracy - The precision of the coordinates in meters.
 * @returns A promise resolving to the formatted payload.
 */
export const updateUserLocation = async (
  userId: string,
  latitude: number,
  longitude: number,
  accuracy: number
): Promise<LocationPayload> => {
  const payload: LocationPayload = {
    userId,
    latitude,
    longitude,
    accuracy,
    timestamp: new Date().toISOString(),
  };

  try {
    const response = await fetch('http://localhost:8000/api/v1/location/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Location update failed with status: ${response.status}`);
    }

    return payload;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};
