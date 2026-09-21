import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { DatabaseService } from '../../../src/services/database';
import { Grade } from '../../../src/types';

export default function GradesManagementScreen() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  const [newGradeName, setNewGradeName] = useState('');
  const [newGradeDesc, setNewGradeDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const loadGrades = async () => {
    try {
      setLoading(true);
      const list = await DatabaseService.getGrades();
      setGrades(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGrades();
  }, []);

  const handleAddGrade = async () => {
    if (!newGradeName.trim()) {
      Alert.alert('Validation Error', 'Grade name is required.');
      return;
    }

    try {
      setSaving(true);
      await DatabaseService.createGrade({
        name: newGradeName.trim(),
        description: newGradeDesc.trim(),
        display_order: grades.length + 1,
      });
      setSaving(false);
      setModalVisible(false);
      setNewGradeName('');
      setNewGradeDesc('');
      await loadGrades();
      Alert.alert('Success', 'Grade created successfully.');
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to create grade');
    }
  };

  const handleToggleActive = async (grade: Grade) => {
    try {
      await DatabaseService.updateGrade(grade.id, { is_active: !grade.is_active });
      await loadGrades();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update grade state');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Academy Grades / Levels</Text>
          <Text style={styles.subtitle}>Fetched dynamically from PostgreSQL database</Text>
        </View>

        <Button
          title="+ Add Grade"
          onPress={() => setModalVisible(true)}
          size="sm"
        />
      </View>

      {/* Grade List */}
      <FlatList
        data={grades}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.gradeCard, SHADOWS.sm]}>
            <View style={styles.orderBadge}>
              <Text style={styles.orderBadgeText}>{item.display_order}</Text>
            </View>

            <View style={styles.gradeInfo}>
              <Text style={styles.gradeName}>{item.name}</Text>
              <Text style={styles.gradeDesc}>{item.description || 'No description'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.statusToggle, item.is_active ? styles.statusActive : styles.statusInactive]}
              onPress={() => handleToggleActive(item)}
            >
              <Text style={[styles.statusToggleText, item.is_active ? styles.textActive : styles.textInactive]}>
                {item.is_active ? 'ACTIVE' : 'INACTIVE'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal to Add New Grade */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Add New Grade / Level">
        <Input
          label="Grade Name *"
          placeholder="e.g. Grade 8"
          value={newGradeName}
          onChangeText={setNewGradeName}
        />

        <Input
          label="Description (Optional)"
          placeholder="e.g. Senior Secondary Level"
          value={newGradeDesc}
          onChangeText={setNewGradeDesc}
        />

        <Button
          title="Save Grade"
          onPress={handleAddGrade}
          loading={saving}
          size="lg"
          style={{ marginTop: SPACING.md }}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  gradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  orderBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  orderBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gradeInfo: {
    flex: 1,
  },
  gradeName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  gradeDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: COLORS.successLight },
  statusInactive: { backgroundColor: COLORS.borderLight },
  statusToggleText: { fontSize: 10, fontWeight: '800' },
  textActive: { color: COLORS.success },
  textInactive: { color: COLORS.textMuted },
});
