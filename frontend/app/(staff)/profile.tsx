import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';

export default function StaffProfileScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.profileCard, SHADOWS.md]}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={40} color={COLORS.primary} />
        </View>

        <Text style={styles.nameText}>{profile?.full_name || 'Mrs. Priya Sharma'}</Text>
        <Text style={styles.emailText}>{profile?.email || 'staff.priya@kfa.edu'}</Text>
        <Text style={styles.phoneText}>📞 {profile?.phone || '+91 98765 12345'}</Text>
        <Text style={styles.roleBadge}>Academy Staff Teacher</Text>
      </View>

      <Button
        title="Sign Out of Portal"
        onPress={handleLogout}
        variant="danger"
        size="lg"
        icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
        style={{ marginTop: SPACING.xl }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  nameText: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  roleBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
