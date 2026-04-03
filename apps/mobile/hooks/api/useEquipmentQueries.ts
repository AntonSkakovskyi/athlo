import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IEquipment } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { equipmentKeys } from '../../api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetEquipments = () => {
  return useQuery({
    queryKey: equipmentKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IEquipment[]>(apiRoutes.equipments.getAll);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

export const useCreateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const response = await apiClient.post<IEquipment>(apiRoutes.equipments.create, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
};

export const useUpdateEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { name?: string } }) => {
      const response = await apiClient.patch<IEquipment>(apiRoutes.equipments.update(id), data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
};

export const useDeleteEquipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.delete(apiRoutes.equipments.delete(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
};
