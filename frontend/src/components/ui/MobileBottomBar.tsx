import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useOffline } from '../../context/OfflineContext';
import { COLORS, SPACING, SHADOWS } from '../../constants/theme';

export const MobileBottomBar: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  const pathname = usePathname();
  const { role } = useAuth();
  const { pendingCount } = useOffline();

  if (isDesktop) return null; // Don't render bottom bar on desktop viewports

  const isAdmin = role === 'ADMIN';

  // Role-Specific Navigation Tabs
  const staffTabs = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(staff)' },
    { key: 'attendance', label: 'Attendance', icon: 'checkmark-done-circle-outline', activeIcon: 'checkmark-done-circle', route: '/(staff)/attendance' },
    { key: 'classes', label: 'My Classes', icon: 'calendar-outline', activeIcon: 'calendar', route: '/(staff)/classes' },
    { key: 'reports', label: 'Reports', icon: 'stats-chart-outline', activeIcon: 'stats-chart', route: '/(staff)/reports' },
    { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', route: '/(staff)/profile' },
  ];

  const adminTabs = [
    { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', route: '/(admin)' },
    { key: 'attendance', label: 'Logs', icon: 'checkmark-done-circle-outline', activeIcon: 'checkmark-done-circle', route: '/(admin)/attendance/mark' },
    { key: 'students', label: 'Students', icon: 'people-outline', activeIcon: 'people', route: '/(admin)/students' },
    { key: 'reports', label: 'Reports', icon: 'stats-chart-outline', activeIcon: 'stats-chart', route: '/(admin)/reports' },
    { key: 'more', label: 'More', icon: 'grid-outline', activeIcon: 'grid', route: '/(admin)/more' },
  ];

  const tabs = isAdmin ? adminTabs : staffTabs;

  return (
    <View style={[styles.bottomBar, SHADOWS.lg]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.route || (tab.route !== '/(admin)' && tab.route !== '/(staff)' && pathname.startsWith(tab.route));
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.7}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={(isActive ? tab.activeIcon : tab.icon) as any}
                size={22}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              {tab.key === 'attendance' && pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 4,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
