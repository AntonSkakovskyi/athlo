import React, { createContext, useContext, useEffect, useState } from 'react';
import type { IUser } from '@athlo/shared';
import { AuthService } from '../services/auth';

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

  const loadStoredToken = async () => {
    const token = await AuthService.getToken();
    if (token) {
      setState(prev => ({ ...prev, token, isLoading: false }));
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
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
