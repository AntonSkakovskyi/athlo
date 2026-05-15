import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, borderRadius, spacing } from '@/constants/theme';
import { useGetProfile, useUpdateProfile } from '../../../hooks/api/useProfileHooks';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';

export default function EditProfileScreen() {
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
    profile && (fullName !== profile.fullName || nickname !== profile.nickname);

  const handleSave = () => {
    updateProfile.mutate(
      { fullName, nickname },
      { onSuccess: () => router.back() },
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  const initials = fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={!hasChanges}>
          <Text style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}>Save</Text>
        </Pressable>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Pressable style={styles.changePhotoBtn}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </Pressable>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <Input
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
        />
        <Input
          label="Nickname"
          value={nickname}
          onChangeText={setNickname}
          placeholder="Enter your nickname"
        />
      </View>

      {/* Footer */}
      <Button
        title="Save Changes"
        onPress={handleSave}
        disabled={!hasChanges}
        isLoading={updateProfile.isPending}
        style={styles.footerBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  saveBtn: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  saveBtnDisabled: {
    color: colors.textMuted,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
  },
  changePhotoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changePhotoText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
  },
  footerBtn: {
    marginTop: 8,
  },
});
