import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { Button } from '@/components/ui/Button/Button';

const QUICK_ADD_OPTIONS = [150, 250, 500];

interface WaterQuickAddProps {
  showCustom: boolean;
  onQuickAdd: (ml: number) => void;
  onToggleCustom: () => void;
  quickAddingMl?: number | null;
}

export function WaterQuickAdd({ showCustom, onQuickAdd, onToggleCustom, quickAddingMl }: WaterQuickAddProps) {
  const isAnyLoading = quickAddingMl !== null && quickAddingMl !== undefined;

  return (
    <View style={styles.quickAddRow}>
      {QUICK_ADD_OPTIONS.map((ml) => (
        <Button
          key={ml}
          title={`+${ml} ml`}
          variant="secondary"
          size="sm"
          onPress={() => onQuickAdd(ml)}
          style={styles.quickAddBtn}
          isLoading={quickAddingMl === ml}
          disabled={isAnyLoading}
        />
      ))}
      <Button
        title={showCustom ? 'Close' : 'Custom'}
        variant="ghost"
        size="sm"
        onPress={onToggleCustom}
        style={styles.quickAddBtn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  quickAddRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickAddBtn: {
    flex: 1,
    paddingVertical: spacing.xs,
  },
});
