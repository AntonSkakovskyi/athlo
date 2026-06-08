import { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, Pressable } from 'react-native';
import type { ITrackingType, IMuscle, IEquipment } from '@athlo/shared';
import { spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Chip } from '@/components/ui/Chip/Chip';
import { MusclePicker } from '@/features/workout/components/MusclePicker/MusclePicker';
import type { MuscleSelection } from '@/features/workout/components/MusclePicker/MusclePicker';
import type { ExerciseWithRelations } from '@/hooks/api';
import { ICONS } from '@/utils/icons';
import { validateFieldsMap, required } from '@/utils/validation';

const TRACKING_TYPE_LABELS: Record<string, string> = {
  WEIGHT_AND_REPS: `${ICONS.volume}  Weight + Reps`,
  REPS_ONLY: `${ICONS.reps}  Reps Only`,
  TIME_BASED: `${ICONS.time}  Time`,
  DISTANCE_AND_TIME: `${ICONS.distanceAndTime}  Time + Distance`,
  DISTANCE_ONLY: `${ICONS.distanceOnly}  Distance Only`,
};

interface UpdateExerciseFormData {
  name?: string;
  description?: string;
  trackingTypeId?: number;
  equipmentId?: number | null;
  muscles?: MuscleSelection[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (data: UpdateExerciseFormData) => void;
  isPending: boolean;
  exercise: ExerciseWithRelations;
  trackingTypes: ITrackingType[];
  muscles: IMuscle[];
  equipments: IEquipment[];
  topPadding?: number;
}

export function EditExerciseModal({
  visible,
  onClose,
  onSave,
  isPending,
  exercise,
  trackingTypes,
  muscles,
  equipments,
  topPadding = 0,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [name, setName] = useState(exercise.name);
  const [description, setDescription] = useState(exercise.description ?? '');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [trackingTypeId, setTrackingTypeId] = useState<number>(exercise.trackingTypeId ?? 1);
  const [equipmentId, setEquipmentId] = useState<number | null>(exercise.equipmentId ?? null);
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleSelection[]>(
    (exercise.exerciseMuscles ?? []).map((em) => ({
      muscleId: em.muscle.id,
      isPrimary: em.isPrimary,
    })),
  );
  const [musclesTouchedByUser, setMusclesTouchedByUser] = useState(false);
  const [showMusclePicker, setShowMusclePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(exercise.name);
      setDescription(exercise.description ?? '');
      setTrackingTypeId(exercise.trackingTypeId ?? 1);
      setEquipmentId(exercise.equipmentId ?? null);
      setSelectedMuscles(
        (exercise.exerciseMuscles ?? []).map((em) => ({
          muscleId: em.muscle.id,
          isPrimary: em.isPrimary,
        })),
      );
      setMusclesTouchedByUser(false);
      setShowMusclePicker(false);
    }
  }, [visible, exercise]);

  const handleSave = () => {
    setFieldErrors({});
    const validation = validateFieldsMap([
      { key: 'name', value: name, rules: [required('Exercise name')] },
    ]);
    if (validation) { setFieldErrors(validation); return; }

    const updates: UpdateExerciseFormData = {};
    if (name.trim() !== exercise.name) updates.name = name.trim();
    if ((description.trim() || undefined) !== (exercise.description ?? undefined)) {
      updates.description = description.trim() || undefined;
    }
    if (trackingTypeId !== exercise.trackingTypeId) updates.trackingTypeId = trackingTypeId;
    if (equipmentId !== exercise.equipmentId) updates.equipmentId = equipmentId;
    if (musclesTouchedByUser) updates.muscles = selectedMuscles;
    onSave(updates);
  };

  const handleMuscleChange = (updated: MuscleSelection[]) => {
    setMusclesTouchedByUser(true);
    setSelectedMuscles(updated);
  };

  const disableTrackingType = exercise.hasLoggedHistory === true;
  const isValid = name.trim().length > 0;

  const muscleLabel = useMemo(() => {
    if (selectedMuscles.length === 0) return 'Select muscles...';
    const names = selectedMuscles.map((sel) => {
      const m = muscles.find((mu) => mu.id === sel.muscleId);
      return m ? `${m.name} (${sel.isPrimary ? 'P' : 'S'})` : '';
    }).filter(Boolean);
    return names.join(', ');
  }, [selectedMuscles, muscles]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { paddingTop: topPadding }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>Edit Exercise</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          <Input
            label="Name *"
            value={name}
            onChangeText={setName}
            placeholder="Exercise name"
            error={fieldErrors.name}
          />

          <Input
            label="Description (optional)"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the exercise..."
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sectionLabel}>Tracking Type</Text>
          {disableTrackingType ? (
            <View style={styles.lockedRow}>
              <Text style={styles.lockedValue}>
                {TRACKING_TYPE_LABELS[trackingTypes.find((t) => t.id === trackingTypeId)?.name ?? ''] ??
                  trackingTypes.find((t) => t.id === trackingTypeId)?.name ?? '—'}
              </Text>
              <Text style={styles.lockedHint}>Locked — exercise has logged history</Text>
            </View>
          ) : (
            <View style={styles.chipsGrid}>
              {trackingTypes.map((tt) => (
                <Chip
                  key={tt.id}
                  label={TRACKING_TYPE_LABELS[tt.name] ?? tt.name}
                  active={trackingTypeId === tt.id}
                  onPress={() => setTrackingTypeId(tt.id)}
                  style={styles.chipNoMargin}
                />
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>Equipment</Text>
          <View style={styles.chipsGrid}>
            <Chip
              label="None"
              active={equipmentId === null}
              onPress={() => setEquipmentId(null)}
              style={styles.chipNoMargin}
            />
            {equipments.map((eq) => (
              <Chip
                key={eq.id}
                label={eq.name}
                active={equipmentId === eq.id}
                onPress={() => setEquipmentId(eq.id)}
                style={styles.chipNoMargin}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>Muscles</Text>
          <Pressable
            style={[styles.muscleSelector, selectedMuscles.length > 0 && styles.muscleSelectorActive]}
            onPress={() => setShowMusclePicker(true)}
          >
            <Text
              style={[
                styles.muscleSelectorText,
                selectedMuscles.length > 0 && styles.muscleSelectorTextActive,
              ]}
              numberOfLines={2}
            >
              {muscleLabel}
            </Text>
            <Text style={styles.muscleSelectorChevron}>▸</Text>
          </Pressable>

          <Button
            title="Save Changes"
            variant="primary"
            onPress={handleSave}
            isLoading={isPending}
            disabled={!isValid || isPending}
            style={styles.saveBtn}
          />
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </View>

      <MusclePicker
        visible={showMusclePicker}
        onClose={() => setShowMusclePicker(false)}
        muscles={muscles}
        selected={selectedMuscles}
        onChange={handleMuscleChange}
      />
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    cancelBtn: {
      fontSize: fontSize.md,
      color: c.danger,
      fontWeight: fontWeight.semibold,
      width: 60,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    headerSpacer: {
      width: 60,
    },
    form: {
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: c.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
    },
    lockedRow: {
      marginBottom: spacing.sm,
    },
    lockedValue: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: c.text,
      marginBottom: spacing.xs,
    },
    lockedHint: {
      fontSize: fontSize.xs,
      color: c.textMuted,
    },
    chipsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    chipNoMargin: {
      marginRight: 0,
    },
    muscleSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      minHeight: 44,
    },
    muscleSelectorActive: {
      borderColor: c.primary,
    },
    muscleSelectorText: {
      flex: 1,
      fontSize: fontSize.sm,
      color: c.textMuted,
    },
    muscleSelectorTextActive: {
      color: c.text,
    },
    muscleSelectorChevron: {
      fontSize: fontSize.md,
      color: c.textMuted,
      marginLeft: spacing.sm,
    },
    saveBtn: {
      marginTop: spacing.xl,
    },
    bottomSpacer: {
      height: 100,
    },
  });
}
