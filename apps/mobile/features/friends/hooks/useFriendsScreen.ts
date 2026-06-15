import { useState, useMemo, useCallback } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  useGetFriends,
  useGetIncomingRequests,
  useGetOutgoingRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useRemoveFriend
} from '@/hooks/api/useFriendAPI';
import { useSearchUsers } from '@/hooks/api/useUserAPI';
import { useToast } from '@/contexts/ToastContext';
import type { IUser } from '@athlo/shared';

export function useFriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [hiddenFromSearch, setHiddenFromSearch] = useState<Set<number>>(new Set());

  const { data: friends, isLoading: friendsLoading } = useGetFriends();
  const { data: incomingRequests, isLoading: incomingLoading } = useGetIncomingRequests();
  const { data: outgoingRequests, isLoading: outgoingLoading } = useGetOutgoingRequests();

  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSearchUsers(searchQuery);

  const searchResults = useMemo<IUser[]>(
    () => (searchData?.pages.flat() ?? []).filter((u) => !hiddenFromSearch.has(u.id)),
    [searchData, hiddenFromSearch],
  );

  const sendRequestMutation = useSendFriendRequest();
  const acceptRequestMutation = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

  const handleSendRequest = useCallback((userId: number) => {
    sendRequestMutation.mutate(userId, {
      onSuccess: () => {
        setHiddenFromSearch((prev) => new Set(prev).add(userId));
        showToast({
          title: 'Request sent!',
          description: 'Switch to Friends tab to see your friends list.',
          variant: 'info',
        });
      },
    });
  }, [sendRequestMutation, showToast]);

  const handleAcceptRequest = useCallback((requestId: number) => {
    acceptRequestMutation.mutate(requestId, {
      onSuccess: () => {
        setActiveTab(0);
        showToast({
          title: 'Friend added!',
          description: 'You can now see them in the Friends tab.',
          variant: 'success',
        });
      },
    });
  }, [acceptRequestMutation, showToast]);

  const handleUserPress = (userId: number) => {
    router.push(`/(app)/(profile)/${userId}`);
  };

  return {
    router,
    insets,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    friends,
    friendsLoading,
    incomingRequests,
    incomingLoading,
    outgoingRequests,
    outgoingLoading,
    searchResults,
    searchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    handleUserPress,
    sendRequest: { ...sendRequestMutation, handleSendRequest },
    acceptRequest: { ...acceptRequestMutation, handleAcceptRequest },
    rejectRequest,
    cancelRequest,
    removeFriend,
  };
}
