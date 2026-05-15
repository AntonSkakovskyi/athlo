import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName);
      setNickname(profile.nickname);
    }
  }, [profile]);

  const hasChanges =
    profile !== undefined &&
    (fullName !== profile.fullName || nickname !== profile.nickname);

  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() ?? '';

  const handleSave = () => {
    updateProfile.mutate(
      { fullName, nickname },
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
    hasChanges,
    initials,
    updateProfile,
    handleSave,
  };
}
