import React, { useRef, useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

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
const LOOP_FACTOR = 20; // Multiplier for fake infinite scroll

interface WheelProps {
  data: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  label: string;
}

const Wheel = ({ data, selectedValue, onValueChange, label }: WheelProps) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isReady, setIsReady] = useState(false);
  
  // Extended data for looping
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
      scrollViewRef.current?.scrollTo({
        y: initialIndex * ITEM_HEIGHT,
        animated: false,
      });
      setIsReady(true);
    }, 50);
    return () => clearTimeout(timer);
  }, [initialIndex]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!isReady) return;
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const actualValue = extendedData[index];
    
    // Recenter if getting close to edges
    if (index < data.length * 2 || index > extendedData.length - data.length * 2) {
      const middleOffset = Math.floor(LOOP_FACTOR / 2) * data.length;
      const valueIndex = data.indexOf(actualValue);
      const newIndex = middleOffset + valueIndex;
      
      scrollViewRef.current?.scrollTo({
        y: newIndex * ITEM_HEIGHT,
        animated: false,
      });
    }

    onValueChange(actualValue);
  };

  return (
    <View style={styles.wheelContainer}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.wheelScroll}
        snapToInterval={ITEM_HEIGHT}
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={styles.wheelListContent}
        decelerationRate="fast"
        scrollEventThrottle={16}
        nestedScrollEnabled={true}
      >
        {extendedData.map((item, index) => (
          <View key={index} style={styles.wheelItem}>
            <Text style={styles.wheelItemText}>{String(item).padStart(2, '0')}</Text>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.wheelLabel}>{label}</Text>
    </View>
  );
};

export function TimePicker({ 
  value, 
  onChange, 
  hideHours = false, 
  hideMinutes = false, 
  hideSeconds = false 
}: TimePickerProps) {
  const h = Math.floor(value / 3600);
  const m = Math.floor((value % 3600) / 60);
  const s = value % 60;

  const hoursData = Array.from({ length: 24 }, (_, i) => i);
  const minutesData = Array.from({ length: 60 }, (_, i) => i);
  const secondsData = Array.from({ length: 60 }, (_, i) => i);

  const handleValueChange = (newH: number, newM: number, newS: number) => {
    onChange(newH * 3600 + newM * 60 + newS);
  };

  return (
    <View style={styles.container}>
      <View style={styles.selectionHighlight} pointerEvents="none" />
      <View style={styles.wheelsRow}>
        {!hideHours && (
          <Wheel 
            data={hoursData} 
            selectedValue={h % 24} 
            onValueChange={(val) => handleValueChange(val, m, s)} 
            label="h"
          />
        )}
        {!hideMinutes && (
          <Wheel 
            data={minutesData} 
            selectedValue={m % 60} 
            onValueChange={(val) => handleValueChange(h, val, s)} 
            label="m"
          />
        )}
        {!hideSeconds && (
          <Wheel 
            data={secondsData} 
            selectedValue={s % 60} 
            onValueChange={(val) => handleValueChange(h, m, val)} 
            label="s"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: PICKER_HEIGHT,
    backgroundColor: colors.surface,
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
    paddingVertical: ITEM_HEIGHT, // Center the items
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    width: 50,
  },
  wheelItemText: {
    fontSize: fontSize.xl,
    color: colors.text,
    fontWeight: fontWeight.semibold,
  },
  wheelLabel: {
    fontSize: fontSize.md,
    color: colors.textMuted,
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
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    opacity: 0.2,
  },
});
