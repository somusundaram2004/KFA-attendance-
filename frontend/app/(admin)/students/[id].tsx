import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { StatCard } from '../../../src/components/ui/StatCard';
import { StatusChip } from '../../../src/components/ui/StatusChip';
import { Button } from '../../../src/components/ui/Button';
import { Select } from '../../../src/components/ui/Select';
import { DatabaseService } from '../../../src/services/database';
import { Student, StudentGradeHistory, StudentBatchHistory, Grade } from '../../../src/types';
import { formatDateDDMMYYYY } from '../../../src/utils/date';

export default function StudentProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [gradeHistory, setGradeHistory] = useState<StudentGradeHistory[]>([]);
  const [batchHistory, setBatchHistory] = useState<StudentBatchHistory[]>([]);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);

  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [promoting, setPromoting] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const res = await DatabaseService.getStudentById(id);
    const gList = await DatabaseService.getGrades();
    setStudent(res.student);
    setGradeHistory(res.gradeHistory);
    setBatchHistory(res.batchHistory);
    setAllGrades(gList);
    if (res.student?.current_grade_id) {
      setSelectedGradeId(res.student.current_grade_id);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handlePromoteGrade = async () => {
    if (!id || !selectedGradeId) return;
    setPromoting(true);
    await DatabaseService.updateStudentGrade(id, selectedGradeId);
    await loadData();
    setPromoting(false);
    Alert.alert('Grade Updated', 'Student grade history has been updated.');
  };

  if (!student) {
    return (
      <View style={styles.loadingCenter}>
        <Text>Loading student details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header Profile Card */}
      <View style={[styles.profileCard, SHADOWS.md]}>
        <View style={styles.avatarLarge}>
          <Ionicons name="person" size={48} color={COLORS.primary} />
        </View>

        <Text style={styles.nameText}>{student.full_name}</Text>
        <Text style={styles.idText}>Student Code: {student.student_id}</Text>

        <StatusChip status={student.status} style={{ marginTop: 6 }} />

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Joining Date</Text>
            <Text style={styles.metaValue}>{formatDateDDMMYYYY(student.joining_date)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Phone</Text>
            <Text style={styles.metaValue}>{student.phone || 'N/A'}</Text>
          </View>
        </View>
      </View>

      {/* Attendance Stats */}
      <Text style={styles.sectionTitle}>ATTENDANCE OVERVIEW</Text>
      <View style={styles.statsGrid}>
        <StatCard title="Attendance Rate" value={`${student.attendance_rate || 100}%`} color={COLORS.success} />
        <StatCard title="Current Grade" value={student.current_grade_name || 'N/A'} color={COLORS.primary} />
      </View>

      {/* Promote Grade Management */}
      <View style={[styles.sectionCard, SHADOWS.sm]}>
        <Text style={styles.cardHeaderTitle}>🎓 Promote / Change Grade</Text>
        <Text style={styles.cardSubText}>Historical grade records are preserved automatically.</Text>

        <Select
          label="Select Target Grade"
          value={selectedGradeId}
          options={allGrades.map(g => ({ label: g.name, value: g.id }))}
          onSelect={setSelectedGradeId}
        />

        <Button
          title="Update Student Grade"
          onPress={handlePromoteGrade}
          loading={promoting}
          size="sm"
        />
      </View>

      {/* Grade History Timeline */}
      <Text style={styles.sectionTitle}>GRADE HISTORY TIMELINE</Text>
      <View style={styles.timelineCard}>
        {gradeHistory.length === 0 ? (
          <Text style={styles.emptyTimelineText}>No previous grade records.</Text>
        ) : (
          gradeHistory.map((gh) => (
            <View key={gh.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{gh.grade_name}</Text>
                <Text style={styles.timelineDates}>
                  📅 {formatDateDDMMYYYY(gh.start_date)} - {gh.end_date ? formatDateDDMMYYYY(gh.end_date) : 'Present'}
                </Text>
                {gh.is_current && <Text style={styles.currentBadge}>Current Active Grade</Text>}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Batch History Timeline */}
      <Text style={styles.sectionTitle}>BATCH HISTORY TIMELINE</Text>
      <View style={styles.timelineCard}>
        {batchHistory.length === 0 ? (
          <Text style={styles.emptyTimelineText}>No batch assignment records.</Text>
        ) : (
          batchHistory.map((bh) => (
            <View key={bh.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{bh.batch_name}</Text>
                <Text style={styles.timelineDates}>
                  📅 {formatDateDDMMYYYY(bh.start_date)} - {bh.end_date ? formatDateDDMMYYYY(bh.end_date) : 'Present'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  nameText: {
    ...TYPOGRAPHY.h2,
    marginBottom: 2,
  },
  idText: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  metaItem: {
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
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
    marginBottom: SPACING.xl,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeaderTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: 4,
  },
  cardSubText: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
  timelineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyTimelineText: {
    ...TYPOGRAPHY.caption,
    fontStyle: 'italic',
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginTop: 4,
    marginRight: 12,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  timelineDates: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  currentBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    marginTop: 4,
  },
});
