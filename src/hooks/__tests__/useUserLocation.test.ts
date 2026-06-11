import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useUserLocation } from '../useUserLocation';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  Accuracy: { Highest: 6 }
}));

describe('useUserLocation', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('handles permission denied', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'denied' });

    const { result } = renderHook(() => useUserLocation());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.errorMsg).toBe('Permission to access location was denied');
    expect(result.current.isAccuracySufficient).toBe(false);
  });

  it('fetches location successfully with good accuracy', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 10, longitude: 20, accuracy: 30 }
    });

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.location).toEqual({ latitude: 10, longitude: 20 });
    expect(result.current.accuracy).toBe(30);
    expect(result.current.isAccuracySufficient).toBe(true);
    expect(result.current.errorMsg).toBeNull();
  });

  it('fetches location but flags insufficient accuracy', async () => {
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: { latitude: 10, longitude: 20, accuracy: 51 }
    });

    const { result } = renderHook(() => useUserLocation());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accuracy).toBe(51);
    expect(result.current.isAccuracySufficient).toBe(false);
    expect(result.current.errorMsg).toBe('Accuracy is too low. Please move to a clearer area.');
  });
});
