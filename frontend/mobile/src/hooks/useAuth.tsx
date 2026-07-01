import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { api } from '@services/api';
import * as SecureStore from 'expo-secure-store';
import i18n from '@i18n/index';
import { useSessionTimer } from './useSessionTimer';
import type { User } from '@app-types/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocked: boolean;
}

interface AuthContextType extends AuthState {
  login: (phone: string, otp: string) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  lock: () => void;
  unlock: () => void;
  touchActivity: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false, isLoading: true, isLocked: false });

  useEffect(() => {
    restoreSession();
  }, []);

  const handleTimeout = useCallback(() => {
    setState(s => s.isAuthenticated ? { ...s, isLocked: true } : s);
  }, []);

  const { touch } = useSessionTimer(handleTimeout, state.isAuthenticated && !state.isLocked);

  const touchActivity = useCallback(() => {
    touch();
  }, [touch]);

  async function restoreSession() {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        const refreshed = await api.tryRefreshToken();
        if (!refreshed) {
          await api.logout();
        }
      }
    } catch { }
    setState(s => ({ ...s, isLoading: false }));
  }

  async function login(phone: string, otp: string) {
    const authRes = await api.verify({ phone, otp });
    const user: User = { id: authRes.user.id, phone: authRes.user.phone, name: authRes.user.name, kyc_level: authRes.user.kyc_level, language: 'lo' };
    setState({ user, isAuthenticated: true, isLoading: false, isLocked: false });
  }

  async function demoLogin() {
    api.enableDemoMode();
    await i18n.changeLanguage('en');
    const user: User = { id: 'demo-001', phone: '8562055551234', name: 'Demo User', kyc_level: 'level_2', language: 'en' };
    setState({ user, isAuthenticated: true, isLoading: false, isLocked: false });
  }

  async function logout() {
    await api.logout();
    setState({ user: null, isAuthenticated: false, isLoading: false, isLocked: false });
  }

  async function refreshUser() { }

  function lock() {
    setState(s => s.isAuthenticated ? { ...s, isLocked: true } : s);
  }

  function unlock() {
    setState(s => ({ ...s, isLocked: false }));
  }

  return <AuthContext.Provider value={{ ...state, login, demoLogin, logout, refreshUser, lock, unlock, touchActivity }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
