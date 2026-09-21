import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Button } from '../../../src/components/ui/Button';

export default function AdminMoreScreen() {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of KFA Academy?', [
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

  const menuItems = [
    {
      title: 'Grade / Level Management',
      subtitle: 'Manage Pre Grade to Grade 7 configurations',
      icon: 'school-outline',
      route: '/(admin)/more/grades',
    },
    {
      title: 'Batch Management',
      subtitle: 'Create batches, assign schedules & staff',
      icon: 'shapes-outline',
      route: '/(admin)/more/batches',
    },
    {
      title: 'Staff Management',
      subtitle: 'Create staff accounts & assign batch permissions',
      icon: 'people-outline',
      route: '/(admin)/more/staff',
    },
    {
      title: 'Attendance Audit Trail',
      subtitle: 'View historical edits, changes & logs',
      icon: 'time-outline',
      route: '/(admin)/more/audit-log',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Admin Profile Card */}
      <View style={[styles.profileCard, SHADOWS.sm]}>
        <View style={styles.avatarCircle}>
          <Ionicons name="shield-checkmark" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.nameText}>{profile?.full_name || 'Admin User'}</Text>
          <Text style={styles.emailText}>{profile?.email || 'admin@kfa.edu'}</Text>
          <Text style={styles.roleTag}>System Administrator</Text>
        </View>
      </View>

      {/* Management Modules Grid */}
      <Text style={styles.sectionTitle}>ACADEMY CONFIGURATION</Text>

      {menuItems.map((item, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.menuCard, SHADOWS.sm]}
          onPress={() => router.push(item.route as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconBox}>
            <Ionicons name={item.icon as any} size={22} color={COLORS.primary} />
          </View>

          <View style={styles.menuTextContent}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      ))}

      <View style={{ marginTop: SPACING.xl }}>
        <Button
          title="Sign Out of Portal"
          onPress={handleLogout}
          variant="danger"
          size="lg"
          icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
        />
      </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  profileInfo: {
    flex: 1,
  },
  nameText: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  emailText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  roleTag: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuTextContent: {
    flex: 1,
  },
  menuTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  menuSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
