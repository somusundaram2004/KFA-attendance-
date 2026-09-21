import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Modal } from './Modal';
import { Input } from './Input';
import { Select } from './Select';
import { Button } from './Button';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { syncManager } from '../../services/syncManager';

interface StudentObservationModalProps {
  visible: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  batchId: string;
  batchName: string;
  date: string;
  staffId?: string;
  staffName?: string;
}

const CATEGORIES = [
  { label: 'Homework not completed', value: 'Homework not completed' },
  { label: 'Did not bring materials', value: 'Did not bring materials' },
  { label: 'Not practicing lessons', value: 'Not practicing lessons' },
  { label: 'Student was inattentive', value: 'Student was inattentive' },
  { label: 'Student came late', value: 'Student came late' },
  { label: 'Parent requested compensation class', value: 'Parent requested compensation class' },
  { label: 'Other', value: 'Other' },
];

export const StudentObservationModal: React.FC<StudentObservationModalProps> = ({
  visible,
  onClose,
  studentId,
  studentName,
  batchId,
  batchName,
  date,
  staffId = 'u-staff-001',
  staffName = 'Mrs. Priya Sharma',
}) => {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please provide an observation description.');
      return;
    }

    try {
      setSaving(true);
      const res = await syncManager.saveObservation(
        studentId,
        studentName,
        batchId,
        batchName,
        date,
        category,
        description,
        staffId,
        staffName
      );
      setSaving(false);
      setDescription('');

      if (res.offline) {
        Alert.alert(
          'Saved Offline',
          `Observation for ${studentName} saved offline. Pending synchronization when internet returns.`
        );
      } else {
        Alert.alert(
          '✓ Observation Saved',
          `Observation for ${studentName} saved and synced to Admin.`
        );
      }
      onClose();
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to save observation.');
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={`Note for ${studentName}`}>
      <View style={styles.content}>
        <Text style={styles.subTitle}>Record an optional complaint or observation for Admin review.</Text>

        <Select
          label="Observation Category *"
          value={category}
          options={CATEGORIES}
          onSelect={setCategory}
        />

        <Input
          label="Observation Description *"
          placeholder="e.g. Homework not completed."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          style={{ height: 80 }}
        />

        <Button
          title="Save Observation"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ marginTop: SPACING.md }}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingVertical: SPACING.xs,
  },
  subTitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.md,
  },
});
