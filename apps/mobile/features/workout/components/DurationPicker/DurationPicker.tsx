import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

interface DurationPickerProps {
  value: number; // seconds
  onChange: (value: number) => void;
}

const ITEM_HEIGHT = 60;
const DURATIONS = Array.from({ length: 301 }, (_, i) => i * 60); // 0 to 300 minutes (5 hours)

export function DurationPicker({ value, onChange }: DurationPickerProps) {
  const flatListRef = useRef<FlatList>(null);
  const [selectedIndex, setSelectedIndex] = useState(Math.floor(value / 60));
  const [isInitialScrollDone, setIsInitialScrollDone] = useState(false);

  useEffect(() => {
    const index = Math.floor(value / 60);
    if (index >= 0 && index < DURATIONS.length) {
      setSelectedIndex(index);
      // Wait for layout
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToOffset({
          offset: index * ITEM_HEIGHT,
          animated: false,
        });
        setIsInitialScrollDone(true);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setIsInitialScrollDone(true);
    }
  }, []);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isInitialScrollDone) return;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < DURATIONS.length && index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isInitialScrollDone) return;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    if (index >= 0 && index < DURATIONS.length) {
      setSelectedIndex(index);
      onChange(DURATIONS[index]);
    }
  };

  const handleItemPress = (index: number) => {
    flatListRef.current?.scrollToOffset({
      offset: index * ITEM_HEIGHT,
      animated: true,
    });
    setSelectedIndex(index);
    onChange(DURATIONS[index]);
  };

  const renderItem = ({ item, index }: { item: number; index: number }) => {
    const isSelected = index === selectedIndex;
    return (
      <Pressable 
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => handleItemPress(index)}
      >
        <Text style={[styles.itemText, isSelected && styles.selectedItemText]}>
          {formatDuration(item)}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.highlightBar} pointerEvents="none" />
      <FlatList
        ref={flatListRef}
        data={DURATIONS}
        renderItem={renderItem}
        keyExtractor={(item) => String(item)}
        snapToInterval={ITEM_HEIGHT}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 3,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  highlightBar: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: spacing.lg,
    right: spacing.lg,
    height: ITEM_HEIGHT,
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    zIndex: 0,
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  selectedItem: {
    // highlighted by bar
  },
  itemText: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    fontWeight: fontWeight.medium,
  },
  selectedItemText: {
    fontSize: fontSize.xl,
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
});
