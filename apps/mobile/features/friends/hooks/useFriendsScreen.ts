import { useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
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

export function useFriendsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: friends, isLoading: friendsLoading } = useGetFriends();
  const { data: incomingRequests, isLoading: incomingLoading } = useGetIncomingRequests();
  const { data: outgoingRequests, isLoading: outgoingLoading } = useGetOutgoingRequests();
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(searchQuery);

  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const rejectRequest = useRejectFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const removeFriend = useRemoveFriend();

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
    handleUserPress,
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
  };
}
