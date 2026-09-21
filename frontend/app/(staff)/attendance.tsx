import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { Button } from '../../src/components/ui/Button';
import { Select } from '../../src/components/ui/Select';
import { DatePicker } from '../../src/components/ui/DatePicker';
import { NetworkStatusBar } from '../../src/components/ui/NetworkStatusBar';
import { StudentObservationModal } from '../../src/components/ui/StudentObservationModal';
import { DatabaseService } from '../../src/services/database';
import { offlineDB, OfflineAttendanceRecord } from '../../src/services/offlineDb';
import { syncManager } from '../../src/services/syncManager';
import { Batch, Student, AttendanceStatus } from '../../src/types';
import { getTodayISODate, formatDateDDMMYYYY } from '../../src/utils/date';
import { useOffline } from '../../src/context/OfflineContext';

export default function StaffAttendanceScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { sessionId: paramSessionId, batchId: paramBatchId } = useLocalSearchParams<{ sessionId?: string; batchId?: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { isOnline, isDataReady, prepareOfflineData } = useOffline();

  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayISODate());

  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Modal Observation state
  const [obsStudent, setObsStudent] = useState<{ id: string; name: string } | null>(null);

  const staffId = user?.id || 'u-staff-001';

  // 1. Load Assigned Batches (from IndexedDB first, fallback online)
  useEffect(() => {
    async function loadBatches() {
      try {
        const cachedStaffData = await offlineDB.getStaffData(staffId);
        if (cachedStaffData && cachedStaffData.assignedBatches.length > 0) {
          setBatches(cachedStaffData.assignedBatches);
          const defaultB = paramBatchId || cachedStaffData.assignedBatches[0].id;
          setSelectedBatchId(defaultB);
        } else {
          const bList = await DatabaseService.getBatches(staffId);
          setBatches(bList);
          if (bList.length > 0) {
            setSelectedBatchId(paramBatchId || bList[0].id);
          }
        }
      } catch (e) {
        console.error('Error loading batches:', e);
      }
    }
    loadBatches();
  }, [staffId, paramBatchId]);

  // 2. Load Students & Attendance Records for Selected Batch + Date (IndexedDB First)
  useEffect(() => {
    if (!selectedBatchId) return;

    async function loadAttendanceData() {
      setLoading(true);
      try {
        // A. Load Students (IndexedDB first)
        let sList: Student[] = [];
        const cachedStaffData = await offlineDB.getStaffData(staffId);
        if (cachedStaffData && cachedStaffData.assignedStudents.length > 0) {
          sList = cachedStaffData.assignedStudents.filter(s => s.current_batch_id === selectedBatchId);
        }

        if (sList.length === 0) {
          sList = await DatabaseService.getStudents({ batchId: selectedBatchId });
        }
        setStudents(sList);

        // B. Load Attendance Records (IndexedDB first)
        const localRecords: OfflineAttendanceRecord[] = await offlineDB.getAttendanceForBatchAndDate(selectedBatchId, selectedDate);
        
        let existingRecords = localRecords;
        if (existingRecords.length === 0 && isOnline) {
          // Fallback check from DatabaseService when online
          const sessions = await DatabaseService.getClassSessions({ date: selectedDate });
          const currentSession = sessions.find(s => s.batch_id === selectedBatchId);
          if (currentSession) {
            const dbRecords = await DatabaseService.getAttendanceForSession(currentSession.id);
            existingRecords = dbRecords.map(r => ({
              id: r.id,
              student_id: r.student_id,
              batch_id: selectedBatchId,
              attendance_date: selectedDate,
              status: r.status,
              staff_id: staffId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              sync_status: 'SYNCED',
              operation_id: `synced-${r.id}`,
            }));
          }
        }

        const map: Record<string, AttendanceStatus> = {};

        // CRITICAL RULE: If attendance exists, load existing. If NO existing record, DEFAULT STATUS = ABSENT!
        if (existingRecords.length > 0) {
          existingRecords.forEach(r => {
            map[r.student_id] = r.status;
          });
          // For any new student in batch with no record yet, set default to ABSENT
          sList.forEach(s => {
            if (!map[s.id]) {
              map[s.id] = 'ABSENT';
            }
          });
        } else {
          // NO existing records -> DEFAULT ALL STUDENTS TO ABSENT
          sList.forEach(s => {
            map[s.id] = 'ABSENT';
          });
        }

        setAttendanceMap(map);
      } catch (e) {
        console.error('Error loading attendance data:', e);
      } finally {
        setLoading(false);
      }
    }

    loadAttendanceData();
  }, [selectedBatchId, selectedDate, staffId, isOnline]);

  const handleSetStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const newMap: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      newMap[s.id] = 'PRESENT';
    });
    setAttendanceMap(newMap);
  };

  const handleSaveAttendance = async () => {
    if (!selectedBatchId) {
      Alert.alert('Error', 'Please select a batch.');
      return;
    }

    const currentBatch = batches.find(b => b.id === selectedBatchId);
    const batchName = currentBatch ? currentBatch.name : 'Selected Batch';

    const recordsPayload = students.map(s => ({
      student_id: s.id,
      status: attendanceMap[s.id] || 'ABSENT',
    }));

    try {
      setSaving(true);
      const res = await syncManager.saveAttendance(
        selectedBatchId,
        batchName,
        selectedDate,
        recordsPayload,
        staffId
      );
      setSaving(false);

      if (res.offline) {
        Alert.alert(
          'Saved Offline 🟠',
          'Attendance saved locally to device. It will automatically sync when internet connection returns.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          '✓ Attendance Saved 🟢',
          'Attendance successfully updated and synchronized.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to save attendance.');
    }
  };

  const selectedBatch = batches.find(b => b.id === selectedBatchId);

  return (
    <View style={styles.container}>
      <NetworkStatusBar />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sync Readiness Banner */}
        {!isDataReady && (
          <View style={styles.notReadyBanner}>
            <Ionicons name="warning-outline" size={20} color="#B45309" />
            <Text style={styles.notReadyText}>
              Offline attendance data is not ready. Please connect to the internet once to synchronize your assigned students.
            </Text>
            {isOnline && (
              <Button
                title="Prepare Offline Data Now"
                onPress={() => prepareOfflineData(staffId)}
                size="sm"
                variant="accent"
                style={{ marginTop: 6 }}
              />
            )}
          </View>
        )}

        {/* Selection Card Header */}
        <View style={[styles.headerCard, SHADOWS.sm]}>
          <Text style={styles.cardHeaderTitle}>Staff Attendance Entry</Text>
          
          <Select
            label="Select Batch *"
            value={selectedBatchId}
            options={batches.map(b => ({ label: b.name, value: b.id }))}
            onSelect={setSelectedBatchId}
          />

          <DatePicker
            label="Attendance Date *"
            value={selectedDate}
            onChange={setSelectedDate}
          />
        </View>

        {/* Action Header */}
        <View style={styles.actionRow}>
          <View>
            <Text style={styles.stCount}>{selectedBatch?.name || 'Selected Batch'}</Text>
            <Text style={styles.dateSubtitle}>📅 {formatDateDDMMYYYY(selectedDate)} ({students.length} Students)</Text>
          </View>
          <Button title="Mark All Present" onPress={handleMarkAllPresent} size="sm" variant="outline" />
        </View>

        {/* Default Status Info Alert */}
        <View style={styles.infoAlert}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoAlertText}>
            Default status is ABSENT. Existing saved attendance records are preserved automatically.
          </Text>
        </View>

        {/* Student Attendance Cards */}
        {loading ? (
          <Text style={styles.loadingText}>Loading offline student list...</Text>
        ) : students.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={36} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No students enrolled in this batch.</Text>
          </View>
        ) : (
          students.map(st => {
            const status = attendanceMap[st.id] || 'ABSENT';

            return (
              <View key={st.id} style={[styles.stCard, SHADOWS.sm]}>
                <View style={styles.stCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stName}>{st.full_name}</Text>
                    <Text style={styles.stCode}>ID: {st.student_id}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.obsButton}
                    onPress={() => setObsStudent({ id: st.id, name: st.full_name })}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="document-text-outline" size={14} color={COLORS.primary} />
                    <Text style={styles.obsBtnText}>+ Note / Complaint</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.btnGroup}>
                  <TouchableOpacity
                    style={[styles.btn, status === 'PRESENT' && styles.btnPres]}
                    onPress={() => handleSetStatus(st.id, 'PRESENT')}
                  >
                    <Text style={[styles.btnTxt, status === 'PRESENT' && styles.btnTxtActive]}>✓ Pres</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, status === 'ABSENT' && styles.btnAbs]}
                    onPress={() => handleSetStatus(st.id, 'ABSENT')}
                  >
                    <Text style={[styles.btnTxt, status === 'ABSENT' && styles.btnTxtActive]}>✕ Abs</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, status === 'LATE' && styles.btnLate]}
                    onPress={() => handleSetStatus(st.id, 'LATE')}
                  >
                    <Text style={[styles.btnTxt, status === 'LATE' && styles.btnTxtActive]}>⏱ Late</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Submit Attendance Action Card */}
        {students.length > 0 && (
          <View style={[styles.submitCard, SHADOWS.md]}>
            <Button
              title={isOnline ? "Submit & Sync Attendance" : "Save Attendance Offline"}
              onPress={handleSaveAttendance}
              loading={saving}
              size="lg"
            />
          </View>
        )}
      </ScrollView>

      {/* Observation Modal */}
      {obsStudent && (
        <StudentObservationModal
          visible={Boolean(obsStudent)}
          onClose={() => setObsStudent(null)}
          studentId={obsStudent.id}
          studentName={obsStudent.name}
          batchId={selectedBatchId}
          batchName={selectedBatch?.name || 'Selected Batch'}
          date={selectedDate}
          staffId={staffId}
        />
      )}
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
    paddingBottom: 110,
  },
  notReadyBanner: {
    backgroundColor: '#FEF3C7',
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  notReadyText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'wrap',
    gap: 8,
  },
  stCount: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  dateSubtitle: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.infoLight,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  infoAlertText: {
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: '600',
    flex: 1,
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    marginVertical: SPACING.lg,
  },
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyText: {
    ...TYPOGRAPHY.caption,
    marginTop: 8,
  },
  stCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  stCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  obsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  obsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  btn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    alignItems: 'center',
  },
  btnPres: { backgroundColor: COLORS.success },
  btnAbs: { backgroundColor: COLORS.danger },
  btnLate: { backgroundColor: '#7C3AED' },
  btnTxt: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  btnTxtActive: { color: '#FFFFFF' },
  submitCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
});
