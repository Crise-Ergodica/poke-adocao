/**
 * Context for managing application authentication and user state.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [companionPokemonId, setCompanionPokemonId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const loadState = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        const storedUserId = await SecureStore.getItemAsync('userId');
        const storedIconUrl = await SecureStore.getItemAsync('iconUrl');
        const storedCompanionId = await SecureStore.getItemAsync('companionPokemonId');
        
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
      await SecureStore.setItemAsync('token', newToken);
    } else {
      await SecureStore.deleteItemAsync('token');
    }
  };

  const handleSetUserId = async (newUserId: string | null) => {
    setUserId(newUserId);
    if (newUserId) {
      await SecureStore.setItemAsync('userId', newUserId);
    } else {
      await SecureStore.deleteItemAsync('userId');
    }
  };

  const handleSetIconUrl = async (newIconUrl: string | null) => {
    setIconUrl(newIconUrl);
    if (newIconUrl) {
      await SecureStore.setItemAsync('iconUrl', newIconUrl);
    } else {
      await SecureStore.deleteItemAsync('iconUrl');
    }
  };

  const handleSetCompanionPokemonId = async (newId: number | null) => {
    setCompanionPokemonId(newId);
    if (newId !== null) {
      await SecureStore.setItemAsync('companionPokemonId', newId.toString());
    } else {
      await SecureStore.deleteItemAsync('companionPokemonId');
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