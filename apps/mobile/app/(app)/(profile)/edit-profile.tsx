import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import { borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import type { ColorPalette } from '@/constants/colors';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { NumericInput } from '@/components/ui/NumericInput/NumericInput';
import { SegmentControl } from '@/components/ui/SegmentControl/SegmentControl';
import { OptionButton } from '@/components/ui/OptionButton/OptionButton';
import { Card } from '@/components/ui/Card/Card';
import { Typography } from '@/components/ui/Typography/Typography';
import { ScreenHeader } from '@/components/ui/ScreenHeader/ScreenHeader';
import { useEditProfileScreen } from '@/features/profile/hooks/useEditProfileScreen';

const ACTIVITY_LEVELS: { id: ActivityLevel; label: string }[] = [
  { id: ActivityLevel.SEDENTARY, label: 'Sedentary' },
  { id: ActivityLevel.LIGHT, label: 'Light' },
  { id: ActivityLevel.MODERATE, label: 'Moderate' },
  { id: ActivityLevel.ACTIVE, label: 'Active' },
  { id: ActivityLevel.VERY_ACTIVE, label: 'Very Active' },
];

const GOALS: { id: FitnessGoal; label: string }[] = [
  { id: FitnessGoal.LOSE_WEIGHT, label: 'Lose Weight' },
  { id: FitnessGoal.MAINTAIN, label: 'Maintain' },
  { id: FitnessGoal.BUILD_MUSCLE, label: 'Build Muscle' },
];

export default function EditProfileScreen() {
  const {
    insets,
    router,
    isLoading,
    fullName,
    setFullName,
    nickname,
    setNickname,
    avatar,
    pickImage,
    gender,
    setGender,
    age,
    setAge,
    height,
    setHeight,
    weight,
    setWeight,
    activityLevel,
    setActivityLevel,
    fitnessGoal,
    setFitnessGoal,
    waterGoalInput,
    setWaterGoalInput,
    proteinInput,
    setProteinInput,
    fatInput,
    setFatInput,
    carbInput,
    setCarbInput,
    editingCalorieGoal,
    hasChanges,
    handleSave,
    updateProfile,
    fieldErrors,
  } = useEditProfileScreen();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  const genderIdx = gender === Gender.MALE ? 0 : gender === Gender.FEMALE ? 1 : 2;
  const handleGenderSelect = (idx: number) => {
    setGender(idx === 0 ? Gender.MALE : idx === 1 ? Gender.FEMALE : Gender.OTHER);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader
        title="Edit Profile"
        onBack={() => router.back()}
        rightAction={
          <Pressable onPress={handleSave} disabled={!hasChanges} hitSlop={8}>
            <Text style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}>Save</Text>
          </Pressable>
        }
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing['2xl'],
          paddingHorizontal: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Avatar uri={avatar ?? undefined} name={fullName} size="xl" />
          <Pressable style={styles.changePhotoBtn} onPress={pickImage}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </Pressable>
        </View>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Personal Info</Typography>
          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            error={fieldErrors.fullName}
            containerStyle={styles.lastInputInCard}
          />
          <Input
            label="Nickname"
            value={nickname}
            onChangeText={setNickname}
            placeholder="Enter your nickname"
            error={fieldErrors.nickname}
            containerStyle={styles.lastInputInCard}
          />
          <View style={styles.inputGroup}>
            <Typography variant="label" style={styles.fieldLabel}>Gender</Typography>
            <SegmentControl
              segments={['Male', 'Female', 'Other']}
              activeIndex={genderIdx}
              onSelect={handleGenderSelect}
            />
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Physical Metrics</Typography>
          <View style={styles.metricsRow}>
            <View style={styles.metricInputWrap}>
              <Typography variant="label" style={styles.fieldLabel}>Age</Typography>
              <NumericInput value={age} onChangeText={setAge} placeholder="Years" />
            </View>
            <View style={styles.metricInputWrap}>
              <Typography variant="label" style={styles.fieldLabel}>Height (cm)</Typography>
              <NumericInput value={height} onChangeText={setHeight} placeholder="cm" />
            </View>
            <View style={styles.metricInputWrap}>
              <Typography variant="label" style={styles.fieldLabel}>Weight (kg)</Typography>
              <NumericInput value={weight} onChangeText={setWeight} placeholder="kg" />
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Activity & Goal</Typography>
          <Typography variant="label" style={styles.fieldLabel}>Activity Level</Typography>
          <View style={styles.optionsContainer}>
            {ACTIVITY_LEVELS.map(level => (
              <OptionButton
                key={level.id}
                label={level.label}
                active={activityLevel === level.id}
                onPress={() => setActivityLevel(level.id)}
                style={styles.optionButton}
              />
            ))}
          </View>

          <Typography variant="label" style={[styles.fieldLabel, { marginTop: spacing.md }]}>Fitness Goal</Typography>
          <View style={styles.optionsContainer}>
            {GOALS.map(g => (
              <OptionButton
                key={g.id}
                label={g.label}
                active={fitnessGoal === g.id}
                onPress={() => setFitnessGoal(g.id)}
                style={styles.optionButton}
              />
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h4" style={styles.cardTitle}>Water & Nutrition</Typography>
          <Typography variant="caption" style={styles.sectionDesc}>
            Leave unchanged to keep automatic calculation based on metrics.
          </Typography>
          
          <Input
            label="Daily Water Goal (ml)"
            value={waterGoalInput}
            onChangeText={setWaterGoalInput}
            keyboardType="number-pad"
            placeholder="e.g. 2500"
          />

          <View style={styles.nutritionRow}>
            <View style={styles.nutritionInputWrap}>
              <Input
                label="Protein (g)"
                value={proteinInput}
                onChangeText={setProteinInput}
                keyboardType="number-pad"
                placeholder="150"
              />
            </View>
            <View style={styles.nutritionInputWrap}>
              <Input
                label="Fats (g)"
                value={fatInput}
                onChangeText={setFatInput}
                keyboardType="number-pad"
                placeholder="70"
              />
            </View>
            <View style={styles.nutritionInputWrap}>
              <Input
                label="Carbs (g)"
                value={carbInput}
                onChangeText={setCarbInput}
                keyboardType="number-pad"
                placeholder="250"
              />
            </View>
          </View>

          <View style={styles.calorieRow}>
            <Typography variant="body" style={styles.calorieLabel}>Total Calories:</Typography>
            <Typography variant="h3" style={styles.calorieValue}>
              {editingCalorieGoal ? `${editingCalorieGoal} kcal` : '0 kcal'}
            </Typography>
          </View>
        </Card>

        <Button
          title="Save All Changes"
          onPress={handleSave}
          disabled={!hasChanges}
          isLoading={updateProfile.isPending}
          style={styles.footerBtn}
        />
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    container: {
      flex: 1,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.background,
    },
    saveBtn: {
      fontSize: fontSize.md,
      color: c.primary,
      fontWeight: fontWeight.bold,
    },
    saveBtnDisabled: {
      color: c.textMuted,
    },
    avatarSection: {
      alignItems: 'center',
      marginVertical: spacing.xl,
    },
    changePhotoBtn: {
      marginTop: spacing.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.xl,
      borderRadius: borderRadius.full,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
    },
    changePhotoText: {
      fontSize: fontSize.md,
      color: c.primary,
      fontWeight: fontWeight.semibold,
    },
    card: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    cardTitle: {
      marginBottom: spacing.lg,
      color: c.text,
    },
    sectionDesc: {
      marginBottom: spacing.md,
      color: c.textMuted,
    },
    fieldLabel: {
      marginBottom: spacing.xs,
      color: c.textSecondary,
    },
    inputGroup: {
      marginTop: spacing.xs,
    },
    lastInputInCard: {
      marginBottom: spacing.md,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    metricInputWrap: {
      flex: 1,
    },
    optionsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    optionButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    nutritionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    nutritionInputWrap: {
      flex: 1,
    },
    calorieRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
    },
    calorieLabel: {
      color: c.textSecondary,
    },
    calorieValue: {
      color: c.primary,
    },
    footerBtn: {
      marginTop: spacing.md,
    },
  });
}

