import React, { createContext, useContext, useEffect, useState } from 'react';
import type { IUser, IUserProfile } from '@athlo/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/features/auth/services';
import apiClient, { setUnauthorizedHandler } from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { profileKeys } from '@/api/queries/query-keys';

interface AuthState {
  user: IUserProfile | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  setSession: (user: IUser | IUserProfile, token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
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

  // Джерело правди для профілю — кеш profileKeys.me. Контекст підписаний на нього,
  // тож редагування профілю (яке оновлює цей кеш) одразу відображається в useAuth().user.
  const { data: profileUser } = useQuery<IUserProfile>({
    queryKey: profileKeys.me,
    queryFn: async () => {
      const response = await apiClient.get<IUserProfile>(apiRoutes.profile.get);
      return response.data;
    },
    enabled: !!state.token,
  });

  const loadStoredToken = async () => {
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }
      const response = await apiClient.get<IUserProfile>(apiRoutes.profile.get, {
        headers: { Authorization: `Bearer ${token}` },
      });
      queryClient.setQueryData(profileKeys.me, response.data);
      setState({ user: response.data, token, isLoading: false });
    } catch {
      await AuthService.deleteToken();
      setState({ user: null, token: null, isLoading: false });
    }
  };

  const setSession = async (user: IUser | IUserProfile, token: string) => {
    await AuthService.saveToken(token);
    queryClient.setQueryData(profileKeys.me, user);
    // Якщо логін повертає лише IUser, заповнюємо null-цілі — useQuery нижче
    // одразу замінить це на повний профіль із сервера.
    const profile: IUserProfile = {
      calorieGoal: null,
      waterGoal: null,
      proteinGoal: null,
      fatGoal: null,
      carbGoal: null,
      ...user,
    };
    setState({ user: profile, token, isLoading: false });
  };

  const logout = async () => {
    await AuthService.deleteToken();
    queryClient.clear();
    setState({ user: null, token: null, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, user: profileUser ?? state.user, setSession, logout }}>
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
