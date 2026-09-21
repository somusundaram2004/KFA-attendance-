import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { FilterBar } from '../../../src/components/ui/FilterBar';
import { StatusChip } from '../../../src/components/ui/StatusChip';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { CardSkeleton } from '../../../src/components/ui/LoadingSkeleton';
import { DatabaseService } from '../../../src/services/database';
import { Student, Grade, Batch, FilterOptions } from '../../../src/types';

export default function StudentsScreen() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    gradeId: '',
    batchId: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [gList, bList, sList] = await Promise.all([
        DatabaseService.getGrades(),
        DatabaseService.getBatches(),
        DatabaseService.getStudents(filters),
      ]);
      setGrades(gList);
      setBatches(bList);
      setStudents(sList);
    } catch (e) {
      console.error('Error loading students:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({ searchQuery: '', gradeId: '', batchId: '' });
  };

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.topContainer}>
        <FilterBar
          filters={filters}
          grades={grades}
          batches={batches}
          onFilterChange={setFilters}
          onReset={handleResetFilters}
        />
      </View>

      {/* Student List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.resultCountText}>
          Showing {students.length} Student{students.length === 1 ? '' : 's'}
        </Text>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(admin)/students/create')}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      {/* Student List */}
      {loading ? (
        <View style={{ paddingHorizontal: SPACING.lg }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, SHADOWS.sm]}
              onPress={() => router.push(`/(admin)/students/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={24} color={COLORS.primary} />
              </View>

              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.studentName}>{item.full_name}</Text>
                  <StatusChip status={item.status} size="sm" />
                </View>

                <Text style={styles.studentIdText}>ID: {item.student_id}</Text>

                <View style={styles.badgeRow}>
                  <Text style={styles.gradeBadge}>
                    🎓 {item.current_grade_name || 'Unassigned Grade'}
                  </Text>
                  <Text style={styles.batchBadge}>
                    🏫 {item.current_batch_name || 'Unassigned Batch'}
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState
              title="No Students Found"
              message="No student profiles match your search and filter criteria."
              actionTitle="Reset Filters"
              onAction={handleResetFilters}
            />
          }
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
  topContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  resultCountText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  listContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 4,
  },
  studentName: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  studentIdText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'column',
    gap: 2,
  },
  gradeBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  batchBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
