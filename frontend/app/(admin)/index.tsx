import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { StatCard } from '../../src/components/ui/StatCard';
import { StatusChip } from '../../src/components/ui/StatusChip';
import { Button } from '../../src/components/ui/Button';
import { DatabaseService } from '../../src/services/database';
import { ClassSession, ReportSummary } from '../../src/types';
import { getFormattedDateHeader, getTodayISODate, formatTime12Hour } from '../../src/utils/date';
import { NotificationEnableCard } from '../../src/components/ui/NotificationEnableCard';

export default function AdminDashboard() {
  const router = useRouter();
  const { profile } = useAuth();

  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const todayStr = getTodayISODate();

  const loadData = async () => {
    try {
      const sum = await DatabaseService.getReportSummary({ date: todayStr });
      setSummary(sum);
      const classes = await DatabaseService.getClassSessions({ date: todayStr });
      setTodaysClasses(classes);
      const notifs = await DatabaseService.getAdminNotifications();
      setNotifications(notifs);
    } catch (e) {
      console.error('Dashboard load error:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Banner */}
      <View style={[styles.welcomeBanner, SHADOWS.md]}>
        <View style={styles.bannerHeader}>
          <Text style={styles.dateLabel}>{getFormattedDateHeader(todayStr)}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>ADMIN PORTAL</Text>
          </View>
        </View>
        <Text style={styles.welcomeTitle}>Welcome back, {profile?.full_name || 'Admin'}</Text>
        <Text style={styles.welcomeSub}>Academy operations summary and class overview for today.</Text>
      </View>

      {/* Web Push Background Notification Card */}
      <NotificationEnableCard />

      {/* Admin Notifications Card */}
      {notifications.length > 0 && (
        <View style={{ marginBottom: SPACING.lg }}>
          <Text style={styles.sectionTitle}>SYNCED STAFF OBSERVATIONS & NOTIFICATIONS ({notifications.length})</Text>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.notifCard, SHADOWS.sm]}>
              <View style={styles.notifHeader}>
                <Ionicons name="notifications-circle" size={24} color={COLORS.primary} />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifDate}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={styles.syncedBadge}>✓ SYNCED</Text>
              </View>
              <Text style={styles.notifMsg}>{n.message}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Today's Key Metrics */}

      {/* Today's Key Metrics */}
      <Text style={styles.sectionTitle}>TODAY'S METRICS</Text>

      <View style={styles.statsGrid}>
        <StatCard
          title="Total Students"
          value={summary?.totalStudents || 0}
          color={COLORS.primary}
          icon={<Ionicons name="people" size={18} color={COLORS.primary} />}
        />
        <StatCard
          title="Present"
          value={summary?.presentCount || 0}
          color={COLORS.success}
          icon={<Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Absent"
          value={summary?.absentCount || 0}
          color={COLORS.danger}
          icon={<Ionicons name="close-circle" size={18} color={COLORS.danger} />}
        />
        <StatCard
          title="Leave"
          value={summary?.leaveCount || 0}
          color={COLORS.warning}
          icon={<Ionicons name="alert-circle" size={18} color={COLORS.warning} />}
        />
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Attendance Rate"
          value={`${summary?.attendancePercentage || 0}%`}
          subtitle="Calculated on completed classes"
          color={COLORS.secondary}
          icon={<Ionicons name="stats-chart" size={18} color={COLORS.secondary} />}
        />
        <StatCard
          title="Cancelled / Comp"
          value={`${summary?.cancelledClasses || 0} / ${summary?.compensationAssigned || 0}`}
          subtitle="Classes affected"
          color={COLORS.accent}
          icon={<Ionicons name="swap-horizontal" size={18} color={COLORS.accent} />}
        />
      </View>

      {/* Today's Classes */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>TODAY'S CLASSES ({todaysClasses.length})</Text>
        <TouchableOpacity onPress={() => router.push('/(admin)/classes')}>
          <Text style={styles.viewAllText}>View All Schedules →</Text>
        </TouchableOpacity>
      </View>

      {todaysClasses.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="calendar-clear-outline" size={36} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No classes scheduled for today.</Text>
        </View>
      ) : (
        todaysClasses.map((item) => (
          <View key={item.id} style={[styles.classCard, SHADOWS.sm]}>
            <View style={styles.classCardHeader}>
              <View>
                <Text style={styles.className}>{item.batch_name || 'Batch Session'}</Text>
                <Text style={styles.classTime}>
                  ⏰ {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                </Text>
              </View>
              <StatusChip status={item.status} />
            </View>

            <View style={styles.divider} />

            <View style={styles.classCardFooter}>
              <Text style={styles.studentCount}>
                👥 {item.attendance_count?.total || 18} Students Enrolled
              </Text>
              <Button
                title={item.status === 'COMPLETED' ? 'View Attendance' : 'Mark Attendance'}
                onPress={() => router.push({ pathname: '/(admin)/attendance/mark', params: { sessionId: item.id } })}
                variant={item.status === 'COMPLETED' ? 'outline' : 'primary'}
                size="sm"
              />
            </View>
          </View>
        ))
      )}
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
  welcomeBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentLight,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  welcomeSub: {
    fontSize: 13,
    color: '#DBEAFE',
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    marginTop: 8,
  },
  classCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  className: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  classTime: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  classCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentCount: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  notifCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  notifDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  syncedBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notifMsg: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
});
