/**
 * Context for managing application authentication and user state.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  iconUrl: string | null;
  setIconUrl: (url: string | null) => void;
  companionPokemonId: number | null;
  setCompanionPokemonId: (id: number | null) => void;
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  setUserId: () => {},
  iconUrl: null,
  setIconUrl: () => {},
  companionPokemonId: null,
  setCompanionPokemonId: () => {},
  token: null,
  setToken: () => {},
  logout: async () => {},
});

// Se isso não funcionar, é papo de suicidio
const setStorageItemAsync = async (key: string, value: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
      return null;
    }
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteStorageItemAsync = async (key: string) => {
  if (Platform.OS === 'web') {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Local storage is unavailable:', e);
    }
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [companionPokemonId, setCompanionPokemonId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedToken = await getStorageItemAsync('token');
        const storedUserId = await getStorageItemAsync('userId');
        const storedIconUrl = await getStorageItemAsync('iconUrl');
        const storedCompanionId = await getStorageItemAsync('companionPokemonId');
        
        if (storedToken && storedUserId) {
          setToken(storedToken);
          setUserId(storedUserId);
          if (storedIconUrl) setIconUrl(storedIconUrl);
          if (storedCompanionId) setCompanionPokemonId(parseInt(storedCompanionId, 10));
        }
      } catch (error) {
        console.error('Failed to load auth state from secure store', error);
      }
    };
    loadState();
  }, []);

  const handleSetToken = async (newToken: string | null) => {
    setToken(newToken);
    if (newToken) {
      await setStorageItemAsync('token', newToken);
    } else {
      await deleteStorageItemAsync('token');
    }
  };

  const handleSetUserId = async (newUserId: string | null) => {
    setUserId(newUserId);
    if (newUserId) {
      await setStorageItemAsync('userId', newUserId);
    } else {
      await deleteStorageItemAsync('userId');
    }
  };

  const handleSetIconUrl = async (newIconUrl: string | null) => {
    setIconUrl(newIconUrl);
    if (newIconUrl) {
      await setStorageItemAsync('iconUrl', newIconUrl);
    } else {
      await deleteStorageItemAsync('iconUrl');
    }
  };

  const handleSetCompanionPokemonId = async (newId: number | null) => {
    setCompanionPokemonId(newId);
    if (newId !== null) {
      await setStorageItemAsync('companionPokemonId', newId.toString());
    } else {
      await deleteStorageItemAsync('companionPokemonId');
    }
  };

  const logout = async () => {
    await handleSetToken(null);
    await handleSetUserId(null);
    await handleSetIconUrl(null);
    await handleSetCompanionPokemonId(null);
  };

  return (
    <AuthContext.Provider value={{ 
      userId, 
      setUserId: handleSetUserId, 
      iconUrl, 
      setIconUrl: handleSetIconUrl, 
      companionPokemonId,
      setCompanionPokemonId: handleSetCompanionPokemonId,
      token, 
      setToken: handleSetToken,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);