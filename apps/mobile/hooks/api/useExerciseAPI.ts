import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IExercise, IPaginatedResponse } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { exerciseKeys } from '@/api/queries/query-keys';

export interface ExerciseWithRelations extends IExercise {
  equipment?: { id: number; name: string } | null;
  trackingType?: { id: number; name: string } | null;
  exerciseMuscles?: { isPrimary: boolean; muscle: { id: number; name: string } }[];
  totalSets?: number;
  totalWorkouts?: number;
  hasLoggedHistory?: boolean;
}

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
      const response = await apiClient.get<IPaginatedResponse<IExercise>>(apiRoutes.exercises.getAll, {
        params: { ...filters, page: 1, limit: 1000 },
      });
      return response.data.data;
    },
  });
};

type InfiniteExerciseFilters = Omit<ExerciseFilters, 'page' | 'limit'>;

export const useInfiniteExercises = (filters: InfiniteExerciseFilters = {}) => {
  return useInfiniteQuery({
    queryKey: [...exerciseKeys.list(filters), 'infinite'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<IPaginatedResponse<ExerciseWithRelations>>(apiRoutes.exercises.getAll, {
        params: { ...filters, page: pageParam, limit: 20 },
      });
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, limit, total } = lastPage.meta;
      return page * limit < total ? page + 1 : undefined;
    },
  });
};

export const useGetExerciseById = (id: string) => {
  return useQuery({
    queryKey: exerciseKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<ExerciseWithRelations>(apiRoutes.exercises.getById(id));
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
  equipmentId?: number | null;
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
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      queryClient.invalidateQueries({ queryKey: exerciseKeys.byId(id) });
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
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
      queryClient.removeQueries({ queryKey: exerciseKeys.byId(id) });
    },
  });
};
