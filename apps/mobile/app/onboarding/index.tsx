import { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import { Typography, NumericInput, SegmentControl, OptionButton, Button, ProgressBar, Card } from '@/components/ui';
import { spacing, borderRadius, fontSize } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { useUpdateProfile } from '@/hooks/api/useProfileAPI';

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; desc: string }[] = [
  { id: ActivityLevel.SEDENTARY, label: 'Sedentary', desc: 'Little to no exercise' },
  { id: ActivityLevel.LIGHT, label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
  { id: ActivityLevel.MODERATE, label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
  { id: ActivityLevel.ACTIVE, label: 'Active', desc: 'Hard exercise 6-7 days/week' },
  { id: ActivityLevel.VERY_ACTIVE, label: 'Very Active', desc: 'Very hard exercise/physical job' },
];

const GOALS: { id: FitnessGoal; label: string }[] = [
  { id: FitnessGoal.LOSE_WEIGHT, label: 'Lose Weight' },
  { id: FitnessGoal.MAINTAIN, label: 'Maintain Weight' },
  { id: FitnessGoal.BUILD_MUSCLE, label: 'Build Muscle' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();

  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(ActivityLevel.MODERATE);
  const [goal, setGoal] = useState<FitnessGoal>(FitnessGoal.MAINTAIN);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    const ageNum = parseInt(age, 10);
    const weightNum = parseFloat(weight);
    const heightNum = parseInt(height, 10);

    try {
      await updateProfile({
        gender,
        age: ageNum,
        weight: weightNum,
        height: heightNum,
        activityLevel,
        fitnessGoal: goal,
      });
      router.replace('/(app)/(nutrition)');
    } catch (err) {
      console.error('Failed to update profile during onboarding:', err);
    }
  };

  const isStepValid = useMemo(() => {
    if (step === 1) return !!age && parseInt(age, 10) > 0;
    if (step === 2) return !!weight && !!height && parseFloat(weight) > 0 && parseInt(height, 10) > 0;
    return true;
  }, [step, age, weight, height]);

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Typography variant="h2" style={styles.stepTitle}>Tell us about yourself</Typography>
            <Typography variant="bodySmall" style={styles.stepDesc}>
              This helps us personalize your experience and goals.
            </Typography>

            <Card style={styles.card}>
              <View style={styles.section}>
                <Typography variant="label" style={styles.label}>Gender</Typography>
                <SegmentControl
                  segments={['Male', 'Female', 'Other']}
                  activeIndex={gender === Gender.MALE ? 0 : gender === Gender.FEMALE ? 1 : 2}
                  onSelect={(idx) => setGender(idx === 0 ? Gender.MALE : idx === 1 ? Gender.FEMALE : Gender.OTHER)}
                />
              </View>

              <View style={[styles.section, { marginBottom: 0 }]}>
                <Typography variant="label" style={styles.label}>Age</Typography>
                <View style={styles.numericInputWrapper}>
                  <NumericInput value={age} onChangeText={setAge} placeholder="Years" />
                </View>
              </View>
            </Card>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Typography variant="h2" style={styles.stepTitle}>Your physical metrics</Typography>
            <Typography variant="bodySmall" style={styles.stepDesc}>
              We use this to calculate your daily calorie and water needs.
            </Typography>

            <Card style={styles.card}>
              <View style={styles.metricsRow}>
                <View style={styles.metricItem}>
                  <Typography variant="label" style={styles.label}>Height (cm)</Typography>
                  <NumericInput value={height} onChangeText={setHeight} placeholder="175" />
                </View>

                <View style={styles.metricItem}>
                  <Typography variant="label" style={styles.label}>Weight (kg)</Typography>
                  <NumericInput value={weight} onChangeText={setWeight} placeholder="70" />
                </View>
              </View>
            </Card>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Typography variant="h2" style={styles.stepTitle}>Lifestyle & Goal</Typography>
            <Typography variant="bodySmall" style={styles.stepDesc}>
              How active are you and what do you want to achieve?
            </Typography>

            <Card style={styles.card}>
              <Typography variant="h4" style={styles.cardHeader}>Activity Level</Typography>
              <View style={styles.optionsContainer}>
                {ACTIVITY_LEVELS.map(level => (
                  <Pressable
                    key={level.id}
                    style={[styles.activityOption, activityLevel === level.id && styles.activityOptionActive]}
                    onPress={() => setActivityLevel(level.id)}
                  >
                    <Typography 
                      variant="h4" 
                      color={activityLevel === level.id ? colors.primary : colors.text}
                      style={{ fontSize: 16 }}
                    >
                      {level.label}
                    </Typography>
                    <Typography variant="caption" color={colors.textMuted}>
                      {level.desc}
                    </Typography>
                  </Pressable>
                ))}
              </View>
            </Card>

            <Card style={styles.card}>
              <Typography variant="h4" style={styles.cardHeader}>Primary Goal</Typography>
              <View style={styles.optionsContainer}>
                {GOALS.map(g => (
                  <OptionButton
                    key={g.id}
                    label={g.label}
                    active={goal === g.id}
                    onPress={() => setGoal(g.id)}
                    style={styles.goalButton}
                  />
                ))}
              </View>
            </Card>
          </View>
        );
    }
  };

  return (
    <View style={[styles.safeArea, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {step > 1 && (
            <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
              <Typography variant="body" color={colors.primary} style={{ fontWeight: '600' }}>
                ← Back
              </Typography>
            </Pressable>
          )}
        </View>
        
        <View style={styles.progressWrapper}>
          <ProgressBar progress={(step / 3) * 100} style={styles.progressBar} />
          <Typography variant="caption" color={colors.textMuted} style={styles.stepCounter}>
            Step {step} of 3
          </Typography>
        </View>

        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title={step === 3 ? "Complete Setup" : "Continue"}
          onPress={handleNext}
          isLoading={isPending}
          disabled={!isStepValid || isPending}
        />
      </View>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: c.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    headerLeft: {
      width: 70,
    },
    headerRight: {
      width: 70,
    },
    backBtn: {
      paddingVertical: spacing.xs,
    },
    progressWrapper: {
      flex: 1,
      alignItems: 'center',
    },
    progressBar: {
      width: '100%',
      height: 6,
      marginBottom: 4,
    },
    stepCounter: {
      fontSize: 12,
    },
    container: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    stepContainer: {
      flex: 1,
    },
    stepTitle: {
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    stepDesc: {
      marginBottom: spacing.xl,
      textAlign: 'center',
      color: c.textMuted,
    },
    card: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    cardHeader: {
      marginBottom: spacing.md,
      fontSize: 18,
    },
    section: {
      marginBottom: spacing.lg,
    },
    label: {
      marginBottom: spacing.xs,
      color: c.textSecondary,
    },
    numericInputWrapper: {
      width: 100,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.lg,
    },
    metricItem: {
      flex: 1,
    },
    optionsContainer: {
      gap: spacing.sm,
    },
    activityOption: {
      padding: spacing.md,
      borderRadius: borderRadius.md,
      backgroundColor: c.surfaceLight,
      borderWidth: 1,
      borderColor: c.border,
    },
    activityOptionActive: {
      borderColor: c.primary,
      backgroundColor: c.primaryLight,
    },
    goalButton: {
      paddingVertical: spacing.md,
    },
    footer: {
      padding: spacing.lg,
      backgroundColor: c.background,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
  });
}

