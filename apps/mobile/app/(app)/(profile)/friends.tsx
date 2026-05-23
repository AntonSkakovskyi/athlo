import { View, Text, StyleSheet, Pressable } from 'react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useFriendsScreen } from '@/features/friends/hooks/useFriendsScreen';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { Input } from '@/components/ui/Input/Input';
import { InfiniteList } from '@/components/ui/InfiniteList/InfiniteList';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';

const TABS = ['Friends', 'Requests', 'Find'];

export default function FriendsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const {
    insets,
    router,
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
  } = useFriendsScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  useEffect(() => {
    if (params.tab === 'find') {
      setActiveTab(2);
    } else if (params.tab === 'requests') {
      setActiveTab(1);
    }
  }, [params.tab]);

  const renderFriendItem = ({ item }: { item: any }) => (
    <Pressable style={styles.userItem} onPress={() => handleUserPress(item.id)}>
      <Avatar uri={item.avatar ?? undefined} name={item.fullName} size="md" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userNickname}>@{item.nickname}</Text>
      </View>
      <Button
        title="Remove"
        variant="ghost"
        onPress={() => removeFriend.mutate(item.id)}
        isLoading={removeFriend.isPending}
        style={styles.actionBtn}
      />
    </Pressable>
  );

  const renderIncomingRequest = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Avatar uri={item.avatar ?? undefined} name={item.fullName} size="md" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userNickname}>@{item.nickname}</Text>
      </View>
      <View style={styles.requestActions}>
        <Button
          title="Accept"
          variant="primary"
          onPress={() => acceptRequest.mutate(item.id)}
          isLoading={acceptRequest.isPending}
        />
        <Button
          title="Reject"
          variant="ghost"
          onPress={() => rejectRequest.mutate(item.id)}
          isLoading={rejectRequest.isPending}
        />
      </View>
    </View>
  );

  const renderOutgoingRequest = ({ item }: { item: any }) => (
    <View style={styles.userItem}>
      <Avatar uri={item.avatar ?? undefined} name={item.fullName} size="md" />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.fullName}</Text>
        <Text style={styles.userNickname}>@{item.nickname}</Text>
      </View>
      <Button
        title="Cancel"
        variant="ghost"
        onPress={() => cancelRequest.mutate(item.id)}
        isLoading={cancelRequest.isPending}
        style={styles.actionBtn}
      />
    </View>
  );

  const renderSearchResult = ({ item }: { item: any }) => {
    const isFriend = friends?.some(f => f.id === item.id);
    const isPendingIncoming = incomingRequests?.some(r => r.userId === item.id);
    const isPendingOutgoing = outgoingRequests?.some(r => r.friendId === item.id);

    let statusLabel = '';
    if (isFriend) statusLabel = 'Friend';
    else if (isPendingIncoming) statusLabel = 'Received';
    else if (isPendingOutgoing) statusLabel = 'Sent';

    return (
      <Pressable style={styles.userItem} onPress={() => handleUserPress(item.id)}>
        <Avatar uri={item.avatar ?? undefined} name={item.fullName} size="md" />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.fullName}</Text>
          <Text style={styles.userNickname}>@{item.nickname}</Text>
        </View>
        {statusLabel ? (
          <Text style={styles.statusLabel}>{statusLabel}</Text>
        ) : (
          <Button
            title="Add"
            variant="primary"
            onPress={() => sendRequest.mutate(item.id)}
            isLoading={sendRequest.isPending}
            style={styles.actionBtn}
          />
        )}
      </Pressable>
    );
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      if (friendsLoading) return <Spinner style={styles.center} />;
      if (!friends || friends.length === 0) {
        return (
          <EmptyState
            title="No friends yet"
            description="Find people you know to see them here"
            actionLabel="Find Friends"
            onAction={() => setActiveTab(2)}
          />
        );
      }
      return (
        <InfiniteList
          data={friends}
          renderItem={renderFriendItem}
          contentContainerStyle={styles.list}
        />
      );
    }

    if (activeTab === 1) {
      if (incomingLoading || outgoingLoading) return <Spinner style={styles.center} />;
      const hasRequests = (incomingRequests?.length ?? 0) > 0 || (outgoingRequests?.length ?? 0) > 0;
      
      if (!hasRequests) {
        return (
          <EmptyState
            title="No requests"
            description="You don't have any pending friend requests"
          />
        );
      }

      return (
        <InfiniteList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={
            <View>
              {(incomingRequests?.length ?? 0) > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Incoming Requests</Text>
                  {incomingRequests?.map(r => (
                    <View key={r.id}>{renderIncomingRequest({ item: r })}</View>
                  ))}
                </View>
              )}
              {(outgoingRequests?.length ?? 0) > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Outgoing Requests</Text>
                  {outgoingRequests?.map(r => (
                    <View key={r.id}>{renderOutgoingRequest({ item: r })}</View>
                  ))}
                </View>
              )}
            </View>
          }
          contentContainerStyle={styles.list}
        />
      );
    }

    if (activeTab === 2) {
      return (
        <View style={styles.flex}>
          <View style={styles.searchWrap}>
            <Input
              placeholder="Search by nickname or name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          {searchLoading ? (
            <Spinner />
          ) : !searchQuery ? (
            <EmptyState
              title="Search Users"
              description="Type at least 2 characters to find people"
            />
          ) : !searchResults || searchResults.length === 0 ? (
            <EmptyState
              title="No users found"
              description="Try a different search query"
            />
          ) : (
            <InfiniteList
              data={searchResults}
              renderItem={renderSearchResult}
              contentContainerStyle={styles.list}
            />
          )}
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Social</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.segmentWrap}>
        <SegmentControl segments={TABS} activeIndex={activeTab} onSelect={setActiveTab} />
      </View>

      {renderTabContent()}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    flex: { flex: 1 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    headerSpacer: { width: 40 },
    backBtn: {
      fontSize: 15,
      color: c.primary,
      fontWeight: '600',
    },
    screenTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: c.text,
    },
    segmentWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing['4xl'],
    },
    center: { marginTop: spacing['4xl'] },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    userInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    userName: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    userNickname: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    actionBtn: {
      marginLeft: spacing.sm,
    },
    requestActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    statusLabel: {
      fontSize: fontSize.sm,
      color: c.textMuted,
      fontWeight: fontWeight.medium,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: c.textMuted,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
    },
  });
}
