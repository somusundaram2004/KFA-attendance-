import React, { useState, useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Sidebar } from '../../src/components/ui/Sidebar';
import { MobileBottomBar } from '../../src/components/ui/MobileBottomBar';
import { PageTransition } from '../../src/components/ui/PageTransition';
import { COLORS, SPACING } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';

export default function StaffLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768; // Show permanent left sidebar on tablet/web
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || !role) {
        router.replace('/login');
      }
    }
  }, [user, role, isLoading]);

  if (isLoading || !user || !role) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.rootContainer}>
      {/* 1. Permanent Left Sidebar for Desktop/Web View */}
      {isDesktop && (
        <View style={styles.sidebarColumn}>
          <Sidebar isDrawer={false} />
        </View>
      )}

      {/* 2. Main Content View Area */}
      <View style={styles.mainColumn}>
        {/* Mobile Header with Menu Button (when on small screens) */}
        {!isDesktop && (
          <View style={styles.mobileHeader}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMobileDrawerOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="menu" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.mobileHeaderTitle}>KFA ACADEMY</Text>
              <Text style={styles.mobileHeaderSub}>Staff Portal</Text>
            </View>
          </View>
        )}

        {/* Dynamic Route Content with bottom padding for mobile navigation bar */}
        <View style={[styles.contentArea, !isDesktop && styles.mobileContentPadding]}>
          <PageTransition>
            <Slot />
          </PageTransition>
        </View>
      </View>

      {/* 3. Mobile Navigation Bottom Bar */}
      {!isDesktop && <MobileBottomBar />}

      {/* 4. Mobile Slide-In Left Drawer */}
      {!isDesktop && (
        <Sidebar
          isDrawer
          visible={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: COLORS.background,
  },
  sidebarColumn: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  mainColumn: {
    flex: 1,
    height: '100%',
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  mobileHeader: {
    height: 60,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  menuBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  mobileHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  mobileHeaderSub: {
    fontSize: 10,
    color: '#DBEAFE',
  },
  contentArea: {
    flex: 1,
  },
  mobileContentPadding: {
    paddingBottom: 60, // Clearance for sticky bottom navigation bar
  },
});
