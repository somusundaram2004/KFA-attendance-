import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { FilterBar } from '../../../src/components/ui/FilterBar';
import { StatCard } from '../../../src/components/ui/StatCard';
import { Button } from '../../../src/components/ui/Button';
import { AttendanceRegister } from '../../../src/components/ui/AttendanceRegister';
import { DatabaseService } from '../../../src/services/database';
import { Grade, Batch, Student, ClassSession, AttendanceRecord, ReportSummary, FilterOptions } from '../../../src/types';
import { formatDateDDMMYYYY, getTodayISODate } from '../../../src/utils/date';

export default function ReportsScreen() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const [filters, setFilters] = useState<FilterOptions>({
    gradeId: '',
    batchId: '',
    searchQuery: '',
  });

  const [viewMode, setViewMode] = useState<'summary' | 'register'>('summary');
  const [exporting, setExporting] = useState(false);

  const loadReportData = async () => {
    try {
      const [gList, bList, sList, sessList, sum] = await Promise.all([
        DatabaseService.getGrades(),
        DatabaseService.getBatches(),
        DatabaseService.getStudents(filters),
        DatabaseService.getClassSessions(filters),
        DatabaseService.getReportSummary(filters),
      ]);
      setGrades(gList);
      setBatches(bList);
      setStudents(sList);
      setSessions(sessList);
      setSummary(sum);

      // Collect attendance records for visual matrix
      let allRecords: AttendanceRecord[] = [];
      for (const s of sessList) {
        const records = await DatabaseService.getAttendanceForSession(s.id);
        allRecords = [...allRecords, ...records];
      }
      setAttendanceRecords(allRecords);
    } catch (e) {
      console.error('Report error:', e);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #0F172A; }
              h1 { color: #1E40AF; border-bottom: 2px solid #1E40AF; padding-bottom: 10px; }
              .summary { background: #F8FAFC; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #CBD5E1; padding: 10px; text-align: left; }
              th { background-color: #1E40AF; color: white; }
            </style>
          </head>
          <body>
            <h1>KFA ACADEMY ATTENDANCE REPORT</h1>
            <div class="summary">
              <p><strong>Generated Date:</strong> ${formatDateDDMMYYYY(getTodayISODate())}</p>
              <p><strong>Total Active Students:</strong> ${summary?.totalStudents || 0}</p>
              <p><strong>Completed Class Sessions:</strong> ${summary?.completedClasses || 0}</p>
              <p><strong>Cancelled Classes:</strong> ${summary?.cancelledClasses || 0}</p>
              <p><strong>Compensation Classes:</strong> ${summary?.compensationAssigned || 0}</p>
              <p><strong>Overall Attendance Rate:</strong> ${summary?.attendancePercentage || 0}%</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Student Code</th>
                  <th>Student Name</th>
                  <th>Grade</th>
                  <th>Batch</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                ${students
                  .map(
                    (s) => `
                  <tr>
                    <td>${s.student_id}</td>
                    <td>${s.full_name}</td>
                    <td>${s.current_grade_name || 'N/A'}</td>
                    <td>${s.current_batch_name || 'N/A'}</td>
                    <td>${s.attendance_rate || 100}%</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      setExporting(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Report PDF Generated', `File saved at: ${uri}`);
      }
    } catch (e: any) {
      setExporting(false);
      Alert.alert('Export Error', e.message || 'Failed to generate PDF');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Filters */}
      <FilterBar
        filters={filters}
        grades={grades}
        batches={batches}
        onFilterChange={setFilters}
        onReset={() => setFilters({ gradeId: '', batchId: '', searchQuery: '' })}
      />

      {/* View Toggle Bar */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'summary' && styles.toggleBtnActive]}
          onPress={() => setViewMode('summary')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'summary' && styles.toggleBtnTextActive]}>
            📊 Summary Stats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleBtn, viewMode === 'register' && styles.toggleBtnActive]}
          onPress={() => setViewMode('register')}
        >
          <Text style={[styles.toggleBtnText, viewMode === 'register' && styles.toggleBtnTextActive]}>
            📅 Visual Register
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      {viewMode === 'summary' ? (
        <>
          <View style={styles.statsGrid}>
            <StatCard title="Total Students" value={summary?.totalStudents || 0} color={COLORS.primary} />
            <StatCard title="Attendance Rate" value={`${summary?.attendancePercentage || 0}%`} color={COLORS.success} />
          </View>

          <View style={styles.statsGrid}>
            <StatCard title="Present Count" value={summary?.presentCount || 0} color={COLORS.success} />
            <StatCard title="Absent Count" value={summary?.absentCount || 0} color={COLORS.danger} />
          </View>

          <View style={styles.statsGrid}>
            <StatCard title="Cancelled Classes" value={summary?.cancelledClasses || 0} subtitle="Excluded from absences" color={COLORS.warning} />
            <StatCard title="Compensation Classes" value={summary?.compensationAssigned || 0} subtitle="Replacement sessions" color={COLORS.accent} />
          </View>

          {/* Export PDF Banner */}
          <View style={[styles.exportCard, SHADOWS.sm]}>
            <Ionicons name="document-text-outline" size={28} color={COLORS.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.exportTitle}>Export Academy Report</Text>
              <Text style={styles.exportSub}>Download structured PDF report for administrative audit.</Text>
            </View>
            <Button
              title="Export PDF"
              onPress={handleExportPDF}
              loading={exporting}
              size="sm"
            />
          </View>
        </>
      ) : (
        <AttendanceRegister
          students={students}
          sessions={sessions}
          attendanceRecords={attendanceRecords}
        />
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
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: 10,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.card,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  toggleBtnTextActive: {
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  exportTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  exportSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
});
