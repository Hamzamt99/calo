'use client';
import Cookies from 'js-cookie';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
type AuthContextType = {
  token: string | null;
  setToken: (token: string | null) => void;
};
const AuthContext = createContext<AuthContextType>({
  token: null,
  setToken: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const saved = Cookies.get('fm_token');
    if (saved) {
      setToken(saved);
    }
  }, []);

  const updateToken = (tok: string | null) => {
    if (tok) {
      Cookies.set('fm_token', tok, { expires: 7 });
    } else {
      Cookies.remove('fm_token');
    }
    setToken(tok);
  };

  return (
    <AuthContext.Provider value={{ token, setToken: updateToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
