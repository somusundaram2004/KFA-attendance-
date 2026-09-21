import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Select } from '../../../src/components/ui/Select';
import { Button } from '../../../src/components/ui/Button';
import { DatabaseService } from '../../../src/services/database';
import { Grade, Batch } from '../../../src/types';

export default function CreateStudentScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState(`KFA-2026-${Math.floor(100 + Math.random() * 900)}`);

  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState('');

  const [grades, setGrades] = useState<Grade[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const gList = await DatabaseService.getGrades();
      const bList = await DatabaseService.getBatches();
      setGrades(gList);
      setBatches(bList);
      if (gList.length > 0) setSelectedGradeId(gList[0].id);
      if (bList.length > 0) setSelectedBatchId(bList[0].id);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Student full name is required.');
      return;
    }
    if (!studentId.trim()) {
      Alert.alert('Validation Error', 'Student ID code is required.');
      return;
    }

    try {
      setSaving(true);
      await DatabaseService.createStudent(
        {
          full_name: fullName.trim(),
          student_id: studentId.trim(),
        },
        selectedGradeId,
        selectedBatchId
      );
      setSaving(false);
      Alert.alert('Success', 'Student created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to create student.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.card, SHADOWS.md]}>
        <Text style={styles.title}>Register New Student</Text>
        <Text style={styles.subtitle}>Enter student profile and initial grade/batch assignment.</Text>

        <Input
          label="Full Name *"
          placeholder="e.g. Arun Kumar"
          value={fullName}
          onChangeText={setFullName}
        />

        <Input
          label="Student Code / ID *"
          placeholder="e.g. KFA-2026-101"
          value={studentId}
          onChangeText={setStudentId}
        />

        <Select
          label="Initial Grade Assignment *"
          value={selectedGradeId}
          options={grades.map(g => ({ label: g.name, value: g.id }))}
          onSelect={setSelectedGradeId}
        />

        <Select
          label="Initial Batch Assignment *"
          value={selectedBatchId}
          options={batches.map(b => ({ label: b.name, value: b.id }))}
          onSelect={setSelectedBatchId}
        />

        <Button
          title="Save & Register Student"
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ marginTop: SPACING.md }}
        />
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
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  title: {
    ...TYPOGRAPHY.h2,
    marginBottom: 4,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
});
