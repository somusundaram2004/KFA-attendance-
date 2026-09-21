import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import { DatabaseService } from '../../src/services/database';
import { Batch, Student, AttendanceStatus } from '../../src/types';
import { getTodayISODate } from '../../src/utils/date';
import { StatCard } from '../../src/components/ui/StatCard';

type ViewMode = 'DATE' | 'MONTH' | 'RANGE';

export default function StaffPreviousAttendanceHistory() {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const staffId = user?.id || 'u-staff-001';
  const todayStr = getTodayISODate(); // e.g. "2026-09-21"

  // Filter States
  const [viewMode, setViewMode] = useState<ViewMode>('MONTH');
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('ALL');

  // Date Control States
  const [singleDate, setSingleDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // "2026-09"
  const [fromDate, setFromDate] = useState<string>(todayStr.slice(0, 7) + '-01');
  const [toDate, setToDate] = useState<string>(todayStr);

  // Data & UI States
  const [loading, setLoading] = useState<boolean>(true);
  const [matrixData, setMatrixData] = useState<any>(null);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Load Assigned Batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const bList = await DatabaseService.getBatches(staffId);
        setAssignedBatches(bList);
      } catch (err) {
        console.error('Error fetching staff batches:', err);
      }
    };
    fetchBatches();
  }, [staffId]);

  // Compute Start & End Date depending on ViewMode
  const { computedStartDate, computedEndDate, isValidRange } = useMemo(() => {
    setRangeError(null);

    if (viewMode === 'DATE') {
      return { computedStartDate: singleDate, computedEndDate: singleDate, isValidRange: true };
    }

    if (viewMode === 'MONTH') {
      const [yearStr, monthStr] = selectedMonth.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);

      // Handle Days in Month (including leap year for Feb)
      const daysInMonth = new Date(year, month, 0).getDate();
      const start = `${selectedMonth}-01`;
      const end = `${selectedMonth}-${String(daysInMonth).padStart(2, '0')}`;
      return { computedStartDate: start, computedEndDate: end, isValidRange: true };
    }

    // RANGE Mode
    if (fromDate > toDate) {
      setRangeError('Invalid date range: "From Date" cannot be after "To Date".');
      return { computedStartDate: fromDate, computedEndDate: toDate, isValidRange: false };
    }

    return { computedStartDate: fromDate, computedEndDate: toDate, isValidRange: true };
  }, [viewMode, singleDate, selectedMonth, fromDate, toDate]);

  // Load Matrix Attendance Data
  const loadMatrixData = async () => {
    if (!isValidRange) return;
    setLoading(true);
    try {
      const batchFilter = selectedBatchId === 'ALL' ? undefined : selectedBatchId;
      const data = await DatabaseService.getAttendanceHistoryMatrix(
        batchFilter,
        computedStartDate,
        computedEndDate
      );
      setMatrixData(data);
    } catch (err) {
      console.error('Error loading attendance matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatrixData();
  }, [selectedBatchId, computedStartDate, computedEndDate, isValidRange]);

  // Status Badge Renderer Helper
  const renderStatusBadge = (status?: AttendanceStatus) => {
    if (!status) {
      return <Text style={styles.dashText}>—</Text>;
    }

    switch (status) {
      case 'PRESENT':
        return <View style={[styles.statusBadge, styles.presentBadge]}><Text style={styles.presentText}>P</Text></View>;
      case 'ABSENT':
        return <View style={[styles.statusBadge, styles.absentBadge]}><Text style={styles.absentText}>A</Text></View>;
      case 'LATE':
        return <View style={[styles.statusBadge, styles.lateBadge]}><Text style={styles.lateText}>L</Text></View>;
      case 'LEAVE':
        return <View style={[styles.statusBadge, styles.leaveBadge]}><Text style={styles.leaveText}>LE</Text></View>;
      default:
        return <Text style={styles.dashText}>—</Text>;
    }
  };

  return (
    <View style={styles.pageContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        
        {/* Header Card */}
        <View style={[styles.headerCard, SHADOWS.md]}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="time" size={24} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Previous Attendance History</Text>
              <Text style={styles.headerSubtitle}>
                Read-only attendance logs and horizontal matrix overview.
              </Text>
            </View>
          </View>
          <View style={styles.readOnlyBadge}>
            <Ionicons name="lock-closed" size={12} color={COLORS.accentLight} style={{ marginRight: 4 }} />
            <Text style={styles.readOnlyText}>READ-ONLY MODE</Text>
          </View>
        </View>

        {/* View Mode Selector Tabs & Batch Filter */}
        <View style={[styles.filterCard, SHADOWS.sm]}>
          
          {/* Mode Switcher */}
          <View style={styles.modeSwitcherRow}>
            <Text style={styles.filterLabel}>VIEW MODE:</Text>
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[styles.modeTabBtn, viewMode === 'DATE' && styles.modeTabBtnActive]}
                onPress={() => setViewMode('DATE')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="today-outline"
                  size={16}
                  color={viewMode === 'DATE' ? '#FFFFFF' : COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modeTabText, viewMode === 'DATE' && styles.modeTabTextActive]}>
                  Date
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, viewMode === 'MONTH' && styles.modeTabBtnActive]}
                onPress={() => setViewMode('MONTH')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="calendar-outline"
                  size={16}
                  color={viewMode === 'MONTH' ? '#FFFFFF' : COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modeTabText, viewMode === 'MONTH' && styles.modeTabTextActive]}>
                  Month
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeTabBtn, viewMode === 'RANGE' && styles.modeTabBtnActive]}
                onPress={() => setViewMode('RANGE')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="stats-chart-outline"
                  size={16}
                  color={viewMode === 'RANGE' ? '#FFFFFF' : COLORS.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modeTabText, viewMode === 'RANGE' && styles.modeTabTextActive]}>
                  Date Range
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Dynamic Date Controls & Batch Selector */}
          <View style={styles.controlsRow}>
            
            {/* Batch Filter */}
            <View style={styles.controlGroup}>
              <Text style={styles.inputLabel}>SELECT BATCH / CLASS:</Text>
              <View style={styles.selectContainer}>
                <TouchableOpacity
                  style={styles.batchSelectBtn}
                  onPress={() => {
                    // Cycle through batches or set ALL
                    const ids = ['ALL', ...assignedBatches.map(b => b.id)];
                    const curIdx = ids.indexOf(selectedBatchId);
                    const nextId = ids[(curIdx + 1) % ids.length];
                    setSelectedBatchId(nextId);
                  }}
                >
                  <Ionicons name="shapes-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.batchSelectText} numberOfLines={1}>
                    {selectedBatchId === 'ALL'
                      ? 'All Assigned Batches'
                      : assignedBatches.find(b => b.id === selectedBatchId)?.name || 'Select Batch'}
                  </Text>
                  <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Dynamic Date Inputs based on Mode */}
            {viewMode === 'DATE' && (
              <View style={styles.controlGroup}>
                <Text style={styles.inputLabel}>SELECT DATE:</Text>
                <TextInput
                  style={styles.dateInput}
                  value={singleDate}
                  onChangeText={setSingleDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>
            )}

            {viewMode === 'MONTH' && (
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
            )}

            {viewMode === 'RANGE' && (
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

          {/* Range Error Alert if From > To */}
          {rangeError && (
            <View style={styles.errorAlert}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorAlertText}>{rangeError}</Text>
            </View>
          )}
        </View>

        {/* Summary Metrics Cards */}
        {matrixData?.summary && (
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Students"
              value={matrixData.summary.totalStudents}
              color={COLORS.primary}
              icon={<Ionicons name="people" size={18} color={COLORS.primary} />}
            />
            <StatCard
              title="Present Count"
              value={matrixData.summary.totalPresent}
              color={COLORS.success}
              icon={<Ionicons name="checkmark-circle" size={18} color={COLORS.success} />}
            />
            <StatCard
              title="Absent Count"
              value={matrixData.summary.totalAbsent}
              color={COLORS.danger}
              icon={<Ionicons name="close-circle" size={18} color={COLORS.danger} />}
            />
            <StatCard
              title="Attendance Rate"
              value={`${matrixData.summary.overallAttendancePercentage}%`}
              color={COLORS.secondary}
              icon={<Ionicons name="stats-chart" size={18} color={COLORS.secondary} />}
            />
          </View>
        )}

        {/* Attendance Content Area */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Retrieving attendance records...</Text>
          </View>
        ) : !matrixData || matrixData.rows.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No Attendance Records Found</Text>
            <Text style={styles.emptySub}>No attendance logs exist for the selected date range or batch.</Text>
          </View>
        ) : viewMode === 'DATE' ? (

          /* ======================================================== */
          /* DATE MODE: Vertical Daily Attendance Layout (No Scroll)  */
          /* ======================================================== */
          <View style={[styles.dailyTableCard, SHADOWS.sm]}>
            <View style={styles.dailyTableHeader}>
              <Text style={styles.dailyTitle}>Attendance Log for {singleDate}</Text>
              <Text style={styles.dailyBadge}>{matrixData.rows.length} Students</Text>
            </View>

            <View style={styles.verticalTable}>
              {/* Header Row */}
              <View style={styles.vTableRowHeader}>
                <Text style={[styles.vCellHeader, { flex: 2 }]}>Student Name</Text>
                <Text style={[styles.vCellHeader, { flex: 1, textAlign: 'center' }]}>Status</Text>
                <Text style={[styles.vCellHeader, { flex: 2 }]}>Details / Class</Text>
              </View>

              {/* Data Rows */}
              {matrixData.rows.map((row: any) => {
                const status = row.attendanceMap[singleDate]?.status;
                const notes = row.attendanceMap[singleDate]?.notes;
                return (
                  <View key={row.student.id} style={styles.vTableRow}>
                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                      <View style={styles.studentAvatar}>
                        <Text style={styles.studentAvatarText}>{row.student.full_name.charAt(0)}</Text>
                      </View>
                      <View>
                        <Text style={styles.studentNameText}>{row.student.full_name}</Text>
                        <Text style={styles.studentCodeText}>{row.student.student_id}</Text>
                      </View>
                    </View>

                    <View style={{ flex: 1, alignItems: 'center' }}>
                      {renderStatusBadge(status)}
                    </View>

                    <View style={{ flex: 2 }}>
                      <Text style={styles.detailsText} numberOfLines={1}>
                        {notes || row.student.current_batch_name || 'Regular Session'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (

          /* ======================================================== */
          /* MONTH & RANGE MODES: Horizontal Date-Wise Attendance Matrix */
          /* CRITICAL REQUIREMENT: Horizontal scroll ONLY inside table */
          /* ======================================================== */
          <View style={[styles.matrixCard, SHADOWS.sm]}>
            <View style={styles.matrixHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="grid-outline" size={18} color={COLORS.primary} />
                <Text style={styles.matrixTitle}>
                  {viewMode === 'MONTH' ? `Monthly Attendance Matrix (${selectedMonth})` : `Date Range Matrix (${computedStartDate} to ${computedEndDate})`}
                </Text>
              </View>
              <Text style={styles.legendText}>
                <Text style={{ color: COLORS.success, fontWeight: '700' }}>P</Text>: Present |{' '}
                <Text style={{ color: COLORS.danger, fontWeight: '700' }}>A</Text>: Absent |{' '}
                <Text style={{ color: COLORS.late, fontWeight: '700' }}>L</Text>: Late |{' '}
                <Text style={{ color: COLORS.warning, fontWeight: '700' }}>LE</Text>: Leave
              </Text>
            </View>

            {/* Web Native Horizontal Table Container */}
            <View style={styles.tableScrollWrapper}>
              {/* Using Web Table elements for perfect sticky positioning */}
              {typeof document !== 'undefined' ? (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: COLORS.background }}>
                        {/* Sticky First Column: Student Name */}
                        <th
                          style={{
                            position: 'sticky',
                            left: 0,
                            zIndex: 20,
                            backgroundColor: '#F8FAFC',
                            borderBottom: '2px solid #E2E8F0',
                            borderRight: '2px solid #CBD5E1',
                            padding: '12px 14px',
                            textAlign: 'left',
                            minWidth: '180px',
                            fontWeight: '700',
                            color: COLORS.textSecondary,
                            boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                          }}
                        >
                          Student Name
                        </th>

                        {/* Date Columns */}
                        {matrixData.dates.map((dateStr: string) => {
                          const dateObj = new Date(dateStr);
                          const dayNum = dateStr.slice(-2);
                          const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                          return (
                            <th
                              key={dateStr}
                              style={{
                                padding: '10px 8px',
                                textAlign: 'center',
                                minWidth: '46px',
                                borderBottom: '2px solid #E2E8F0',
                                borderRight: '1px solid #F1F5F9',
                                backgroundColor: '#F8FAFC',
                                fontWeight: '700',
                                color: COLORS.text,
                              }}
                            >
                              <div style={{ fontSize: '12px', color: COLORS.primary }}>{dayNum}</div>
                              <div style={{ fontSize: '10px', color: COLORS.textMuted, textTransform: 'uppercase' }}>
                                {dayName}
                              </div>
                            </th>
                          );
                        })}

                        {/* Summary Column */}
                        <th
                          style={{
                            padding: '10px 12px',
                            textAlign: 'center',
                            minWidth: '65px',
                            backgroundColor: '#F8FAFC',
                            borderBottom: '2px solid #E2E8F0',
                            fontWeight: '700',
                            color: COLORS.primary,
                          }}
                        >
                          Rate %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {matrixData.rows.map((row: any) => (
                        <tr
                          key={row.student.id}
                          style={{
                            backgroundColor: hoveredRowId === row.student.id ? '#F1F5F9' : '#FFFFFF',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={() => setHoveredRowId(row.student.id)}
                          onMouseLeave={() => setHoveredRowId(null)}
                        >
                          {/* Sticky Student Name Cell */}
                          <td
                            style={{
                              position: 'sticky',
                              left: 0,
                              zIndex: 10,
                              backgroundColor: hoveredRowId === row.student.id ? '#F1F5F9' : '#FFFFFF',
                              borderBottom: '1px solid #E2E8F0',
                              borderRight: '2px solid #CBD5E1',
                              padding: '10px 14px',
                              fontWeight: '600',
                              color: COLORS.text,
                              whiteSpace: 'nowrap',
                              boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                            }}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '700' }}>{row.student.full_name}</div>
                            <div style={{ fontSize: '10px', color: COLORS.textMuted }}>{row.student.student_id}</div>
                          </td>

                          {/* Attendance Status Cells */}
                          {matrixData.dates.map((dateStr: string) => {
                            const status = row.attendanceMap[dateStr]?.status;
                            return (
                              <td
                                key={dateStr}
                                style={{
                                  padding: '8px 4px',
                                  textAlign: 'center',
                                  borderBottom: '1px solid #F1F5F9',
                                  borderRight: '1px solid #F1F5F9',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                  {renderStatusBadge(status)}
                                </div>
                              </td>
                            );
                          })}

                          {/* Percentage Rate Cell */}
                          <td
                            style={{
                              padding: '8px 10px',
                              textAlign: 'center',
                              borderBottom: '1px solid #F1F5F9',
                              fontWeight: '700',
                              fontSize: '12px',
                              color: row.percentage >= 90 ? COLORS.success : row.percentage >= 75 ? COLORS.warning : COLORS.danger,
                            }}
                          >
                            {row.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Fallback for Native Viewports */
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={{ padding: 12 }}>
                    {matrixData.rows.map((row: any) => (
                      <View key={row.student.id} style={{ flexDirection: 'row', paddingVertical: 8 }}>
                        <Text style={{ width: 140, fontWeight: '700' }}>{row.student.full_name}</Text>
                        {matrixData.dates.map((d: string) => (
                          <View key={d} style={{ width: 36, alignItems: 'center' }}>
                            {renderStatusBadge(row.attendanceMap[d]?.status)}
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
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
    overflow: 'hidden', // Page itself NEVER scrolls horizontally
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
  readOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  readOnlyText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
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
  },
  controlGroup: {
    flex: 1,
    minWidth: 180,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  selectContainer: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  batchSelectText: {
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
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.sm,
    marginTop: SPACING.md,
    gap: 8,
  },
  errorAlertText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '600',
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
  /* Daily Layout Styles */
  dailyTableCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  dailyTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  dailyTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  dailyBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: COLORS.infoBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verticalTable: {
    gap: 4,
  },
  vTableRowHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  vCellHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  vTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  studentAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  studentNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  studentCodeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  detailsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  /* Matrix Layout Styles */
  matrixCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  matrixHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
    paddingBottom: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  matrixTitle: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  tableScrollWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  /* Status Badges */
  statusBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  presentBadge: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
  },
  presentText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
  },
  absentBadge: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  absentText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.danger,
  },
  lateBadge: {
    backgroundColor: COLORS.lateBg,
    borderColor: COLORS.lateBorder,
  },
  lateText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.late,
  },
  leaveBadge: {
    backgroundColor: COLORS.warningBg,
    borderColor: COLORS.warningBorder,
  },
  leaveText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.warning,
  },
  dashText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
