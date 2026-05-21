import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AchievementToastProps {
  visible: boolean;
  title: string;
  description?: string;
  onClose: () => void;
}

export function AchievementToast({ visible, title, description, onClose }: AchievementToastProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-150)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: insets.top + spacing.sm,
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      const timer = setTimeout(() => {
        closeToast();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, insets.top]);

  const closeToast = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <Pressable onPress={closeToast} style={styles.content}>
        <Text style={styles.icon}>🏆</Text>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{title}</Text>
          {description ? <Text style={styles.description} numberOfLines={2}>{description}</Text> : null}
        </View>
        <Pressable onPress={closeToast} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: spacing.lg,
      right: spacing.lg,
      zIndex: 9999,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.surface,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      borderWidth: 2,
      borderColor: c.gold,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    icon: {
      fontSize: 32,
      marginRight: spacing.sm,
    },
    textWrap: {
      flex: 1,
      marginRight: spacing.sm,
    },
    title: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.bold,
      color: c.text,
    },
    description: {
      fontSize: fontSize.sm,
      color: c.textSecondary,
      marginTop: 2,
    },
    closeBtn: {
      padding: spacing.xs,
    },
    closeText: {
      fontSize: fontSize.md,
      color: c.textMuted,
    },
  });
}
