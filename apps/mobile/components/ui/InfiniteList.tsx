import { ActivityIndicator, FlatList, View } from 'react-native';
import type { FlatListProps } from 'react-native';
import { colors } from '../../constants/theme';

interface InfiniteListProps<T> extends Omit<FlatListProps<T>, 'ListFooterComponent'> {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function InfiniteList<T>({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEndReachedThreshold,
  ...props
}: InfiniteListProps<T>) {
  return (
    <FlatList
      {...props}
      onEndReached={hasNextPage && !isFetchingNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={onEndReachedThreshold ?? 0.3}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null
      }
    />
  );
}
