import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IExercise } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { exerciseKeys } from '../../api/queries/query-keys';

interface ExerciseFilters {
  [key: string]: unknown;
  page?: number;
  limit?: number;
  muscleId?: number;
  equipmentId?: number;
  search?: string;
}

// ─── Queries ────────────────────────────────────────

export const useGetExercises = (filters: ExerciseFilters = {}) => {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<IExercise[]>(apiRoutes.exercises.getAll, {
        params: filters,
      });
      return response.data;
    },
  });
};

export const useGetExerciseById = (id: string) => {
  return useQuery({
    queryKey: exerciseKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<IExercise>(apiRoutes.exercises.getById(id));
      return response.data;
    },
    enabled: !!id,
  });
};

// ─── Mutations ──────────────────────────────────────

interface ExerciseMuscleData {
  muscleId: number;
  isPrimary?: boolean;
  impactPercentage?: number;
}

interface CreateExerciseData {
  name: string;
  description?: string;
  equipmentId?: number;
  trackingTypeId: number;
  muscles?: ExerciseMuscleData[];
}

interface UpdateExerciseData {
  name?: string;
  description?: string;
  equipmentId?: number;
  trackingTypeId?: number;
  muscles?: ExerciseMuscleData[];
}

export const useCreateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateExerciseData) => {
      const response = await apiClient.post<IExercise>(apiRoutes.exercises.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
};

export const useUpdateExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateExerciseData }) => {
      const response = await apiClient.patch<IExercise>(apiRoutes.exercises.update(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
};

export const useDeleteExercise = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(apiRoutes.exercises.delete(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
  });
};
