import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Gender, ActivityLevel, FitnessGoal } from '@athlo/shared';
import { useGetProfile, useUpdateProfile } from '@/hooks/api/useProfileAPI';

export function useEditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);

  // Anthropometry
  const [gender, setGender] = useState<Gender>(Gender.MALE);
  const [age, setAge] = useState('');
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
      setAge(profile.age ? String(profile.age) : '');
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

  const parsedAge = parseInt(age, 10);
  const parsedHeight = parseInt(height, 10);
  const parsedWeight = parseFloat(weight);

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
      parsedAge !== (profile.age ?? 0) ||
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
    // Only send goals if they were explicitly changed, or send nulls to trigger server-side recalc
    // Actually, following the "Smart Overwrite" plan: 
    // if goals are unchanged from profile, we don't send them in the DTO if we want the server to recalculate.
    // BUT the user might want to KEEP their manual goals even if they change weight.
    
    // To implement "Smart Overwrite" as defined: 
    // "if any anthropometry field is updated AND explicit goals are NOT provided in the same request, recalculate"
    
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
      age: isNaN(parsedAge) ? undefined : parsedAge,
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
    updateProfile,
    handleSave,
  };
}
