import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationState {
  location: { latitude: number; longitude: number } | null;
  accuracy: number | null;
  isAccuracySufficient: boolean;
  errorMsg: string | null;
  isLoading: boolean;
}

/**
 * Custom hook to manage user location and enforce accuracy requirements.
 */
export const useUserLocation = (): LocationState => {
  const [state, setState] = useState<LocationState>({
    location: null,
    accuracy: null,
    isAccuracySufficient: false,
    errorMsg: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          if (isMounted) {
            setState(prev => ({
              ...prev,
              errorMsg: 'Permission to access location was denied',
              isLoading: false,
              isAccuracySufficient: false,
            }));
          }
          return;
        }

        const locationData = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Highest
        });

        const accuracy = locationData.coords.accuracy || 1000;
        const isSufficient = accuracy <= 50;

        if (isMounted) {
          setState({
            location: {
              latitude: locationData.coords.latitude,
              longitude: locationData.coords.longitude,
            },
            accuracy,
            isAccuracySufficient: isSufficient,
            errorMsg: isSufficient ? null : 'Accuracy is too low. Please move to a clearer area.',
            isLoading: false,
          });
        }
      } catch (error) {
        if (isMounted) {
          const errMsg = Platform.OS === 'web'
            ? 'Location error on Web. Ensure HTTPS or check browser permissions.'
            : 'Error fetching location.';
          setState(prev => ({
            ...prev,
            errorMsg: errMsg,
            isLoading: false,
            isAccuracySufficient: false,
          }));
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
};
