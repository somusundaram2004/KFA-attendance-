import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Select } from '../../../src/components/ui/Select';
import { Button } from '../../../src/components/ui/Button';
import { DatePicker } from '../../../src/components/ui/DatePicker';
import { DatabaseService } from '../../../src/services/database';
import { Batch } from '../../../src/types';
import { getTodayISODate, formatDateDDMMYYYY } from '../../../src/utils/date';

export default function CompensationClassScreen() {
  const { originalSessionId } = useLocalSearchParams<{ originalSessionId: string }>();
  const router = useRouter();

  const [compDate, setCompDate] = useState(getTodayISODate());
  const [compTime, setCompTime] = useState('17:00');
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [notes, setNotes] = useState('');

  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [originalSessionDate, setOriginalSessionDate] = useState('');

  useEffect(() => {
    async function load() {
      const bList = await DatabaseService.getBatches();
      setBatches(bList);
      if (bList.length > 0) setSelectedBatchId(bList[0].id);

      if (originalSessionId) {
        const sessions = await DatabaseService.getClassSessions();
        const orig = sessions.find(s => s.id === originalSessionId);
        if (orig) {
          setOriginalSessionDate(orig.session_date);
          if (orig.batch_id) setSelectedBatchId(orig.batch_id);
        }
      }
    }
    load();
  }, [originalSessionId]);

  const handleAssign = async () => {
    if (!originalSessionId || !selectedBatchId) {
      Alert.alert('Validation Error', 'Missing required class session parameters.');
      return;
    }

    try {
      setLoading(true);
      await DatabaseService.createCompensationSession(
        originalSessionId,
        compDate,
        compTime,
        selectedBatchId,
        notes
      );
      setLoading(false);

      Alert.alert(
        '✓ Compensation Assigned',
        `Original Class: ${formatDateDDMMYYYY(originalSessionDate)}\nReplacement: ${formatDateDDMMYYYY(compDate)} at ${compTime}`,
        [{ text: 'OK', onPress: () => router.replace('/(admin)/classes') }]
      );
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to assign compensation class.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Linked Original Info Banner */}
      <View style={styles.linkBanner}>
        <Ionicons name="swap-horizontal" size={24} color={COLORS.accent} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={styles.bannerTitle}>Compensation for Cancelled Class</Text>
          <Text style={styles.bannerSub}>
            Original Session Date: {originalSessionDate ? formatDateDDMMYYYY(originalSessionDate) : 'Select Class'}
          </Text>
        </View>
      </View>

      <View style={[styles.card, SHADOWS.md]}>
        <Text style={styles.formTitle}>Schedule Replacement Session</Text>

        <DatePicker
          label="Compensation Date *"
          value={compDate}
          onChange={setCompDate}
        />

        <Input
          label="Time (HH:MM 24hr format) *"
          placeholder="e.g. 17:00"
          value={compTime}
          onChangeText={setCompTime}
        />

        <Select
          label="Target Batch *"
          value={selectedBatchId}
          options={batches.map(b => ({ label: b.name, value: b.id }))}
          onSelect={setSelectedBatchId}
        />

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Special weekend compensation session"
          value={notes}
          onChangeText={setNotes}
        />

        <Button
          title="Assign Compensation Class"
          onPress={handleAssign}
          loading={loading}
          variant="accent"
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
  linkBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    padding: SPACING.md,
    borderRadius: 14,
    marginBottom: SPACING.lg,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  bannerSub: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 2,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  formTitle: {
    ...TYPOGRAPHY.h3,
    marginBottom: SPACING.lg,
  },
});
