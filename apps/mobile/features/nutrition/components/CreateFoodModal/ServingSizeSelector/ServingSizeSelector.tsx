import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import type { IUnit } from '@athlo/shared';

interface ServingSizeSelectorProps {
  servingAmount: string;
  setServingAmount: (v: string) => void;
  servingUnitId: number;
  setServingUnitId: (v: number) => void;
  units: IUnit[];
}

export function ServingSizeSelector({
  servingAmount,
  setServingAmount,
  servingUnitId,
  setServingUnitId,
  units,
}: ServingSizeSelectorProps) {
  return (
    <>
      <Text style={styles.sectionTitle}>Serving Size</Text>
      <View style={styles.selectorContainer}>
        <View style={styles.amountInputSection}>
          <Text style={styles.inputLabel}>Amount</Text>
          <Input
            value={servingAmount}
            onChangeText={setServingAmount}
            keyboardType="numeric"
            placeholder="100"
            style={styles.amountInput}
          />
        </View>
        <View style={styles.unitSelectorSection}>
          <Text style={styles.inputLabel}>Unit</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.unitList}
          >
            {units.map((u) => (
              <Pressable
                key={u.id}
                style={[styles.unitChip, servingUnitId === u.id && styles.unitChipActive]}
                onPress={() => setServingUnitId(u.id)}
              >
                <Text style={[styles.unitChipText, servingUnitId === u.id && styles.unitChipTextActive]}>
                  {u.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  amountInputSection: {
    flex: 1,
  },
  unitSelectorSection: {
    flex: 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: spacing.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
    marginLeft: 4,
  },
  amountInput: {
    marginBottom: 0,
    height: 44,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 8,
    fontSize: fontSize.lg,
  },
  unitList: {
    gap: spacing.xs,
    paddingRight: spacing.lg,
    paddingVertical: 2,
  },
  unitChip: {
    height: 40,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  unitChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  unitChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  unitChipTextActive: {
    color: colors.black,
    fontWeight: 'bold',
  },
});
