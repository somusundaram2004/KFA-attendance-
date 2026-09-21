import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Student, AttendanceRecord, ClassSession } from '../../types';

interface AttendanceRegisterProps {
  students: Student[];
  sessions: ClassSession[];
  attendanceRecords: AttendanceRecord[];
}

export const AttendanceRegister: React.FC<AttendanceRegisterProps> = ({
  students,
  sessions,
  attendanceRecords,
}) => {
  const getSymbol = (studentId: string, session: ClassSession) => {
    if (session.status === 'CANCELLED') return { symbol: '*', color: COLORS.danger };

    const record = attendanceRecords.find(
      (a) => a.class_session_id === session.id && a.student_id === studentId
    );

    if (!record) return { symbol: '-', color: COLORS.textMuted };

    switch (record.status) {
      case 'PRESENT':
        return { symbol: '✓', color: COLORS.success };
      case 'ABSENT':
        return { symbol: '✕', color: COLORS.danger };
      case 'LEAVE':
        return { symbol: 'L', color: COLORS.warning };
      case 'LATE':
        return { symbol: '⏱', color: '#7C3AED' };
      default:
        return { symbol: '-', color: COLORS.textMuted };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.legendTitle}>Attendance Legend:</Text>
      <View style={styles.legendRow}>
        <Text style={[styles.legendItem, { color: COLORS.success }]}>✓ Present</Text>
        <Text style={[styles.legendItem, { color: COLORS.danger }]}>✕ Absent</Text>
        <Text style={[styles.legendItem, { color: COLORS.warning }]}>L Leave</Text>
        <Text style={[styles.legendItem, { color: '#7C3AED' }]}>⏱ Late</Text>
        <Text style={[styles.legendItem, { color: COLORS.danger }]}>* Cancelled</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.cell, styles.nameHeaderCell]}>
              <Text style={styles.headerText}>Student</Text>
            </View>
            {sessions.map((s) => (
              <View key={s.id} style={[styles.cell, styles.dateHeaderCell]}>
                <Text style={styles.dateHeaderText}>{s.session_date.slice(5)}</Text>
                <Text style={styles.typeHeaderText}>
                  {s.class_type === 'COMPENSATION' ? 'COMP' : 'REG'}
                </Text>
              </View>
            ))}
          </View>

          {/* Student Rows */}
          {students.map((st) => (
            <View key={st.id} style={styles.dataRow}>
              <View style={[styles.cell, styles.nameCell]}>
                <Text style={styles.nameText} numberOfLines={1}>
                  {st.full_name}
                </Text>
                <Text style={styles.codeText}>{st.student_id}</Text>
              </View>
              {sessions.map((s) => {
                const { symbol, color } = getSymbol(st.id, s);
                return (
                  <View key={s.id} style={[styles.cell, styles.symbolCell]}>
                    <Text style={[styles.symbolText, { color }]}>{symbol}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  legendTitle: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  legendItem: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameHeaderCell: {
    width: 140,
    alignItems: 'flex-start',
  },
  dateHeaderCell: {
    width: 54,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  typeHeaderText: {
    fontSize: 9,
    color: COLORS.textSecondary,
  },
  nameCell: {
    width: 140,
    alignItems: 'flex-start',
  },
  nameText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  codeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  symbolCell: {
    width: 54,
  },
  symbolText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
