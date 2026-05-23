import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { ColorPalette } from '@/constants/colors';

interface SplashScreenProps {
  opacity?: Animated.Value | number;
  scale?: Animated.Value | number;
}

export function SplashScreen({ opacity = 1, scale = 1 }: SplashScreenProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('@/assets/icon.png')} 
            style={styles.icon} 
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Athlo</Text>
        <Text style={styles.tagline}>your wellness journey</Text>
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      </Animated.View>
    </Animated.View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999,
    },
    circle1: {
      position: 'absolute',
      top: -60,
      right: -60,
      width: 200,
      height: 200,
      borderRadius: 100,
      backgroundColor: c.primary + '12', // ~0.07 opacity
    },
    circle2: {
      position: 'absolute',
      bottom: -80,
      left: -80,
      width: 250,
      height: 250,
      borderRadius: 125,
      backgroundColor: c.primary + '0A', // ~0.04 opacity
    },
    content: {
      alignItems: 'center',
    },
    iconContainer: {
      backgroundColor: c.surface,
      borderRadius: 24,
      padding: 16,
      shadowColor: c.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
      marginBottom: 20,
    },
    icon: {
      width: 80,
      height: 80,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
    },
    tagline: {
      fontSize: 13,
      color: c.primary,
      letterSpacing: 1,
    },
    loader: {
      marginTop: 40,
    },
  });
}
