import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { IMealType } from '@athlo/shared';

interface AddMealSheetProps {
  mealTypes: IMealType[];
  onAdd: (mealTypeId: number, timeSuggestion?: string) => void;
  onClose: () => void;
}

export function AddMealSheet({ mealTypes, onAdd, onClose }: AddMealSheetProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [timeSuggestion, setTimeSuggestion] = useState('');

  const handleAdd = () => {
    if (!selectedTypeId) return;
    onAdd(selectedTypeId, timeSuggestion.trim() || undefined);
  };

  return (
    <Modal visible transparent animationType="slide">
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Add Meal</Text>

          <Text style={styles.label}>Meal Type</Text>
          <View style={styles.typeGrid}>
            {mealTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.typeChip,
                  selectedTypeId === type.id && styles.typeChipActive,
                ]}
                onPress={() => setSelectedTypeId(type.id)}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    selectedTypeId === type.id && styles.typeChipTextActive,
                  ]}
                >
                  {type.name}
                </Text>
              </Pressable>
            ))}
          </View>

          <Input
            label="Time Suggestion (optional)"
            value={timeSuggestion}
            onChangeText={setTimeSuggestion}
            placeholder="e.g. 08:00"
          />

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" onPress={onClose} style={styles.actionBtn} />
            <Button
              title="Add"
              variant="primary"
              onPress={handleAdd}
              disabled={!selectedTypeId}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing['2xl'],
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderLight,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  typeChipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  typeChipTextActive: {
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  actionBtn: {
    flex: 1,
  },
});
