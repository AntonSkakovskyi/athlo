import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
} from 'react-native';
import { borderRadius, fontSize, fontWeight, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { BottomSheet } from '@/components/ui';
import { TimerDisplay } from './TimerDisplay';

interface RestTimerProps {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
}

export function RestTimerOverlay({ visible, initialSeconds, onClose }: RestTimerProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [remaining, setRemaining] = useState(initialSeconds);
  const [totalDuration, setTotalDuration] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const animatedProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setRemaining(initialSeconds);
      setTotalDuration(initialSeconds);
      animatedProgress.setValue(1);
    }
  }, [visible, initialSeconds, animatedProgress]);

  useEffect(() => {
    if (!visible) return;

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          Vibration.vibrate([0, 300, 100, 300]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  useEffect(() => {
    if (totalDuration > 0) {
      Animated.timing(animatedProgress, {
        toValue: remaining / totalDuration,
        duration: 950,
        useNativeDriver: false,
      }).start();
    }
  }, [remaining, totalDuration, animatedProgress]);

  const adjustTime = useCallback((delta: number) => {
    setRemaining((prev) => Math.max(0, prev + delta));
    setTotalDuration((prev) => Math.max(1, prev + delta));
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progressWidth = animatedProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Rest Timer"
      scrollable={false}
      showCancel={false}
    >
      <View style={styles.container}>
        {/* Timer display */}
        <TimerDisplay remaining={remaining} formatTime={formatTime} />

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Adjust buttons */}
        <View style={styles.adjustRow}>
          <Pressable style={styles.adjustBtn} onPress={() => adjustTime(-15)}>
            <Text style={styles.adjustText}>-15s</Text>
          </Pressable>
          <Pressable style={styles.adjustBtn} onPress={() => adjustTime(15)}>
            <Text style={styles.adjustText}>+15s</Text>
          </Pressable>
        </View>

        {/* Skip / Close */}
        <Pressable style={styles.skipBtn} onPress={onClose}>
          <Text style={styles.skipText}>{remaining === 0 ? 'Close' : 'Skip'}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      alignItems: 'center',
    },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: c.surfaceLight,
      borderRadius: borderRadius.xs,
      marginBottom: spacing['2xl'],
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.primary,
      borderRadius: borderRadius.xs,
    },
    adjustRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.xl,
    },
    adjustBtn: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing['2xl'],
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    adjustText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    skipBtn: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing['3xl'],
      borderRadius: borderRadius.md,
      backgroundColor: c.primaryLight,
    },
    skipText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.primary,
    },
  });
}
