import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { setAuthToken, setOnUnauthorized } from '../lib/apiClient';

const STORAGE_KEY = 'viplev_token';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  // Register a global 401/403 handler so any API call can trigger logout
  useEffect(() => {
    setOnUnauthorized(logout);
  }, [logout]);

  const login = useCallback((newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated: token !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
