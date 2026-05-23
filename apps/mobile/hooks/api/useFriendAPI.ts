import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IUser } from '@athlo/shared';
import apiClient from '@/api/api-client';
import { apiRoutes } from '@/api/api-routes';
import { friendKeys } from '@/api/queries/query-keys';

// ─── Queries ────────────────────────────────────────

export const useGetFriends = () => {
  return useQuery({
    queryKey: friendKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<IUser[]>(apiRoutes.friends.getAll);
      return response.data;
    },
  });
};

interface FriendRequest {
  id: number;
  userId: number;
  fullName: string;
  nickname: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
}

export const useGetIncomingRequests = () => {
  return useQuery({
    queryKey: friendKeys.incomingRequests,
    queryFn: async () => {
      const response = await apiClient.get<FriendRequest[]>(apiRoutes.friends.incomingRequests);
      return response.data;
    },
  });
};

interface OutgoingRequest {
  id: number;
  friendId: number;
  fullName: string;
  nickname: string;
  email: string;
  avatar?: string | null;
  createdAt: string;
}

export const useGetOutgoingRequests = () => {
  return useQuery({
    queryKey: friendKeys.outgoingRequests,
    queryFn: async () => {
      const response = await apiClient.get<OutgoingRequest[]>(apiRoutes.friends.outgoingRequests);
      return response.data;
    },
  });
};

// ─── Mutations ──────────────────────────────────────

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: number) => {
      const response = await apiClient.post(apiRoutes.friends.sendRequest, { friendId });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.outgoingRequests });
    },
  });
};

export const useAcceptFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.patch(apiRoutes.friends.acceptRequest(String(requestId)));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.incomingRequests });
    },
  });
};

export const useRejectFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.patch(apiRoutes.friends.rejectRequest(String(requestId)));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.incomingRequests });
    },
  });
};

export const useCancelFriendRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiClient.delete(apiRoutes.friends.cancelRequest(String(requestId)));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.outgoingRequests });
    },
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (friendId: number) => {
      const response = await apiClient.delete(apiRoutes.friends.remove(String(friendId)));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
};
