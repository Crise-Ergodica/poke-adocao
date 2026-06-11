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
 * Formats the user location data into a standard payload for the future API.
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
  // Simulating an async API call formatting layer
  const payload: LocationPayload = {
    userId,
    latitude,
    longitude,
    accuracy,
    timestamp: new Date().toISOString(),
  };

  return payload;
};
