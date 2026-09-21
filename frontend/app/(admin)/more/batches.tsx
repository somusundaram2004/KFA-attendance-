import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { DatabaseService } from '../../../src/services/database';
import { Batch } from '../../../src/types';

export default function BatchesManagementScreen() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const bList = await DatabaseService.getBatches();
      setBatches(bList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async () => {
    if (!newBatchName.trim()) {
      Alert.alert('Validation Error', 'Batch name is required.');
      return;
    }

    try {
      setSaving(true);
      await DatabaseService.createBatch({
        name: newBatchName.trim(),
        description: newBatchDesc.trim(),
        schedules: [
          { id: `sch-${Date.now()}-1`, batch_id: '', day_of_week: 1, start_time: '17:00', end_time: '18:00' },
          { id: `sch-${Date.now()}-2`, batch_id: '', day_of_week: 3, start_time: '17:00', end_time: '18:00' }
        ]
      });
      setSaving(false);
      setModalVisible(false);
      setNewBatchName('');
      setNewBatchDesc('');
      await loadData();
      Alert.alert('Success', 'Batch created with Monday & Wednesday recurring schedule.');
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to create batch');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Academy Batches</Text>
          <Text style={styles.subtitle}>Recurring Mon & Wed session management</Text>
        </View>

        <Button
          title="+ Create Batch"
          onPress={() => setModalVisible(true)}
          size="sm"
        />
      </View>

      <FlatList
        data={batches}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.cardHeader}>
              <Text style={styles.batchName}>{item.name}</Text>
              <Text style={styles.gradeTag}>Mixed Grades</Text>
            </View>

            <Text style={styles.descText}>{item.description || 'Mon & Wed Session (Mixed Grades)'}</Text>

            <View style={styles.infoRow}>
              <Ionicons name="person-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Assigned Staff: {item.staff_names?.join(', ') || 'Mrs. Priya Sharma (Staff)'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={16} color={COLORS.secondary} />
              <Text style={styles.infoText}>
                Schedule: Mon & Wed (5:00 PM - 6:00 PM)
              </Text>
            </View>
          </View>
        )}
      />

      {/* Modal to Create Batch */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Create New Batch">
        <Input
          label="Batch Name *"
          placeholder="e.g. Batch 4 — Evening Session"
          value={newBatchName}
          onChangeText={setNewBatchName}
        />

        <Input
          label="Description"
          placeholder="e.g. Mon & Wed Evening Session (Mixed Grades)"
          value={newBatchDesc}
          onChangeText={setNewBatchDesc}
        />

        <Button
          title="Create Batch & Recurring Schedule"
          onPress={handleCreateBatch}
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
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  headerTextContainer: {
    flex: 1,
    minWidth: 180,
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  batchName: {
    ...TYPOGRAPHY.h3,
    fontSize: 16,
    flex: 1,
  },
  gradeTag: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: COLORS.infoLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: '600',
    flexShrink: 1,
  },
});
