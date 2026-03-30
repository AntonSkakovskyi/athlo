import { useQuery } from '@tanstack/react-query';
import type { IEquipment } from '@athlo/shared';
import apiClient from '../../api/api-client';
import { apiRoutes } from '../../api/api-routes';
import { equipmentKeys } from '../../api/queries/query-keys';

export const useGetEquipments = () => {
  return useQuery({
    queryKey: equipmentKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IEquipment[]>(apiRoutes.equipments.getAll);
      return response.data;
    },
  });
};
