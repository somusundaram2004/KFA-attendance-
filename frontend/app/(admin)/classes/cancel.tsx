import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { DatabaseService } from '../../../src/services/database';

export default function CancelClassScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  const [reason, setReason] = useState('Teacher Unavailable');
  const [loading, setLoading] = useState(false);

  const handleCancel = async (assignComp: boolean) => {
    if (!sessionId) return;
    if (!reason.trim()) {
      Alert.alert('Validation Error', 'Please enter a cancellation reason.');
      return;
    }

    try {
      setLoading(true);
      await DatabaseService.cancelClassSession(sessionId, reason.trim());
      setLoading(false);

      if (assignComp) {
        router.replace({
          pathname: '/(admin)/classes/compensation',
          params: { originalSessionId: sessionId },
        });
      } else {
        Alert.alert('Class Cancelled', 'The scheduled class has been cancelled.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    } catch (e: any) {
      setLoading(false);
      Alert.alert('Error', e.message || 'Failed to cancel class.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={[styles.card, SHADOWS.md]}>
        <Text style={styles.title}>Cancel Scheduled Class</Text>
        <Text style={styles.subtitle}>
          This will mark the selected class session as cancelled. Cancelled classes will not count as absences.
        </Text>

        <Input
          label="Reason for Cancellation *"
          placeholder="e.g. Teacher unavailable, Heavy rain..."
          value={reason}
          onChangeText={setReason}
        />

        <View style={styles.btnRow}>
          <Button
            title="Cancel & Assign Compensation"
            onPress={() => handleCancel(true)}
            loading={loading}
            variant="accent"
            size="md"
            style={{ marginBottom: SPACING.sm }}
          />

          <Button
            title="Cancel Class Only"
            onPress={() => handleCancel(false)}
            loading={loading}
            variant="danger"
            size="md"
          />
        </View>
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
    fontSize: 20,
    marginBottom: 4,
    color: COLORS.danger,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
  btnRow: {
    marginTop: SPACING.md,
  },
});
