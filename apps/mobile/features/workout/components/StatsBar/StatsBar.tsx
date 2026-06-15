import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { serverNow } from '@/utils/serverTime';
import { formatHMS } from '@/utils/time';

interface StatsBarProps {
  startedAt: string | Date;
  volume: number;
  completedSets: number;
  totalSets: number;
}

function WorkoutDuration({ startedAt }: { startedAt: string | Date }) {
  const startMs = useRef(new Date(startedAt).getTime());
  const [elapsed, setElapsed] = useState(() => serverNow() - startMs.current);

  useEffect(() => {
    const id = setInterval(() => setElapsed(serverNow() - startMs.current), 1000);
    return () => clearInterval(id);
  }, []);

  const { colors } = useTheme();
  const styles = useMemo(() => makeDurationStyles(colors), [colors]);

  return (
    <View style={styles.stat}>
      <Text style={styles.icon}>⏱️</Text>
      <Text style={styles.value}>{formatHMS(elapsed)}</Text>
      <Text style={styles.label}>Duration</Text>
    </View>
  );
}

function makeDurationStyles(c: ColorPalette) {
  return StyleSheet.create({
    stat: { flex: 1, alignItems: 'center' },
    icon: { fontSize: 16, marginBottom: 4 },
    value: { fontSize: 16, fontWeight: '700', color: c.text },
    label: { fontSize: 11, color: c.textMuted, marginTop: 2 },
  });
}

export function StatsBar({ startedAt, volume, completedSets, totalSets }: StatsBarProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <WorkoutDuration startedAt={startedAt} />
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.icon}>🏋️</Text>
        <Text style={styles.value}>{volume.toLocaleString()} kg</Text>
        <Text style={styles.label}>Volume</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.stat}>
        <Text style={styles.icon}>✅</Text>
        <Text style={styles.value}>{completedSets}/{totalSets}</Text>
        <Text style={styles.label}>Sets</Text>
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      backgroundColor: c.surface,
      borderRadius: borderRadius.lg,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: c.border,
    },
    stat: {
      flex: 1,
      alignItems: 'center',
    },
    icon: {
      fontSize: 16,
      marginBottom: 4,
    },
    value: {
      fontSize: 16,
      fontWeight: '700',
      color: c.text,
    },
    label: {
      fontSize: 11,
      color: c.textMuted,
      marginTop: 2,
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: c.border,
      alignSelf: 'center',
    },
  });
}
