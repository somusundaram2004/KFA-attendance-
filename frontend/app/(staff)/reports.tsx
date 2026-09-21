import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { StatCard } from '../../src/components/ui/StatCard';
import { DatabaseService } from '../../src/services/database';
import { ReportSummary, Batch } from '../../src/types';

export default function StaffReportsScreen() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);

  useEffect(() => {
    async function load() {
      const bList = await DatabaseService.getBatches(user?.id || 'u-staff-001');
      setAssignedBatches(bList);
      const sum = await DatabaseService.getReportSummary();
      setSummary(sum);
    }
    load();
  }, [user]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.sectionTitle}>MY PERMITTED BATCH SUMMARY</Text>

      <View style={styles.statsGrid}>
        <StatCard title="Assigned Batches" value={assignedBatches.length} color={COLORS.primary} />
        <StatCard title="Attendance Rate" value={`${summary?.attendancePercentage || 94}%`} color={COLORS.success} />
      </View>

      <View style={styles.statsGrid}>
        <StatCard title="Present Students" value={summary?.presentCount || 0} color={COLORS.success} />
        <StatCard title="Absent Students" value={summary?.absentCount || 0} color={COLORS.danger} />
      </View>

      <Text style={[styles.sectionTitle, { marginTop: SPACING.md }]}>PERMITTED BATCH LIST</Text>
      {assignedBatches.map(b => (
        <View key={b.id} style={[styles.batchCard, SHADOWS.sm]}>
          <Text style={styles.batchTitle}>{b.name}</Text>
          <Text style={styles.batchSub}>{b.description || 'Schedule: Mon & Wed'}</Text>
        </View>
      ))}
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
  sectionTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  batchCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  batchTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  batchSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
