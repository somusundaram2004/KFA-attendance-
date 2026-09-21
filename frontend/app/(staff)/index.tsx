import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { StatusChip } from '../../src/components/ui/StatusChip';
import { Button } from '../../src/components/ui/Button';
import { NetworkStatusBar } from '../../src/components/ui/NetworkStatusBar';
import { DatabaseService } from '../../src/services/database';
import { ClassSession, Batch } from '../../src/types';
import { getFormattedDateHeader, getTodayISODate, formatTime12Hour } from '../../src/utils/date';
import { useOffline } from '../../src/context/OfflineContext';

export default function StaffDashboard() {
  const router = useRouter();
  const { profile, user } = useAuth();
  const { isOnline, isDataReady, lastSyncedAt, prepareOfflineData } = useOffline();

  const [refreshing, setRefreshing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [todaysClasses, setTodaysClasses] = useState<ClassSession[]>([]);

  const todayStr = getTodayISODate();
  const staffId = user?.id || 'u-staff-001';

  const loadData = async () => {
    try {
      const bList = await DatabaseService.getBatches(staffId);
      setAssignedBatches(bList);
      const classes = await DatabaseService.getClassSessions({ date: todayStr });
      // Filter for staff assigned batches only
      const assignedBatchIds = new Set(bList.map(b => b.id));
      const staffClasses = classes.filter(c => assignedBatchIds.has(c.batch_id));
      setTodaysClasses(staffClasses);
    } catch (e) {
      console.error(e);
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

  const handlePrepareOfflineData = async () => {
    try {
      setPreparing(true);
      await prepareOfflineData(staffId);
      setPreparing(false);
      Alert.alert('✓ Offline Data Synchronized', 'All assigned students, batches, and attendance records are ready for offline usage.');
    } catch (e: any) {
      setPreparing(false);
      Alert.alert('Sync Error', e.message || 'Failed to prepare offline data.');
    }
  };

  return (
    <View style={styles.container}>
      <NetworkStatusBar />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {/* Staff Greeting Banner */}
        <View style={[styles.welcomeCard, SHADOWS.md]}>
          <Text style={styles.dateText}>{getFormattedDateHeader(todayStr)}</Text>
          <Text style={styles.greetingTitle}>
            Good Morning, {profile?.full_name || 'Mrs. Priya Sharma'}
          </Text>
          <Text style={styles.greetingSub}>
            You have {todaysClasses.length} assigned class{todaysClasses.length === 1 ? '' : 'es'} scheduled for today.
          </Text>
        </View>

        {/* Offline Readiness Sync Card */}
        <View style={[styles.offlineSyncCard, SHADOWS.sm]}>
          <View style={styles.offlineCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.offlineCardTitle}>Offline Attendance Status</Text>
              {isDataReady ? (
                <View style={styles.readyRow}>
                  <Text style={styles.readyBadge}>✓ Ready</Text>
                  <Text style={styles.lastSyncedText}>
                    Last synchronized: {lastSyncedAt || 'Just now'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.notReadyStatusText}>
                  ⚠ Offline attendance data is not ready. Please sync assigned students once while online.
                </Text>
              )}
            </View>
          </View>

          <Button
            title={preparing ? "Syncing..." : isDataReady ? "Re-sync Offline Data" : "Prepare Offline Data"}
            onPress={handlePrepareOfflineData}
            loading={preparing}
            disabled={!isOnline}
            variant={isDataReady ? "outline" : "primary"}
            size="sm"
            style={{ marginTop: SPACING.md }}
          />
        </View>

        {/* Today's Assigned Classes */}
        <Text style={styles.sectionTitle}>TODAY'S SCHEDULED CLASSES</Text>

        {todaysClasses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="checkmark-circle-outline" size={40} color={COLORS.success} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySub}>No pending classes scheduled for your assigned batches today.</Text>
          </View>
        ) : (
          todaysClasses.map((item) => (
            <View key={item.id} style={[styles.classCard, SHADOWS.sm]}>
              <View style={styles.classHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.batchTitle}>{item.batch_name || 'Assigned Batch'}</Text>
                  <Text style={styles.timeText}>
                    ⏰ {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
                  </Text>
                </View>
                <StatusChip status={item.status} />
              </View>

              <View style={styles.divider} />

              <View style={styles.classFooter}>
                <Text style={styles.studentInfoText}>👥 18 Students Enrolled</Text>
                <Button
                  title={item.status === 'COMPLETED' ? 'View Attendance' : 'Mark Attendance'}
                  onPress={() => router.push({ pathname: '/(staff)/attendance', params: { sessionId: item.id, batchId: item.batch_id } })}
                  variant={item.status === 'COMPLETED' ? 'outline' : 'primary'}
                  size="sm"
                />
              </View>
            </View>
          ))
        )}

        {/* Assigned Batches List */}
        <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>MY ASSIGNED BATCHES ({assignedBatches.length})</Text>

        {assignedBatches.map((b) => (
          <View key={b.id} style={[styles.batchCard, SHADOWS.sm]}>
            <View style={styles.batchIcon}>
              <Ionicons name="school-outline" size={24} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.batchNameText}>{b.name}</Text>
              <Text style={styles.batchDescText}>{b.description || 'Mon & Wed Schedule'}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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
  welcomeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.accentLight,
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  greetingSub: {
    fontSize: 13,
    color: '#DBEAFE',
  },
  offlineSyncCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  offlineCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineCardTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
    marginBottom: 4,
  },
  readyRow: {
    flexDirection: 'column',
    gap: 2,
  },
  readyBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.success,
  },
  lastSyncedText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  notReadyStatusText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  emptyBox: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: 8,
  },
  emptySub: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginTop: 4,
  },
  classCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
  },
  batchTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  classFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  studentInfoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  batchIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  batchNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  batchDescText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});
