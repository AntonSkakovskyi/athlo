import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import type { IMuscle } from '@athlo/shared';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Button } from '@/components/ui/Button/Button';
import { BottomSheet } from '@/components/ui';
import { ICONS } from '@/utils/icons';

export interface MuscleSelection {
  muscleId: number;
  isPrimary: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  muscles: IMuscle[];
  selected: MuscleSelection[];
  onChange: (selected: MuscleSelection[]) => void;
  topPadding?: number;
}

const GROUP_ORDER = ['Chest', 'Back', 'Shoulders', 'Arms', 'Core', 'Legs', 'Other'] as const;

const MUSCLE_GROUPS: Record<string, string[]> = {
  Chest: ['Chest'],
  Back: ['Lats', 'Upper Back', 'Lower Back', 'Traps'],
  Shoulders: ['Shoulders'],
  Arms: ['Biceps', 'Triceps', 'Forearms'],
  Core: ['Abdominals'],
  Legs: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abductors', 'Adductors'],
  Other: ['Cardio', 'Full Body', 'Neck', 'Other'],
};

export function MusclePicker({ visible, onClose, muscles, selected, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(GROUP_ORDER));

  const muscleByName = useMemo(() => {
    const map: Record<string, IMuscle> = {};
    muscles.forEach((m) => { map[m.name] = m; });
    return map;
  }, [muscles]);

  const toggleGroup = (group: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  };

  const toggleMuscle = (muscleId: number) => {
    const exists = selected.find((m) => m.muscleId === muscleId);
    if (exists) {
      onChange(selected.filter((m) => m.muscleId !== muscleId));
    } else {
      onChange([...selected, { muscleId, isPrimary: true }]);
    }
  };

  const toggleRole = (muscleId: number) => {
    onChange(selected.map((m) => m.muscleId === muscleId ? { ...m, isPrimary: !m.isPrimary } : m));
  };

  const footer = useMemo(() => {
    if (selected.length === 0) return null;
    return (
      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {selected.length} muscle{selected.length > 1 ? 's' : ''} selected
        </Text>
        <Button
          title="Clear all"
          variant="ghost"
          onPress={() => onChange([])}
          style={styles.clearBtn}
        />
      </View>
    );
  }, [selected, onChange, styles]);

  const headerRight = (
    <Pressable onPress={onClose} hitSlop={12}>
      <Text style={styles.doneBtn}>Done</Text>
    </Pressable>
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select Muscles"
      headerRight={headerRight}
      footer={footer}
      scrollable={false}
      maxHeight="85%"
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {GROUP_ORDER.map((group) => {
          const muscleNames = MUSCLE_GROUPS[group] ?? [];
          const groupMuscles = muscleNames
            .map((name) => muscleByName[name])
            .filter(Boolean) as IMuscle[];
          if (groupMuscles.length === 0) return null;

          const isOpen = expanded.has(group);

          return (
            <View key={group} style={styles.group}>
              <Pressable style={styles.groupHeader} onPress={() => toggleGroup(group)}>
                <Text style={styles.groupLabel}>{group}</Text>
                <Text style={styles.groupChevron}>{isOpen ? '▾' : '▸'}</Text>
              </Pressable>

              {isOpen && groupMuscles.map((muscle) => {
                const sel = selected.find((m) => m.muscleId === muscle.id);
                const isSelected = Boolean(sel);
                const isPrimary = sel?.isPrimary ?? true;

                return (
                  <View key={muscle.id} style={styles.muscleRow}>
                    <Pressable
                      style={[styles.checkbox, isSelected && styles.checkboxSelected]}
                      onPress={() => toggleMuscle(muscle.id)}
                      hitSlop={8}
                    >
                      {isSelected && <Text style={styles.checkmark}>{ICONS.checkInline}</Text>}
                    </Pressable>

                    <Text style={[styles.muscleName, isSelected && styles.muscleNameSelected]}>
                      {muscle.name}
                    </Text>

                    {isSelected && (
                      <Pressable
                        style={[styles.roleBtn, isPrimary ? styles.rolePrimary : styles.roleSecondary]}
                        onPress={() => toggleRole(muscle.id)}
                        hitSlop={8}
                      >
                        <Text style={styles.roleBtnText}>{isPrimary ? 'Primary' : 'Secondary'}</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </BottomSheet>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    doneBtn: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.primary,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
    },
    group: {
      marginTop: spacing.sm,
    },
    groupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    groupLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.bold,
      color: c.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    groupChevron: {
      fontSize: fontSize.md,
      color: c.textMuted,
    },
    muscleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: borderRadius.xs,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxSelected: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    checkmark: {
      color: c.black,
      fontSize: 12,
      fontWeight: fontWeight.bold,
    },
    muscleName: {
      flex: 1,
      fontSize: fontSize.md,
      color: c.textSecondary,
    },
    muscleNameSelected: {
      color: c.text,
      fontWeight: fontWeight.medium,
    },
    roleBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      borderWidth: 1,
    },
    rolePrimary: {
      backgroundColor: c.primaryLight,
      borderColor: c.primary,
    },
    roleSecondary: {
      backgroundColor: c.surfaceLight,
      borderColor: c.textSecondary,
    },
    roleBtnText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: c.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerHint: {
      fontSize: fontSize.sm,
      color: c.textMuted,
    },
    clearBtn: {
      paddingVertical: spacing.xs,
    },
    bottomSpacer: {
      height: 24,
    },
  });
}

