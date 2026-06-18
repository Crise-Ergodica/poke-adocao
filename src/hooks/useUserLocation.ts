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
          // INTERVENÇÃO ESTRATÉGICA: Isolamento para ambiente de desenvolvimento
          if (__DEV__) {
            console.warn("Permissão negada. Forçando localização (Apenas DEV).");
            if (isMounted) {
              setState({
                location: { latitude: -19.5312, longitude: -42.6105 }, // Coordenadas de contingência
                accuracy: 10, // Acurácia ideal simulada
                isAccuracySufficient: true,
                errorMsg: null,
                isLoading: false,
              });
            }
            return;
          }

          // FLUXO RIGOROSO DE PRODUÇÃO
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

        // NOTA: Certifique-se de que o backend e o frontend operam com a mesma
        // tolerância de precisão (accuracy). Atualmente este código exige <= 50m.
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
        // Fallback também ativado em caso de erro de leitura do sensor em desenvolvimento
        if (__DEV__) {
            console.warn("Erro ao buscar GPS. Forçando localização (Apenas DEV).");
            if (isMounted) {
              setState({
                location: { latitude: -19.5312, longitude: -42.6105 },
                accuracy: 10,
                isAccuracySufficient: true,
                errorMsg: null,
                isLoading: false,
              });
            }
            return;
        }

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