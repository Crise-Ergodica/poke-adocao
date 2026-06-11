import { updateUserLocation } from '../locationService';

// Mock the global fetch object
global.fetch = jest.fn();

describe('locationService', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('formats the payload correctly and calls the API', async () => {
    // Mock the fetch response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Location updated successfully' }),
    });

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

    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/v1/location/update', // Assuming default local backend URL
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      })
    );

    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const parsedBody = JSON.parse(callArgs[1].body);
    expect(parsedBody).toEqual({
      userId: '123',
      latitude: -23.55052,
      longitude: -46.633308,
      accuracy: 15,
      timestamp: expect.any(String),
    });
  });
});
