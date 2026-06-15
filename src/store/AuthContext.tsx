import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  userId: string | null;
  setUserId: (id: string | null) => void;
  iconUrl: string | null;
  setIconUrl: (url: string | null) => void;
}

export const AuthContext = createContext<AuthContextType>({
  userId: null,
  setUserId: () => {},
  iconUrl: null,
  setIconUrl: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  return (
    <AuthContext.Provider value={{ userId, setUserId, iconUrl, setIconUrl }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
