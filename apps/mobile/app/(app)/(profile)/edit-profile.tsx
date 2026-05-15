import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { colors, borderRadius, spacing, fontSize, fontWeight } from '@/constants/theme';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useEditProfileScreen } from '@/features/profile/hooks/useEditProfileScreen';

export default function EditProfileScreen() {
  const {
    insets,
    router,
    isLoading,
    fullName,
    setFullName,
    nickname,
    setNickname,
    hasChanges,
    initials,
    updateProfile,
    handleSave,
  } = useEditProfileScreen();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <Spinner size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + spacing.sm, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Back</Text>
        </Pressable>
        <Text style={styles.screenTitle}>Edit Profile</Text>
        <Pressable onPress={handleSave} disabled={!hasChanges}>
          <Text style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}>Save</Text>
        </Pressable>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Pressable style={styles.changePhotoBtn}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </Pressable>
      </View>

      <View style={styles.form}>
        <Input label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
        <Input label="Nickname" value={nickname} onChangeText={setNickname} placeholder="Enter your nickname" />
      </View>

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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing['2xl'] },
  backBtn: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.semibold },
  screenTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  saveBtn: { fontSize: fontSize.lg, color: colors.primary, fontWeight: fontWeight.semibold },
  saveBtnDisabled: { color: colors.textMuted },
  avatarSection: { alignItems: 'center', marginBottom: spacing['3xl'] },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, color: colors.primary },
  changePhotoBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  changePhotoText: { fontSize: fontSize.md, color: colors.primary, fontWeight: fontWeight.semibold },
  form: { marginBottom: spacing['2xl'] },
  footerBtn: { marginTop: spacing.sm },
});
