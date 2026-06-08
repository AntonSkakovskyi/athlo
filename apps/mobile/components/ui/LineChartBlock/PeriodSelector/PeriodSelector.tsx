import { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontSize, spacing, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface PeriodSelectorProps {
  period: string;
  periods: string[];
  open: boolean;
  onToggle: () => void;
  onSelect: (period: string) => void;
}

export function PeriodSelector({
  period,
  periods,
  open,
  onToggle,
  onSelect,
}: PeriodSelectorProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Pressable style={styles.trigger} onPress={onToggle}>
        <Text style={styles.triggerText}>{period}</Text>
        <Ionicons 
          name={open ? "chevron-up" : "chevron-down"} 
          size={14} 
          color={colors.textMuted} 
        />
      </Pressable>
      
      {open && (
        <View style={styles.menu}>
          {periods.map((p) => (
            <Pressable
              key={p}
              style={[styles.item, p === period && styles.itemActive]}
              onPress={() => onSelect(p)}
            >
              <Text
                style={[
                  styles.itemText,
                  p === period && styles.itemTextActive,
                ]}
              >
                {p}
              </Text>
              {p === period && (
                <Ionicons name="checkmark" size={16} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      zIndex: 50,
    },
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: borderRadius.lg,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    triggerText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.textSecondary,
    },
    menu: {
      position: 'absolute',
      top: 40,
      right: 0,
      backgroundColor: c.surfaceElevated,
      borderRadius: borderRadius.md,
      padding: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      borderWidth: 1,
      borderColor: c.border,
      minWidth: 140,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: borderRadius.sm,
    },
    itemActive: {
      backgroundColor: c.primary + '10',
    },
    itemText: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
    },
    itemTextActive: {
      color: c.primary,
      fontWeight: '600',
    },
  });
}
