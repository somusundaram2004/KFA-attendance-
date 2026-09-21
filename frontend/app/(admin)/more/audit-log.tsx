import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { StatusChip } from '../../../src/components/ui/StatusChip';
import { DatabaseService } from '../../../src/services/database';
import { AttendanceAudit } from '../../../src/types';

export default function AuditLogScreen() {
  const [logs, setLogs] = useState<AttendanceAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await DatabaseService.getAuditLogs();
        setLogs(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.cardHeader}>
              <Text style={styles.studentName}>{item.student_name || 'Student'}</Text>
              <Text style={styles.timestampText}>
                {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={styles.changeRow}>
              {item.previous_status ? (
                <View style={styles.statusDiff}>
                  <StatusChip status={item.previous_status} size="sm" />
                  <Ionicons name="arrow-forward" size={14} color={COLORS.textMuted} style={{ marginHorizontal: 6 }} />
                  <StatusChip status={item.new_status} size="sm" />
                </View>
              ) : (
                <StatusChip status={item.new_status} size="sm" />
              )}
            </View>

            <Text style={styles.reasonText}>
              📝 Reason: {item.reason || 'Attendance record modified'}
            </Text>

            <Text style={styles.userText}>
              👤 Modified by: {item.changed_by_name || 'Staff User'}
            </Text>
          </View>
        )}
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
    padding: SPACING.md,
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
  studentName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  changeRow: {
    marginBottom: 8,
  },
  statusDiff: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reasonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  userText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
