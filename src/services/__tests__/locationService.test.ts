import { updateUserLocation } from '../locationService';

describe('locationService', () => {
  it('formats the payload correctly and calls the API', async () => {
    // We are simulating an HTTP call layer. For now, we just test the formatting logic.
    const userId = '123';
    const latitude = -23.55052;
    const longitude = -46.633308;
    const accuracy = 15;

    const result = await updateUserLocation(userId, latitude, longitude, accuracy);

    expect(result).toEqual({
      userId: '123',
      latitude: -23.55052,
      longitude: -46.633308,
      accuracy: 15,
      timestamp: expect.any(String),
    });
  });
});
