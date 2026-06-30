import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { login as apiLogin } from '../api/client';

interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  token: null,
  role: null,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem('admin_token'));
  const [role, setRole] = useState<string | null>(() => sessionStorage.getItem('admin_role'));

  const login = useCallback(async (username: string, password: string) => {
    const res = await apiLogin(username, password);
    sessionStorage.setItem('admin_token', res.access_token);
    if (res.role) {
      sessionStorage.setItem('admin_role', res.role);
      setRole(res.role);
    }
    setToken(res.access_token);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_role');
    setToken(null);
    setRole(null);
    window.location.href = '/login';
  }, []);

  return (
    <AuthContext.Provider value={{ token, role, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
