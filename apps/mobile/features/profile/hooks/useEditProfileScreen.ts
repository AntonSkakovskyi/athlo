import { useState, useEffect, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGetProfile, useUpdateProfile } from '@/features/profile/hooks';

export function useEditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [waterGoalInput, setWaterGoalInput] = useState('');
  const [proteinInput, setProteinInput] = useState('');
  const [fatInput, setFatInput] = useState('');
  const [carbInput, setCarbInput] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setNickname(profile.nickname);
      setWaterGoalInput(profile.waterGoal ? String(profile.waterGoal) : '');
      setProteinInput(profile.proteinGoal ? String(profile.proteinGoal) : '');
      setFatInput(profile.fatGoal ? String(profile.fatGoal) : '');
      setCarbInput(profile.carbGoal ? String(profile.carbGoal) : '');
    }
  }, [profile]);

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

  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '';

  const handleSave = () => {
    updateProfile.mutate(
      {
        fullName,
        nickname,
        waterGoal: waterGoalValue,
        proteinGoal: proteinValue,
        fatGoal: fatValue,
        carbGoal: carbValue,
      },
      { onSuccess: () => router.back() },
    );
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
    initials,
    updateProfile,
    handleSave,
  };
}
