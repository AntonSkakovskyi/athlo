import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent, ListRenderItemInfo } from 'react-native';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface TimePickerProps {
  value: number; // total seconds
  onChange: (value: number) => void;
  hideHours?: boolean;
  hideMinutes?: boolean;
  hideSeconds?: boolean;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 3;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const LOOP_FACTOR = 5;

interface WheelProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  label: string;
}

const Wheel = React.memo(({ data, selectedValue, onValueChange, label }: WheelProps) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const flatListRef = useRef<FlatList<number>>(null);
  const [isReady, setIsReady] = useState(false);

  const extendedData = useMemo(() => {
    let res: number[] = [];
    for (let i = 0; i < LOOP_FACTOR; i++) {
      res = res.concat(data);
    }
    return res;
  }, [data]);

  const initialIndex = useMemo(() => {
    const middleOffset = Math.floor(LOOP_FACTOR / 2) * data.length;
    const valueIndex = data.indexOf(selectedValue);
    return middleOffset + (valueIndex >= 0 ? valueIndex : 0);
  }, [data, selectedValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [initialIndex]);

  const getItemLayout = useCallback((_: ArrayLike<number> | null | undefined, index: number) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<number>) => (
    <View style={styles.wheelItem}>
      <Text style={styles.wheelItemText}>{String(item).padStart(2, '0')}</Text>
    </View>
  ), [styles]);

  const keyExtractor = useCallback((_: number, index: number) => String(index), []);

  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isReady) return;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const actualValue = extendedData[index];

    if (index < data.length * 2 || index > extendedData.length - data.length * 2) {
      const middleOffset = Math.floor(LOOP_FACTOR / 2) * data.length;
      const valueIndex = data.indexOf(actualValue);
      const newIndex = middleOffset + valueIndex;
      flatListRef.current?.scrollToOffset({
        offset: newIndex * ITEM_HEIGHT,
        animated: false,
      });
    }

    onValueChange(actualValue);
  }, [isReady, extendedData, data, onValueChange]);

  return (
    <View style={styles.wheelContainer}>
      <FlatList
        ref={flatListRef}
        data={extendedData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        style={styles.wheelScroll}
        contentContainerStyle={styles.wheelListContent}
        snapToInterval={ITEM_HEIGHT}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
        initialNumToRender={7}
        maxToRenderPerBatch={15}
        windowSize={5}
      />
      <Text style={styles.wheelLabel}>{label}</Text>
    </View>
  );
});

export function TimePicker({
  value,
  onChange,
  hideHours = false,
  hideMinutes = false,
  hideSeconds = false
}: TimePickerProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;

  const hoursData = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutesData = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);
  const secondsData = useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  const handleHourChange = useCallback((val: number) => onChange(val * 3600 + m * 60 + s), [m, s, onChange]);
  const handleMinuteChange = useCallback((val: number) => onChange(h * 3600 + val * 60 + s), [h, s, onChange]);
  const handleSecondChange = useCallback((val: number) => onChange(h * 3600 + m * 60 + val), [h, m, onChange]);

  return (
    <View style={styles.container}>
      <View style={styles.selectionHighlight} pointerEvents="none" />
      <View style={styles.wheelsRow}>
        {!hideHours && (
          <Wheel
            data={hoursData}
            selectedValue={h % 24}
            onValueChange={handleHourChange}
            label="h"
          />
        )}
        {!hideMinutes && (
          <Wheel
            data={minutesData}
            selectedValue={m % 60}
            onValueChange={handleMinuteChange}
            label="m"
          />
        )}
        {!hideSeconds && (
          <Wheel
            data={secondsData}
            selectedValue={s % 60}
            onValueChange={handleSecondChange}
            label="s"
          />
        )}
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      height: PICKER_HEIGHT,
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      overflow: 'hidden',
      position: 'relative',
      marginVertical: spacing.md,
    },
    wheelsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      height: PICKER_HEIGHT,
    },
    wheelContainer: {
      flex: 1,
      height: PICKER_HEIGHT,
      alignItems: 'center',
      flexDirection: 'row',
    },
    wheelScroll: {
      flex: 1,
      height: PICKER_HEIGHT,
    },
    wheelListContent: {
      paddingVertical: ITEM_HEIGHT,
    },
    wheelItem: {
      height: ITEM_HEIGHT,
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
    },
    wheelItemText: {
      fontSize: fontSize.xl,
      color: c.text,
      fontWeight: fontWeight.semibold,
    },
    wheelLabel: {
      fontSize: fontSize.md,
      color: c.textMuted,
      fontWeight: fontWeight.bold,
      marginLeft: -5,
      marginTop: 2,
    },
    selectionHighlight: {
      position: 'absolute',
      top: ITEM_HEIGHT,
      left: spacing.md,
      right: spacing.md,
      height: ITEM_HEIGHT,
      backgroundColor: c.primaryLight,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.primary,
      opacity: 0.2,
    },
  });
}
