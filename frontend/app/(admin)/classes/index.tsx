import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { DatePicker } from '../../../src/components/ui/DatePicker';
import { StatusChip } from '../../../src/components/ui/StatusChip';
import { Button } from '../../../src/components/ui/Button';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { DatabaseService } from '../../../src/services/database';
import { ClassSession } from '../../../src/types';
import { getTodayISODate, formatTime12Hour, formatDateDDMMYYYY } from '../../../src/utils/date';

export default function ClassesCalendarScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const list = await DatabaseService.getClassSessions({ date: selectedDate });
      setSessions(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [selectedDate]);

  return (
    <View style={styles.container}>
      {/* Date Header Picker */}
      <View style={styles.topPickerWrapper}>
        <DatePicker
          label="Select Class Date"
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </View>

      {/* Class List */}
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.cardHeader}>
              <View style={styles.badgeRow}>
                <StatusChip status={item.class_type} size="sm" />
                <StatusChip status={item.status} size="sm" style={{ marginLeft: 6 }} />
              </View>

              <Text style={styles.timeText}>
                ⏰ {formatTime12Hour(item.start_time)} - {formatTime12Hour(item.end_time)}
              </Text>
            </View>

            <Text style={styles.batchTitle}>{item.batch_name || 'Batch Session'}</Text>

            {item.class_type === 'COMPENSATION' && item.original_session_date && (
              <View style={styles.compLinkBox}>
                <Ionicons name="link-outline" size={14} color={COLORS.accent} />
                <Text style={styles.compLinkText}>
                  Replacement for cancelled class on {formatDateDDMMYYYY(item.original_session_date)}
                </Text>
              </View>
            )}

            {item.status === 'CANCELLED' && (
              <View style={styles.cancelBox}>
                <Text style={styles.cancelReasonTitle}>Reason for Cancellation:</Text>
                <Text style={styles.cancelReasonText}>{item.cancel_reason || 'Teacher unavailable'}</Text>
              </View>
            )}

            <View style={styles.actionRow}>
              {item.status !== 'CANCELLED' && (
                <Button
                  title={item.status === 'COMPLETED' ? 'View Attendance' : 'Mark Attendance'}
                  onPress={() => router.push({ pathname: '/(admin)/attendance/mark', params: { sessionId: item.id } })}
                  size="sm"
                  variant={item.status === 'COMPLETED' ? 'outline' : 'primary'}
                />
              )}

              {item.status === 'SCHEDULED' && (
                <Button
                  title="Cancel Class"
                  onPress={() => router.push({ pathname: '/(admin)/classes/cancel', params: { sessionId: item.id } })}
                  size="sm"
                  variant="danger"
                />
              )}

              {item.status === 'CANCELLED' && (
                <Button
                  title="+ Assign Compensation"
                  onPress={() => router.push({ pathname: '/(admin)/classes/compensation', params: { originalSessionId: item.id } })}
                  size="sm"
                  variant="accent"
                />
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No Classes Scheduled"
            message={`There are no classes scheduled for ${formatDateDDMMYYYY(selectedDate)}.`}
            iconName="calendar-outline"
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
  topPickerWrapper: {
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
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
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  batchTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 17,
    marginBottom: 6,
  },
  compLinkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  compLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 6,
    flexShrink: 1,
  },
  cancelBox: {
    backgroundColor: COLORS.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelReasonTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.danger,
  },
  cancelReasonText: {
    fontSize: 13,
    color: COLORS.danger,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
});
