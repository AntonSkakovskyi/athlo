import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import { useGetProfile, useUpdateProfile } from '@/hooks/api/useProfileAPI';
import { useToast } from '@/contexts/ToastContext';
import { validateFieldsMap, validateFields, required, minLength, minNumber, optionalMinNumber } from '@/utils/validation';
import {
  birthDateToAge,
  parseBirthDate,
  toBirthDateString,
  getBirthDateBounds,
  MIN_BIRTH_AGE_YEARS,
} from '@/utils/age';

export function useEditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showToast } = useToast();

  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Anthropometry
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(ActivityLevel.MODERATE);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(FitnessGoal.MAINTAIN);

  // Goals
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [carbInput, setCarbInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setNickname(profile.nickname);
      setAvatar(profile.avatar ?? null);
      
      setGender(profile.gender ?? Gender.MALE);
      setBirthDate(parseBirthDate(profile.birthDate));
      setHeight(profile.height ? String(profile.height) : '');
      setWeight(profile.weight ? String(profile.weight) : '');
      setActivityLevel(profile.activityLevel ?? ActivityLevel.MODERATE);
      setFitnessGoal(profile.fitnessGoal ?? FitnessGoal.MAINTAIN);

      setWaterGoalInput(profile.waterGoal ? String(profile.waterGoal) : '');
      setProteinInput(profile.proteinGoal ? String(profile.proteinGoal) : '');
      setFatInput(profile.fatGoal ? String(profile.fatGoal) : '');
      setCarbInput(profile.carbGoal ? String(profile.carbGoal) : '');
    }
  }, [profile]);

  const parsedHeight = parseInt(height, 10);
  const parsedWeight = parseFloat(weight);
  const birthDateString = birthDate ? toBirthDateString(birthDate) : null;
  const derivedAge = birthDateToAge(birthDateString);

  const parsedWater = parseInt(waterGoalInput, 10);
  const parsedProtein = parseInt(proteinInput, 10);
  const parsedFat = parseInt(fatInput, 10);
  const parsedCarb = parseInt(carbInput, 10);

  const waterGoalValue = isNaN(parsedWater) || parsedWater <= 0 ? null : parsedWater;
  const proteinValue = isNaN(parsedProtein) || parsedProtein <= 0 ? null : parsedProtein;
  const fatValue = isNaN(parsedFat) || parsedFat <= 0 ? null : parsedFat;
  const carbValue = isNaN(parsedCarb) || parsedCarb <= 0 ? null : parsedCarb;

  const hasChanges =
    profile !== undefined &&
    (fullName !== profile.fullName ||
      nickname !== profile.nickname ||
      avatar !== (profile.avatar ?? null) ||
      gender !== (profile.gender ?? Gender.MALE) ||
      birthDateString !== (profile.birthDate ?? null) ||
      parsedHeight !== (profile.height ?? 0) ||
      parsedWeight !== (profile.weight ?? 0) ||
      activityLevel !== (profile.activityLevel ?? ActivityLevel.MODERATE) ||
      fitnessGoal !== (profile.fitnessGoal ?? FitnessGoal.MAINTAIN) ||
      waterGoalValue !== (profile.waterGoal ?? null) ||
      proteinValue !== (profile.proteinGoal ?? null) ||
      fatValue !== (profile.fatGoal ?? null) ||
      carbValue !== (profile.carbGoal ?? null));

  const editingCalorieGoal = useMemo(() => {
    const p = parsedProtein || 0;
    const f = parsedFat || 0;
    const c = parsedCarb || 0;
    if (!p && !f && !c) return null;
    return Math.round(p * 4 + f * 9 + c * 4);
  }, [parsedProtein, parsedFat, parsedCarb]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatar(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  }, []);

  const handleSave = () => {
    setFieldErrors({});

    const inlineErrors = validateFieldsMap([
      { key: 'fullName', value: fullName, rules: [required('Full name'), minLength('Full name', 2)] },
      { key: 'nickname', value: nickname, rules: [required('Nickname'), minLength('Nickname', 2)] },
    ]);
    if (inlineErrors) { setFieldErrors(inlineErrors); return; }

    const { min: minBirthDate, max: maxBirthDate } = getBirthDateBounds();
    if (!birthDate) {
      showToast({ title: 'Birth date is required', variant: 'error' });
      return;
    }
    if (birthDate > maxBirthDate) {
      showToast({ title: `Must be at least ${MIN_BIRTH_AGE_YEARS} years old`, variant: 'error' });
      return;
    }
    if (birthDate < minBirthDate) {
      showToast({ title: 'Date of birth seems invalid', variant: 'error' });
      return;
    }

    const numericError = validateFields([
      { value: height, rules: [required('Height'), minNumber('Height', 1)] },
      { value: weight, rules: [required('Weight'), minNumber('Weight', 0.1)] },
      { value: waterGoalInput, rules: [optionalMinNumber('Water goal', 1)] },
      { value: proteinInput, rules: [optionalMinNumber('Protein', 0)] },
      { value: fatInput, rules: [optionalMinNumber('Fats', 0)] },
      { value: carbInput, rules: [optionalMinNumber('Carbs', 0)] },
    ]);
    if (numericError) { showToast({ title: numericError, variant: 'error' }); return; }

    const goalsChanged =
      waterGoalValue !== (profile?.waterGoal ?? null) ||
      proteinValue !== (profile?.proteinGoal ?? null) ||
      fatValue !== (profile?.fatGoal ?? null) ||
      carbValue !== (profile?.carbGoal ?? null);

    const updateData: any = {
      fullName,
      nickname,
      avatar,
      gender,
      birthDate: birthDateString,
      height: isNaN(parsedHeight) ? undefined : parsedHeight,
      weight: isNaN(parsedWeight) ? undefined : parsedWeight,
      activityLevel,
      fitnessGoal,
    };

    if (goalsChanged) {
      updateData.waterGoal = waterGoalValue;
      updateData.proteinGoal = proteinValue;
      updateData.fatGoal = fatValue;
      updateData.carbGoal = carbValue;
    }

    updateProfile.mutate(updateData, { onSuccess: () => router.back() });
  };

  return {
    insets,
    router,
    profile,
    isLoading,
    fullName,
    setFullName,
    nickname,
    setNickname,
    avatar,
    pickImage,
    gender,
    setGender,
    birthDate,
    setBirthDate,
    derivedAge,
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
    updateProfile,
    handleSave,
    fieldErrors,
  };
}
