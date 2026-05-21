import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Typography } from '../Typography/Typography';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  initiallyExpanded?: boolean;
  count?: number;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  initiallyExpanded = false,
  count,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  const toggleExpand = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
  }, []);

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleExpand} style={styles.header}>
        <View style={styles.titleRow}>
          <Typography variant="h3" style={styles.title}>
            {title}
          </Typography>
          {count !== undefined && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
        </View>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textMuted}
        />
      </Pressable>
      {isExpanded && <View>{children}</View>}
    </View>
  );
};

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      backgroundColor: c.surface,
      borderRadius: borderRadius.md,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: c.surface,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      color: c.text,
    },
    countBadge: {
      backgroundColor: c.primary + '20',
      paddingHorizontal: 6,
      paddingVertical: spacing.xxs,
      borderRadius: borderRadius.md,
      marginLeft: spacing.sm,
    },
    countText: {
      fontSize: 12,
      fontWeight: '600',
      color: c.primary,
    },
  });
}
