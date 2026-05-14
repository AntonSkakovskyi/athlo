import React, { createContext, useContext, useEffect, useState } from 'react';
import type { IUser } from '@athlo/shared';
import { AuthService } from '../services/auth';
import apiClient, { setUnauthorizedHandler } from '../api/api-client';
import { apiRoutes } from '../api/api-routes';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setSession: (user: IUser, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
  });

  useEffect(() => {
    loadStoredToken();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setState({ user: null, token: null, isLoading: false });
    });
  }, []);

  const loadStoredToken = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      const response = await apiClient.get(apiRoutes.profile.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setState({ user: response.data, token, isLoading: false });
    } catch {
      await AuthService.deleteToken();
      setState({ user: null, token: null, isLoading: false });
    }
  };

  const setSession = async (user: IUser, token: string) => {
    await AuthService.saveToken(token);
    setState({ user, token, isLoading: false });
  };

  const logout = async () => {
    await AuthService.deleteToken();
    setState({ user: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
