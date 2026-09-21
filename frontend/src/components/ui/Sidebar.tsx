import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ViewStyle } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  visible?: boolean;
  onClose?: () => void;
  isDrawer?: boolean;
  style?: ViewStyle;
}

export const Sidebar: React.FC<SidebarProps> = ({
  visible = true,
  onClose,
  isDrawer = false,
  style,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, role, logout } = useAuth();

  const isAdmin = role === 'ADMIN';

  const adminNavItems = [
    { title: 'Dashboard', icon: 'home-outline', route: '/(admin)' },
    { title: 'Student Directory', icon: 'people-outline', route: '/(admin)/students' },
    { title: 'Class Schedules', icon: 'calendar-outline', route: '/(admin)/classes' },
    { title: 'View Attendance Logs', icon: 'checkmark-done-circle-outline', route: '/(admin)/attendance/mark' },
    { title: 'Attendance Reports', icon: 'stats-chart-outline', route: '/(admin)/reports' },
    { title: 'Grade / Level Management', icon: 'school-outline', route: '/(admin)/more/grades' },
    { title: 'Batch Management', icon: 'shapes-outline', route: '/(admin)/more/batches' },
    { title: 'Staff Directory', icon: 'person-add-outline', route: '/(admin)/more/staff' },
    { title: 'Attendance Audit Trail', icon: 'time-outline', route: '/(admin)/more/audit-log' },
  ];

  const staffNavItems = [
    { title: 'Staff Dashboard', icon: 'home-outline', route: '/(staff)' },
    { title: 'My Classes', icon: 'calendar-outline', route: '/(staff)/classes' },
    { title: 'Mark Attendance', icon: 'checkmark-done-circle-outline', route: '/(staff)/attendance' },
    { title: 'Batch Reports', icon: 'stats-chart-outline', route: '/(staff)/reports' },
    { title: 'My Profile', icon: 'person-outline', route: '/(staff)/profile' },
  ];

  const navItems = isAdmin ? adminNavItems : staffNavItems;

  const handleNavigate = (route: string) => {
    router.push(route as any);
    if (isDrawer && onClose) onClose();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
    if (isDrawer && onClose) onClose();
  };

  const renderContent = () => (
    <View style={[styles.container, style]}>
      {/* Sidebar Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>KFA ACADEMY</Text>
            <Text style={styles.brandSubtitle}>Attendance & Management</Text>
          </View>
        </View>

        {isDrawer && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* User Badge */}
      <View style={styles.userBadgeCard}>
        <View style={styles.userAvatar}>
          <Ionicons name={isAdmin ? "shield-checkmark" : "person"} size={18} color={COLORS.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>
            {profile?.full_name || 'User'}
          </Text>
          <Text style={styles.userRoleText}>
            {isAdmin ? '🛡️ System Admin' : '👨‍🏫 Staff Teacher'}
          </Text>
        </View>
      </View>

      {/* Navigation List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeader}>NAVIGATION MENU</Text>

        {navItems.map((item, idx) => {
          const isActive = pathname === item.route || pathname.startsWith(item.route + '/');
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => handleNavigate(item.route)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={item.icon as any}
                size={20}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.navItemText, isActive && styles.navItemTextActive]}>
                {item.title}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Logout Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
          <Text style={styles.logoutText}>Sign Out of Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isDrawer) {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawerContainer}>{renderContent()}</View>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        </View>
      </Modal>
    );
  }

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    width: 280,
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.borderLight,
    height: '100%',
    padding: SPACING.lg,
    justifyContent: 'space-between',
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  drawerContainer: {
    width: 290,
    height: '100%',
    backgroundColor: COLORS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  userBadgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  userRoleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: COLORS.infoLight,
  },
  navItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 12,
    flex: 1,
  },
  navItemTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  footer: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: COLORS.dangerLight,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 10,
  },
});
