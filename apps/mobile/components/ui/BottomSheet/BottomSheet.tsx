import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  scrollable?: boolean;
  showCancel?: boolean;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  maxHeight?: number | string;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  scrollable = true,
  showCancel = true,
  footer,
  headerRight,
  maxHeight = '80%',
}: BottomSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors, insets.bottom, maxHeight), [colors, insets.bottom, maxHeight]);
  const ContentContainer = scrollable ? ScrollView : View;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.outerContainer}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          {(title || headerRight) && (
            <View style={styles.header}>
              <View style={styles.headerTitleContainer}>
                {title && <Text style={styles.title}>{title}</Text>}
              </View>
              {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
            </View>
          )}

          <ContentContainer style={styles.content} showsVerticalScrollIndicator={false}>
            {children}
          </ContentContainer>

          {footer}

          {showCancel && !footer && (
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

interface BottomSheetItemProps {
  label: string;
  icon?: string;
  onPress: () => void;
  danger?: boolean;
}

export function BottomSheetItem({ label, icon, onPress, danger }: BottomSheetItemProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors, 0, '80%'), [colors]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.item,
        pressed && styles.itemPressed
      ]}
      onPress={onPress}
    >
      {icon && <Text style={styles.itemIcon}>{icon}</Text>}
      <Text style={[styles.itemLabel, danger && styles.itemDanger]}>{label}</Text>
    </Pressable>
  );
}

function makeStyles(c: ColorPalette, bottomInset: number, maxHeight: number | string) {
  return StyleSheet.create({
    outerContainer: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: c.overlay,
    },
    sheet: {
      backgroundColor: c.surfaceElevated,
      borderTopLeftRadius: borderRadius.xl,
      borderTopRightRadius: borderRadius.xl,
      paddingTop: spacing.sm,
      paddingBottom: Math.max(spacing.xl, bottomInset + spacing.md),
      maxHeight: maxHeight as any,
      borderTopWidth: 1,
      borderColor: c.border,
    },
    sheetHandle: {
      width: 40,
      height: 4,
      backgroundColor: c.border,
      borderRadius: borderRadius.xs,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
      marginBottom: spacing.sm,
    },
    headerTitleContainer: {
      flex: 1,
    },
    headerRight: {
      marginLeft: spacing.md,
    },
    title: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: c.text,
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: spacing.sm,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: borderRadius.md,
      gap: spacing.md,
    },
    itemPressed: {
      backgroundColor: c.surfaceLight,
    },
    itemIcon: {
      fontSize: fontSize.xl,
      width: 28,
      textAlign: 'center',
    },
    itemLabel: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.medium,
      color: c.text,
    },
    itemDanger: {
      color: c.danger,
    },
    cancelBtn: {
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    cancelText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.primary,
    },
  });
}
