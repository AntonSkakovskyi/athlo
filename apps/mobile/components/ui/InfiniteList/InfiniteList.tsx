import React from 'react';
import { FlatList, View } from 'react-native';
import type { FlatListProps } from 'react-native';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export interface InfiniteListProps<T> extends FlatListProps<T> {
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export const InfiniteList = function InfiniteList<T>({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEndReachedThreshold,
  ListFooterComponent,
  ...props
}: InfiniteListProps<T>) {
  return (
    <FlatList
      {...props}
      onEndReached={hasNextPage && !isFetchingNextPage ? onLoadMore : undefined}
      onEndReachedThreshold={onEndReachedThreshold ?? 0.3}
      ListFooterComponent={
        <>
          {ListFooterComponent}
          {isFetchingNextPage ? (
            <View style={{ paddingVertical: 16 }}>
              <Spinner />
            </View>
          ) : null}
        </>
      }
    />
  );
};


