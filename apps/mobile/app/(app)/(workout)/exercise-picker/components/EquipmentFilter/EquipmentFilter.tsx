import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { IMuscle, IEquipment } from '@athlo/shared';
import { spacing, borderRadius, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { BottomSheet, BottomSheetItem } from '@/components/ui/BottomSheet/BottomSheet';
import { Ionicons } from '@expo/vector-icons';

interface EquipmentFilterProps {
  selectedMuscleId: number | null;
  selectedEquipmentId: number | null;
  muscles: IMuscle[];
  equipments: IEquipment[];
  onToggleMuscle: (id: number) => void;
  onToggleEquipment: (id: number) => void;
}

export function EquipmentFilter({
  selectedMuscleId,
  selectedEquipmentId,
  muscles,
  equipments,
  onToggleMuscle,
  onToggleEquipment,
}: EquipmentFilterProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [muscleSheetVisible, setMuscleSheetVisible] = useState(false);
  const [equipmentSheetVisible, setEquipmentSheetVisible] = useState(false);
  const [muscleSearch, setMuscleSearch] = useState('');
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const filteredMuscles = useMemo(
    () => muscles.filter((m) => m.name.toLowerCase().includes(muscleSearch.toLowerCase())),
    [muscles, muscleSearch],
  );

  const filteredEquipments = useMemo(
    () => equipments.filter((e) => e.name.toLowerCase().includes(equipmentSearch.toLowerCase())),
    [equipments, equipmentSearch],
  );

  const selectedMuscleName = muscles.find((m) => m.id === selectedMuscleId)?.name ?? 'Muscles';
  const selectedEquipmentName =
    selectedEquipmentId === -1
      ? 'No equipment'
      : (equipments.find((e) => e.id === selectedEquipmentId)?.name ?? 'Equipment');

  return (
    <>
      <View style={styles.filtersRow}>
        <View style={styles.filterBtnWrap}>
          <Pressable
            style={[styles.filterBtn, !!selectedMuscleId && styles.filterBtnActive]}
            onPress={() => setMuscleSheetVisible(true)}
          >
            <Text style={[styles.filterBtnText, !!selectedMuscleId && styles.filterBtnTextActive]} numberOfLines={1}>
              {selectedMuscleName}
            </Text>
            {selectedMuscleId ? (
              <Pressable onPress={(e) => { e.stopPropagation(); onToggleMuscle(selectedMuscleId); }} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            )}
          </Pressable>
        </View>

        <View style={styles.filterBtnWrap}>
          <Pressable
            style={[styles.filterBtn, !!selectedEquipmentId && styles.filterBtnActive]}
            onPress={() => setEquipmentSheetVisible(true)}
          >
            <Text style={[styles.filterBtnText, !!selectedEquipmentId && styles.filterBtnTextActive]} numberOfLines={1}>
              {selectedEquipmentName}
            </Text>
            {selectedEquipmentId ? (
              <Pressable onPress={(e) => { e.stopPropagation(); onToggleEquipment(selectedEquipmentId); }} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={colors.primary} />
              </Pressable>
            ) : (
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            )}
          </Pressable>
        </View>
      </View>

      <BottomSheet
        visible={muscleSheetVisible}
        onClose={() => { setMuscleSheetVisible(false); setMuscleSearch(''); }}
        title="Select Muscle"
      >
        <View style={styles.sheetSearchWrap}>
          <Input
            placeholder="Search muscles..."
            value={muscleSearch}
            onChangeText={setMuscleSearch}
            style={styles.sheetSearchInput}
          />
        </View>
        {filteredMuscles.length > 0 ? (
          filteredMuscles.map((muscle: IMuscle) => (
            <BottomSheetItem
              key={muscle.id}
              label={muscle.name}
              onPress={() => { onToggleMuscle(muscle.id); setMuscleSheetVisible(false); setMuscleSearch(''); }}
            />
          ))
        ) : (
          <Text style={styles.noResults}>No muscles found</Text>
        )}
      </BottomSheet>

      <BottomSheet
        visible={equipmentSheetVisible}
        onClose={() => { setEquipmentSheetVisible(false); setEquipmentSearch(''); }}
        title="Select Equipment"
      >
        <View style={styles.sheetSearchWrap}>
          <Input
            placeholder="Search equipment..."
            value={equipmentSearch}
            onChangeText={setEquipmentSearch}
            style={styles.sheetSearchInput}
          />
        </View>
        {!equipmentSearch && (
          <BottomSheetItem
            label="No equipment"
            onPress={() => { onToggleEquipment(-1); setEquipmentSheetVisible(false); setEquipmentSearch(''); }}
          />
        )}
        {filteredEquipments.length > 0 ? (
          filteredEquipments.map((eq: IEquipment) => (
            <BottomSheetItem
              key={eq.id}
              label={eq.name}
              onPress={() => { onToggleEquipment(eq.id); setEquipmentSheetVisible(false); setEquipmentSearch(''); }}
            />
          ))
        ) : (
          <Text style={styles.noResults}>No equipment found</Text>
        )}
      </BottomSheet>
    </>
  );
}

export default EquipmentFilter;

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    filtersRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    filterBtnWrap: {
      flex: 1,
    },
    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      gap: spacing.xs,
    },
    filterBtnActive: {
      borderColor: c.primary,
      backgroundColor: c.primary + '10',
    },
    filterBtnText: {
      fontSize: 14,
      color: c.text,
      fontWeight: '500',
      flex: 1,
    },
    filterBtnTextActive: {
      color: c.primary,
    },
    sheetSearchWrap: {
      paddingHorizontal: spacing.sm,
    },
    sheetSearchInput: {
      backgroundColor: c.surfaceLight,
      fontSize: fontSize.md,
    },
    noResults: {
      textAlign: 'center',
      paddingVertical: spacing.lg,
      color: c.textSecondary,
      fontSize: 14,
    },
  });
}
