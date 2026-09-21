import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { StatCard } from '../../../src/components/ui/StatCard';
import { Button } from '../../../src/components/ui/Button';
import { DatabaseService } from '../../../src/services/database';
import { Grade, Batch, Student, AttendanceStatus } from '../../../src/types';
import { formatDateDDMMYYYY, getTodayISODate } from '../../../src/utils/date';

type ReportType = 'MONTHLY' | 'ALL_PRESENT' | 'RANGE';

interface StudentReportRow {
  student: Student;
  presentCount: number;
  absentCount: number;
  leaveCount: number;
  lateCount: number;
  totalClasses: number;
  percentage: number;
  isAllPresent: boolean;
}

export default function StudentPdfReportsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const todayStr = getTodayISODate(); // "2026-09-21"

  // Dropdown Lists Data
  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  // Filter States
  const [selectedGradeId, setSelectedGradeId] = useState<string>('ALL');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');
  const [reportType, setReportType] = useState<ReportType>('MONTHLY');
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // "2026-09"
  const [fromDate, setFromDate] = useState<string>(todayStr.slice(0, 7) + '-01');
  const [toDate, setToDate] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // UI & Loading States
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [reportRows, setReportRows] = useState<StudentReportRow[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    totalLeave: 0,
    totalLate: 0,
    averageAttendancePercentage: 100,
  });

  // Load Dropdown Options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [gList, bList] = await Promise.all([
          DatabaseService.getGrades(),
          DatabaseService.getBatches(),
        ]);
        setGrades(gList);
        setBatches(bList);
      } catch (err) {
        console.error('Error loading filter options:', err);
      }
    };
    loadOptions();
  }, []);

  // Calculate Date Range based on Report Type & Selected Month
  const { startDate, endDate } = useMemo(() => {
    if (reportType === 'RANGE') {
      return { startDate: fromDate, endDate: toDate };
    }
    // MONTHLY or ALL_PRESENT
    const [yStr, mStr] = selectedMonth.split('-');
    const year = parseInt(yStr, 10);
    const month = parseInt(mStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    return {
      startDate: `${selectedMonth}-01`,
      endDate: `${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`,
    };
  }, [reportType, selectedMonth, fromDate, toDate]);

  // Load Report Data and Calculate Individual Student Counts
  const loadReportData = async () => {
    setLoading(true);
    try {
      const batchFilter = selectedBatchId === 'ALL' ? undefined : selectedBatchId;
      const matrixData = await DatabaseService.getAttendanceHistoryMatrix(
        batchFilter,
        startDate,
        endDate
      );

      let rows: StudentReportRow[] = matrixData.rows.map((r) => {
        const totalMarked = r.presentCount + r.absentCount + r.leaveCount + r.lateCount;
        const percentage = totalMarked > 0 ? Math.round(((r.presentCount + r.lateCount) / totalMarked) * 100) : 100;
        const isAllPresent = r.absentCount === 0 && r.presentCount > 0;
        return {
          student: r.student,
          presentCount: r.presentCount,
          absentCount: r.absentCount,
          leaveCount: r.leaveCount,
          lateCount: r.lateCount,
          totalClasses: totalMarked,
          percentage,
          isAllPresent,
        };
      });

      // Filter Grade-wise if specific grade selected
      if (selectedGradeId !== 'ALL') {
        rows = rows.filter((r) => r.student.current_grade_id === selectedGradeId);
      }

      // Filter All Present Monthly Report mode if selected
      if (reportType === 'ALL_PRESENT') {
        rows = rows.filter((r) => r.isAllPresent || r.percentage === 100);
      }

      // Apply Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        rows = rows.filter(
          (r) =>
            r.student.full_name.toLowerCase().includes(q) ||
            r.student.student_id.toLowerCase().includes(q)
        );
      }

      // Compute Group Summary Counts
      let totPresent = 0;
      let totAbsent = 0;
      let totLeave = 0;
      let totLate = 0;

      rows.forEach((r) => {
        totPresent += r.presentCount;
        totAbsent += r.absentCount;
        totLeave += r.leaveCount;
        totLate += r.lateCount;
      });

      const grandTotal = totPresent + totAbsent + totLeave + totLate;
      const avgRate = grandTotal > 0 ? Math.round(((totPresent + totLate) / grandTotal) * 100) : 100;

      setReportRows(rows);
      setSummaryMetrics({
        totalStudents: rows.length,
        totalPresent: totPresent,
        totalAbsent: totAbsent,
        totalLeave: totLeave,
        totalLate: totLate,
        averageAttendancePercentage: avgRate,
      });
    } catch (err) {
      console.error('Error generating student report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [selectedGradeId, selectedBatchId, reportType, selectedMonth, startDate, endDate, searchQuery]);

  // Generate Styled Print-Ready PDF
  const handleDownloadPDF = async () => {
    try {
      if (reportRows.length === 0) {
        Alert.alert('Empty Report', 'No student records match the current filter selection.');
        return;
      }

      setExporting(true);

      const gradeName = selectedGradeId === 'ALL' ? 'All Grades' : grades.find((g) => g.id === selectedGradeId)?.name || 'Selected Grade';
      const batchName = selectedBatchId === 'ALL' ? 'All Batches' : batches.find((b) => b.id === selectedBatchId)?.name || 'Selected Batch';
      const reportTypeName = reportType === 'MONTHLY' ? `Monthly Report (${selectedMonth})` : reportType === 'ALL_PRESENT' ? `All Present Monthly Report (${selectedMonth})` : `Date Range Report (${startDate} to ${endDate})`;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>KFA Academy - Student Attendance PDF Report</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 24px;
                color: #0F172A;
                background-color: #FFFFFF;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #1E40AF;
                padding-bottom: 14px;
                margin-bottom: 20px;
              }
              .brand-title {
                font-size: 24px;
                font-weight: 800;
                color: #1E40AF;
                margin: 0;
                letter-spacing: 1px;
              }
              .brand-subtitle {
                font-size: 12px;
                color: #475569;
                margin-top: 4px;
              }
              .report-badge {
                background-color: #EFF6FF;
                border: 1px solid #BFDBFE;
                color: #1E40AF;
                padding: 6px 14px;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 700;
              }
              .meta-box {
                background-color: #F8FAFC;
                border: 1px solid #E2E8F0;
                border-radius: 8px;
                padding: 14px 18px;
                margin-bottom: 20px;
                display: flex;
                flex-wrap: wrap;
                gap: 20px;
              }
              .meta-item {
                flex: 1;
                min-width: 140px;
              }
              .meta-label {
                font-size: 10px;
                font-weight: 700;
                color: #94A3B8;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .meta-value {
                font-size: 14px;
                font-weight: 700;
                color: #0F172A;
                margin-top: 2px;
              }
              .summary-cards {
                display: flex;
                gap: 12px;
                margin-bottom: 24px;
              }
              .card {
                flex: 1;
                padding: 12px 14px;
                border-radius: 8px;
                border: 1px solid #CBD5E1;
                text-align: center;
              }
              .card-title {
                font-size: 10px;
                font-weight: 700;
                text-transform: uppercase;
                color: #475569;
              }
              .card-val {
                font-size: 20px;
                font-weight: 800;
                margin-top: 4px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                margin-top: 10px;
              }
              th {
                background-color: #1E40AF;
                color: #FFFFFF;
                font-weight: 700;
                text-align: left;
                padding: 10px 12px;
                font-size: 11px;
                text-transform: uppercase;
              }
              td {
                border-bottom: 1px solid #E2E8F0;
                padding: 10px 12px;
                color: #0F172A;
              }
              tr:nth-child(even) {
                background-color: #F8FAFC;
              }
              .badge-present {
                color: #059669;
                font-weight: 700;
              }
              .badge-absent {
                color: #DC2626;
                font-weight: 700;
              }
              .badge-allpresent {
                background-color: #ECFDF5;
                color: #059669;
                border: 1px solid #A7F3D0;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 800;
                font-size: 10px;
              }
              .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #E2E8F0;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
              }
              .sig-box {
                text-align: center;
                width: 200px;
              }
              .sig-line {
                border-bottom: 1px solid #94A3B8;
                margin-bottom: 6px;
                height: 35px;
              }
              .sig-title {
                font-size: 11px;
                font-weight: 700;
                color: #475569;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="brand-title">KFA ACADEMY</h1>
                <div class="brand-subtitle">STUDENT ATTENDANCE & PERFORMANCE PDF REPORT</div>
              </div>
              <div class="report-badge">${reportTypeName}</div>
            </div>

            <div class="meta-box">
              <div class="meta-item">
                <div class="meta-label">Selected Grade</div>
                <div class="meta-value">${gradeName}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Selected Batch</div>
                <div class="meta-value">${batchName}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Date Period</div>
                <div class="meta-value">${startDate} to ${endDate}</div>
              </div>
              <div class="meta-item">
                <div class="meta-label">Generated Date</div>
                <div class="meta-value">${formatDateDDMMYYYY(todayStr)}</div>
              </div>
            </div>

            <div class="summary-cards">
              <div class="card" style="background-color: #EFF6FF; border-color: #BFDBFE;">
                <div class="card-title">Total Students</div>
                <div class="card-val" style="color: #1E40AF;">${summaryMetrics.totalStudents}</div>
              </div>
              <div class="card" style="background-color: #ECFDF5; border-color: #A7F3D0;">
                <div class="card-title">Present Count</div>
                <div class="card-val" style="color: #059669;">${summaryMetrics.totalPresent}</div>
              </div>
              <div class="card" style="background-color: #FEF2F2; border-color: #FECACA;">
                <div class="card-title">Absent Count</div>
                <div class="card-val" style="color: #DC2626;">${summaryMetrics.totalAbsent}</div>
              </div>
              <div class="card" style="background-color: #FFFBEB; border-color: #FDE68A;">
                <div class="card-title">Group Rate %</div>
                <div class="card-val" style="color: #D97706;">${summaryMetrics.averageAttendancePercentage}%</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Student Code</th>
                  <th>Student Name</th>
                  <th>Grade</th>
                  <th>Batch</th>
                  <th style="text-align: center;">Present</th>
                  <th style="text-align: center;">Absent</th>
                  <th style="text-align: center;">Leave</th>
                  <th style="text-align: center;">Late</th>
                  <th style="text-align: center;">Rate %</th>
                  <th style="text-align: center;">Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows
                  .map(
                    (r, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${r.student.student_id}</strong></td>
                    <td><strong>${r.student.full_name}</strong></td>
                    <td>${r.student.current_grade_name || 'Grade'}</td>
                    <td>${r.student.current_batch_name || 'Batch'}</td>
                    <td style="text-align: center;" class="badge-present">${r.presentCount}</td>
                    <td style="text-align: center;" class="badge-absent">${r.absentCount}</td>
                    <td style="text-align: center;">${r.leaveCount}</td>
                    <td style="text-align: center;">${r.lateCount}</td>
                    <td style="text-align: center; font-weight: 700;">${r.percentage}%</td>
                    <td style="text-align: center;">
                      ${r.isAllPresent ? '<span class="badge-allpresent">✓ ALL PRESENT</span>' : r.percentage >= 90 ? '<span style="color:#059669; font-weight:700;">GOOD</span>' : '<span style="color:#DC2626; font-weight:700;">NEEDS ATTN</span>'}
                    </td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>

            <div class="footer">
              <div>
                <div style="font-size: 10px; color: #94A3B8;">KFA Academy Management System</div>
                <div style="font-size: 10px; color: #94A3B8;">Confidential Student Report • Generated automatically</div>
              </div>
              <div style="display: flex; gap: 30px;">
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-title">Class Staff Teacher</div>
                </div>
                <div class="sig-box">
                  <div class="sig-line"></div>
                  <div class="sig-title">Academy Principal</div>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      setExporting(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('PDF Report Ready', `PDF Generated successfully at: ${uri}`);
      }
    } catch (err: any) {
      setExporting(false);
      console.error('PDF Export Error:', err);
      Alert.alert('Export Error', err.message || 'Failed to generate PDF report.');
    }
  };

  return (
    <View style={styles.pageContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Banner Header */}
        <View style={[styles.headerCard, SHADOWS.md]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="document-text" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Student PDF Reports & Counts</Text>
              <Text style={styles.headerSubtitle}>
                Filter Grade-wise, Batch-wise, or Monthly All-Present reports and export PDF.
              </Text>
            </View>
          </View>

          <Button
            title="Download PDF Report"
            onPress={handleDownloadPDF}
            loading={exporting}
            size="md"
            icon={<Ionicons name="download-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />}
          />
        </View>

        {/* Filter Controls Card */}
        <View style={[styles.filterCard, SHADOWS.sm]}>
          
          {/* Top Row: Report Type Selector */}
          <View style={styles.modeSwitcherRow}>
            <Text style={styles.filterLabel}>REPORT TYPE MODE:</Text>
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTabBtn, reportType === 'MONTHLY' && styles.modeTabBtnActive]}
                onPress={() => setReportType('MONTHLY')}
              >
                <Ionicons name="calendar-outline" size={16} color={reportType === 'MONTHLY' ? '#FFFFFF' : COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.modeTabText, reportType === 'MONTHLY' && styles.modeTabTextActive]}>Monthly Report</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, reportType === 'ALL_PRESENT' && styles.modeTabBtnActive]}
                onPress={() => setReportType('ALL_PRESENT')}
              >
                <Ionicons name="ribbon-outline" size={16} color={reportType === 'ALL_PRESENT' ? '#FFFFFF' : COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.modeTabText, reportType === 'ALL_PRESENT' && styles.modeTabTextActive]}>All Present Monthly</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, reportType === 'RANGE' && styles.modeTabBtnActive]}
                onPress={() => setReportType('RANGE')}
              >
                <Ionicons name="options-outline" size={16} color={reportType === 'RANGE' ? '#FFFFFF' : COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.modeTabText, reportType === 'RANGE' && styles.modeTabTextActive]}>Date Range</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Controls Row: Grade, Batch, Month/Date */}
          <View style={styles.controlsRow}>
            
            {/* Grade Filter */}
            <View style={styles.controlGroup}>
              <Text style={styles.inputLabel}>GRADE FILTER:</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  const ids = ['ALL', ...grades.map((g) => g.id)];
                  const curIdx = ids.indexOf(selectedGradeId);
                  setSelectedGradeId(ids[(curIdx + 1) % ids.length]);
                }}
              >
                <Ionicons name="school-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.selectBtnText} numberOfLines={1}>
                  {selectedGradeId === 'ALL' ? 'All Grades' : grades.find((g) => g.id === selectedGradeId)?.name || 'Grade'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Batch Filter */}
            <View style={styles.controlGroup}>
              <Text style={styles.inputLabel}>BATCH FILTER:</Text>
              <TouchableOpacity
                style={styles.selectBtn}
                onPress={() => {
                  const ids = ['ALL', ...batches.map((b) => b.id)];
                  const curIdx = ids.indexOf(selectedBatchId);
                  setSelectedBatchId(ids[(curIdx + 1) % ids.length]);
                }}
              >
                <Ionicons name="shapes-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.selectBtnText} numberOfLines={1}>
                  {selectedBatchId === 'ALL' ? 'All Batches' : batches.find((b) => b.id === selectedBatchId)?.name || 'Batch'}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Month / Date Range Controls */}
            {reportType !== 'RANGE' ? (
              <View style={styles.controlGroup}>
                <Text style={styles.inputLabel}>SELECT MONTH (YYYY-MM):</Text>
                <TextInput
                  style={styles.dateInput}
                  value={selectedMonth}
                  onChangeText={setSelectedMonth}
                  placeholder="YYYY-MM"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            ) : (
              <View style={styles.rangeInputsRow}>
                <View style={[styles.controlGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>FROM DATE:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={fromDate}
                    onChangeText={setFromDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
                <View style={[styles.controlGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>TO DATE:</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={toDate}
                    onChangeText={setToDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={COLORS.textMuted}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Student Search Bar */}
          <View style={styles.searchRow}>
            <Ionicons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by Student Name or Code (e.g. Arun or KFA-2026-001)..."
              placeholderTextColor={COLORS.textMuted}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Group Summary Metric Cards (Including Each Count) */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Students"
            value={summaryMetrics.totalStudents}
            color={COLORS.primary}
            icon={<Ionicons name="people" size={18} color={COLORS.primary} />}
          />
          <StatCard
            title="Total Present Count"
            value={summaryMetrics.totalPresent}
            color={COLORS.success}
            icon={<Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
          />
          <StatCard
            title="Total Absent Count"
            value={summaryMetrics.totalAbsent}
            color={COLORS.danger}
            icon={<Ionicons name="close-circle" size={18} color={COLORS.danger} />}
          />
          <StatCard
            title="Group Attendance %"
            value={`${summaryMetrics.averageAttendancePercentage}%`}
            color={COLORS.secondary}
            icon={<Ionicons name="stats-chart" size={18} color={COLORS.secondary} />}
          />
        </View>

        {/* Student Table with Individual Counts */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading student attendance report...</Text>
          </View>
        ) : reportRows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={44} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Matching Students Found</Text>
            <Text style={styles.emptySub}>Try adjusting your Grade, Batch, or Search filter.</Text>
          </View>
        ) : (
          <View style={[styles.tableCard, SHADOWS.sm]}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.tableTitle}>Student Directory & Attendance Counts ({reportRows.length})</Text>
              <Text style={styles.periodText}>{startDate} to {endDate}</Text>
            </View>

            {/* Responsive Table Container */}
            <View style={styles.tableWrapper}>
              {typeof document !== 'undefined' ? (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ padding: '12px 14px', textAlign: 'left', color: COLORS.textSecondary, fontWeight: '700' }}>Student Details</th>
                        <th style={{ padding: '12px 10px', textAlign: 'left', color: COLORS.textSecondary, fontWeight: '700' }}>Grade & Batch</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', color: COLORS.success, fontWeight: '700' }}>Present</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', color: COLORS.danger, fontWeight: '700' }}>Absent</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', color: COLORS.warning, fontWeight: '700' }}>Leave</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', color: COLORS.late, fontWeight: '700' }}>Late</th>
                        <th style={{ padding: '12px 10px', textAlign: 'center', color: COLORS.primary, fontWeight: '700' }}>Rate %</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', color: COLORS.textSecondary, fontWeight: '700' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportRows.map((r) => (
                        <tr key={r.student.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ fontWeight: '700', color: COLORS.text }}>{r.student.full_name}</div>
                            <div style={{ fontSize: '11px', color: COLORS.textMuted }}>{r.student.student_id}</div>
                          </td>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: '600', fontSize: '12px' }}>{r.student.current_grade_name || 'Grade'}</div>
                            <div style={{ fontSize: '11px', color: COLORS.textSecondary }}>{r.student.current_batch_name || 'Batch'}</div>
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', color: COLORS.success }}>
                            {r.presentCount}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', color: COLORS.danger }}>
                            {r.absentCount}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '600' }}>
                            {r.leaveCount}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '600' }}>
                            {r.lateCount}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'center', fontWeight: '800', fontSize: '14px', color: COLORS.primary }}>
                            {r.percentage}%
                          </td>
                          <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                            {r.isAllPresent ? (
                              <span style={{ backgroundColor: COLORS.successBg, border: '1px solid ' + COLORS.successBorder, color: COLORS.success, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '800' }}>
                                ✓ ALL PRESENT
                              </span>
                            ) : r.percentage >= 90 ? (
                              <span style={{ backgroundColor: COLORS.infoBg, border: '1px solid ' + COLORS.infoBorder, color: COLORS.primary, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                                GOOD
                              </span>
                            ) : (
                              <span style={{ backgroundColor: COLORS.dangerBg, border: '1px solid ' + COLORS.dangerBorder, color: COLORS.danger, padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700' }}>
                                ATTN NEEDED
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <View style={{ padding: 12 }}>
                  {reportRows.map((r) => (
                    <View key={r.student.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight }}>
                      <Text style={{ fontWeight: '700' }}>{r.student.full_name} ({r.student.student_id})</Text>
                      <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>
                        Present: {r.presentCount} | Absent: {r.absentCount} | Leave: {r.leaveCount} | Rate: {r.percentage}%
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#DBEAFE',
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  modeSwitcherRow: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: '800',
    color: COLORS.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  modeTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  controlsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
  },
  controlGroup: {
    flex: 1,
    minWidth: 160,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectBtnText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  dateInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  rangeInputsRow: {
    flex: 2,
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  loadingContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.caption,
    marginTop: 12,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h3,
    marginTop: 12,
  },
  emptySub: {
    ...TYPOGRAPHY.caption,
    marginTop: 4,
    textAlign: 'center',
  },
  tableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  tableTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  periodText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  tableWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
});
