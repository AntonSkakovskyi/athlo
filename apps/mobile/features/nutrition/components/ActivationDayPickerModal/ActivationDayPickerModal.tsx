import { useMemo, useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Button } from '@/components/ui/Button/Button';
import { Typography } from '@/components/ui/Typography/Typography';
import { borderRadius, spacing } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface ActivationDayPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (startDay: number) => void;
  totalDays: number;
  planName: string;
}

export function ActivationDayPickerModal({
  visible,
  onClose,
  onConfirm,
  totalDays,
  planName,
}: ActivationDayPickerModalProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedDay, setSelectedDay] = useState(1);

  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  const handleConfirm = () => {
    onConfirm(selectedDay);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Typography variant="h3" style={styles.title}>Activate Plan</Typography>
            <Typography variant="bodySmall" color={colors.textSecondary}>
              Choose which day of "{planName}" to start from.
            </Typography>
          </View>

          <View style={styles.daysContainer}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.daysGrid}>
                {days.map((day) => (
                  <Pressable
                    key={day}
                    style={[
                      styles.dayButton,
                      selectedDay === day && styles.dayButtonSelected,
                    ]}
                    onPress={() => setSelectedDay(day)}
                  >
                    <Typography
                      variant="body"
                      color={selectedDay === day ? colors.primary : colors.text}
                      style={selectedDay === day && styles.dayTextSelected}
                    >
                      Day {day}
                    </Typography>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.footer}>
            <Button
              title="Cancel"
              variant="ghost"
              onPress={onClose}
              style={styles.footerBtn}
            />
            <Button
              title="Activate"
              variant="primary"
              onPress={handleConfirm}
              style={styles.footerBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    content: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.xl,
      width: '100%',
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: {
      marginBottom: spacing.xs,
    },
    daysContainer: {
      maxHeight: 400,
    },
    scrollContent: {
      padding: spacing.lg,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    dayButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: c.border,
      minWidth: '30%',
      alignItems: 'center',
    },
    dayButtonSelected: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    dayTextSelected: {
      fontWeight: 'bold',
    },
    footer: {
      flexDirection: 'row',
      padding: spacing.lg,
      gap: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    footerBtn: {
      flex: 1,
    },
  });
}
