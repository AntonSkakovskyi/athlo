import { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Vibration,
} from 'react-native';
import { colors, borderRadius, fontSize, spacing } from '@/constants/theme';

interface RestTimerProps {
  visible: boolean;
  initialSeconds: number;
  onClose: () => void;
}

export function RestTimerOverlay({ visible, initialSeconds, onClose }: RestTimerProps) {
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
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>Rest Timer</Text>

          {/* Timer display */}
          <View style={styles.timerCircle}>
            <Text style={styles.timerText}>{formatTime(remaining)}</Text>
            {remaining === 0 && <Text style={styles.doneText}>Done!</Text>}
          </View>

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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['3xl'],
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 24,
  },
  timerCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    fontVariant: ['tabular-nums'],
  },
  doneText: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 4,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  adjustBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight,
  },
  skipText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
});
