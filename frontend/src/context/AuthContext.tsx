import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from 'react';

const tokenKey = 'hr-increment.access-token';

type AuthContextValue = {
  isAuthenticated: boolean;
  login: (accessToken?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(sessionStorage.getItem(tokenKey)));

  const login = useCallback((accessToken = 'development-session') => {
    sessionStorage.setItem(tokenKey, accessToken);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(tokenKey);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(() => ({ isAuthenticated, login, logout }), [isAuthenticated, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
