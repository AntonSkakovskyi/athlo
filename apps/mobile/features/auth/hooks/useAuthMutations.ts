import { useMutation } from '@tanstack/react-query';
import type { IUser } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  nickname: string;
}

interface AuthResponse {
  user: IUser;
  token: string;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: LoginRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(apiRoutes.auth.login, data);
      return response.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await apiClient.post<AuthResponse>(apiRoutes.auth.register, data);
      return response.data;
    },
  });
};
