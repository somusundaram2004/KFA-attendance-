import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { DatePicker } from '../../../src/components/ui/DatePicker';
import { Select } from '../../../src/components/ui/Select';
import { Button } from '../../../src/components/ui/Button';
import { DatabaseService } from '../../../src/services/database';
import { ClassSession, Grade, Batch, Student, AttendanceStatus } from '../../../src/types';
import { getTodayISODate, formatDateDDMMYYYY, formatTime12Hour } from '../../../src/utils/date';

export default function MarkAttendanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { sessionId: paramSessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  // Local Attendance State per studentId
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [alreadyRecorded, setAlreadyRecorded] = useState(false);

  useEffect(() => {
    async function load() {
      const gList = await DatabaseService.getGrades();
      const bList = await DatabaseService.getBatches();
      setGrades(gList);
      setBatches(bList);

      if (paramSessionId) {
        const sessions = await DatabaseService.getClassSessions();
        const found = sessions.find(s => s.id === paramSessionId);
        if (found) {
          setActiveSession(found);
          setSelectedDate(found.session_date);
          if (found.grade_id) setSelectedGradeId(found.grade_id);
          if (found.batch_id) setSelectedBatchId(found.batch_id);
        }
      } else {
        if (gList.length > 0) setSelectedGradeId(gList[0].id);
        if (bList.length > 0) setSelectedBatchId(bList[0].id);
      }
    }
    load();
  }, [paramSessionId]);

  // Sync session & filtered students
  useEffect(() => {
    async function syncSessionAndStudents() {
      const sessions = await DatabaseService.getClassSessions({
        date: selectedDate,
        batchId: selectedBatchId || undefined,
        gradeId: selectedGradeId || undefined,
      });

      if (sessions.length > 0) {
        setActiveSession(sessions[0]);
      } else {
        setActiveSession(null);
      }

      // Fetch matching active students
      const sList = await DatabaseService.getStudents({
        gradeId: selectedGradeId || undefined,
        batchId: selectedBatchId || undefined,
      });
      setStudents(sList);

      // Check existing attendance for duplicate detection
      if (sessions.length > 0) {
        const existingRecords = await DatabaseService.getAttendanceForSession(sessions[0].id);
        if (existingRecords.length > 0) {
          setAlreadyRecorded(true);
          const initialMap: Record<string, AttendanceStatus> = {};
          existingRecords.forEach(r => {
            initialMap[r.student_id] = r.status;
          });
          setAttendanceMap(initialMap);
        } else {
          setAlreadyRecorded(false);
          // Default all to PRESENT
          const defaultMap: Record<string, AttendanceStatus> = {};
          sList.forEach(s => {
            defaultMap[s.id] = 'PRESENT';
          });
          setAttendanceMap(defaultMap);
        }
      }
    }
    syncSessionAndStudents();
  }, [selectedDate, selectedGradeId, selectedBatchId]);

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      newMap[s.id] = 'PRESENT';
    });
    setAttendanceMap(newMap);
  };

  const handleReset = () => {
    setAttendanceMap({});
  };

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const counts = {
    present: Object.values(attendanceMap).filter(s => s === 'PRESENT').length,
    absent: Object.values(attendanceMap).filter(s => s === 'ABSENT').length,
    leave: Object.values(attendanceMap).filter(s => s === 'LEAVE').length,
    late: Object.values(attendanceMap).filter(s => s === 'LATE').length,
  };

  const handleSaveAttendance = async () => {
    if (!activeSession) {
      Alert.alert('No Class Session', 'There is no scheduled class session for the selected criteria.');
      return;
    }

    const payload = students.map(s => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'PRESENT',
    }));

    try {
      setSaving(true);
      await DatabaseService.saveAttendance(activeSession.id, payload, user?.id || 'u-admin-001');
      setSaving(false);

      Alert.alert(
        '✓ Attendance Saved',
        `Attendance recorded for ${students.length} students.\nPresent: ${counts.present} | Absent: ${counts.absent} | Leave: ${counts.leave} | Late: ${counts.late}`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to save attendance.');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Selection Filters */}
        <View style={[styles.filterCard, SHADOWS.sm]}>
          <DatePicker
            label="Class Date *"
            value={selectedDate}
            onChange={setSelectedDate}
          />

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <Select
                label="Grade *"
                value={selectedGradeId}
                options={grades.map(g => ({ label: g.name, value: g.id }))}
                onSelect={setSelectedGradeId}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Select
                label="Batch *"
                value={selectedBatchId}
                options={batches.map(b => ({ label: b.name, value: b.id }))}
                onSelect={setSelectedBatchId}
              />
            </View>
          </View>
        </View>

        {/* Read-Only Notice for Admin */}
        <View style={styles.alreadyBanner}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
          <Text style={styles.alreadyText}>
            Read-Only Attendance Logs: Admin can view attendance details, but cannot modify records. Attendance entry is reserved for assigned Staff.
          </Text>
        </View>

        {/* Action Header Row */}
        <View style={styles.actionHeaderRow}>
          <Text style={styles.studentHeaderTitle}>
            Session Student List ({students.length})
          </Text>
        </View>

        {/* Student Attendance List (Read Only) */}
        {students.length === 0 ? (
          <View style={styles.noStudentBox}>
            <Text style={styles.noStudentText}>No active students found for Grade + Batch filter.</Text>
          </View>
        ) : (
          students.map(st => {
            const currentStatus = attendanceMap[st.id] || 'PRESENT';
            const statusConfig = {
              PRESENT: { label: '✓ Present', bg: '#DCFCE7', text: '#15803D' },
              ABSENT: { label: '✕ Absent', bg: '#FEE2E2', text: '#B91C1C' },
              LEAVE: { label: 'L Leave', bg: '#FEF3C7', text: '#B45309' },
              LATE: { label: '⏱ Late', bg: '#F3E8FF', text: '#6D28D9' },
            }[currentStatus] || { label: '✓ Present', bg: '#DCFCE7', text: '#15803D' };

            return (
              <View key={st.id} style={[styles.studentRow, SHADOWS.sm]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stName}>{st.full_name}</Text>
                  <Text style={styles.stCode}>ID: {st.student_id}</Text>
                </View>

                {/* Read-Only Status Chip */}
                <View style={{ backgroundColor: statusConfig.bg, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: statusConfig.text }}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* Attendance Summary Counts Card */}
        {students.length > 0 && (
          <View style={[styles.submitCard, SHADOWS.md]}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 8, textAlign: 'center' }}>
              Attendance Summary
            </Text>
            <View style={styles.summaryCountsRow}>
              <Text style={[styles.countItem, { color: COLORS.success }]}>Pres: {counts.present}</Text>
              <Text style={[styles.countItem, { color: COLORS.danger }]}>Abs: {counts.absent}</Text>
              <Text style={[styles.countItem, { color: COLORS.warning }]}>Leave: {counts.leave}</Text>
              <Text style={[styles.countItem, { color: '#7C3AED' }]}>Late: {counts.late}</Text>
            </View>
          </View>
        )}
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
    paddingBottom: 130,
  },
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  alreadyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: SPACING.md,
  },
  alreadyText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 8,
    flex: 1,
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  studentHeaderTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  noStudentBox: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noStudentText: {
    ...TYPOGRAPHY.caption,
  },
  studentRow: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  studentInfo: {
    marginBottom: 8,
  },
  stName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  stCode: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
  },
  statusBtnPresent: { backgroundColor: COLORS.success },
  statusBtnAbsent: { backgroundColor: COLORS.danger },
  statusBtnLeave: { backgroundColor: COLORS.warning },
  statusBtnLate: { backgroundColor: '#7C3AED' },
  statusBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  statusBtnTextActive: { color: '#FFFFFF' },
  submitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  summaryCountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  countItem: {
    fontSize: 13,
    fontWeight: '800',
  },
});
