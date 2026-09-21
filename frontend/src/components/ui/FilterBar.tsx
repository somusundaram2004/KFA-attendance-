import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { Select } from './Select';
import { Input } from './Input';
import { Grade, Batch, FilterOptions } from '../../types';

interface FilterBarProps {
  filters: FilterOptions;
  grades: Grade[];
  batches: Batch[];
  onFilterChange: (newFilters: FilterOptions) => void;
  onReset: () => void;
  showSearch?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  grades,
  batches,
  onFilterChange,
  onReset,
  showSearch = true,
}) => {
  const gradeOptions = [
    { label: 'All Grades', value: '' },
    ...grades.map((g) => ({ label: g.name, value: g.id })),
  ];

  const filteredBatches = filters.gradeId
    ? batches.filter((b) => !b.grade_id || b.grade_id === filters.gradeId)
    : batches;

  const batchOptions = [
    { label: 'All Batches', value: '' },
    ...filteredBatches.map((b) => ({ label: b.name, value: b.id })),
  ];

  const hasActiveFilters = Boolean(
    filters.gradeId || filters.batchId || filters.searchQuery || filters.date
  );

  return (
    <View style={styles.container}>
      {showSearch && (
        <Input
          placeholder="Search by student name, ID..."
          value={filters.searchQuery || ''}
          onChangeText={(text) => onFilterChange({ ...filters, searchQuery: text })}
          leftIcon={<Ionicons name="search" size={18} color={COLORS.textSecondary} />}
          containerStyle={{ marginBottom: SPACING.xs }}
        />
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        <View style={styles.selectWrapper}>
          <Select
            placeholder="Grade"
            value={filters.gradeId || ''}
            options={gradeOptions}
            onSelect={(val) => onFilterChange({ ...filters, gradeId: val, batchId: '' })}
            containerStyle={styles.compactSelect}
          />
        </View>

        <View style={styles.selectWrapper}>
          <Select
            placeholder="Batch"
            value={filters.batchId || ''}
            options={batchOptions}
            onSelect={(val) => onFilterChange({ ...filters, batchId: val })}
            containerStyle={styles.compactSelect}
          />
        </View>

        {hasActiveFilters && (
          <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.7}>
            <Ionicons name="refresh-outline" size={16} color={COLORS.danger} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectWrapper: {
    width: 140,
    marginRight: SPACING.sm,
  },
  compactSelect: {
    marginBottom: 0,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.dangerLight,
    height: 40,
  },
  resetText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.danger,
    marginLeft: 4,
  },
});
