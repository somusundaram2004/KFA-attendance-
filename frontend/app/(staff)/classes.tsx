import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { StatusChip } from '../../src/components/ui/StatusChip';
import { Button } from '../../src/components/ui/Button';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DatabaseService } from '../../src/services/database';
import { ClassSession } from '../../src/types';
import { formatTime12Hour, formatDateDDMMYYYY } from '../../src/utils/date';

export default function StaffClassesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const bList = await DatabaseService.getBatches(user?.id || 'u-staff-001');
        const assignedBatchIds = new Set(bList.map(b => b.id));
        const allSessions = await DatabaseService.getClassSessions();
        const staffSessions = allSessions.filter(s => assignedBatchIds.has(s.batch_id));
        setClasses(staffSessions);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>📅 {formatDateDDMMYYYY(item.session_date)}</Text>
              <StatusChip status={item.status} size="sm" />
            </View>

            <Text style={styles.batchTitle}>{item.batch_name || 'Assigned Batch'}</Text>
            <Text style={styles.timeText}>
              ⏰ {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
            </Text>

            <View style={styles.footerRow}>
              <Button
                title={item.status === 'COMPLETED' ? 'View Attendance' : 'Mark Attendance'}
                onPress={() => router.push({ pathname: '/(staff)/attendance', params: { sessionId: item.id } })}
                variant={item.status === 'COMPLETED' ? 'outline' : 'primary'}
                size="sm"
              />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Assigned Classes Found"
            message="No class sessions exist for your assigned batches."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  batchTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
});
