import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOffline } from '../../context/OfflineContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export const NetworkStatusBar: React.FC = () => {
  const { isOnline, pendingCount, failedCount, isSyncing, syncNow } = useOffline();

  return (
    <View style={[styles.container, isOnline ? styles.onlineBg : styles.offlineBg]}>
      {/* Network Status Badge */}
      <View style={styles.statusRow}>
        <View style={styles.badge}>
          <View style={[styles.dot, isOnline ? styles.greenDot : styles.orangeDot]} />
          <Text style={[styles.statusText, isOnline ? styles.greenText : styles.orangeText]}>
            {isOnline ? '🟢 Online' : '🟠 Offline'}
          </Text>
        </View>

        {/* Sync Info */}
        <View style={styles.infoBox}>
          {isSyncing ? (
            <View style={styles.syncingRow}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.syncingText}>Syncing records...</Text>
            </View>
          ) : pendingCount > 0 ? (
            <Text style={styles.pendingText}>⏳ {pendingCount} record{pendingCount === 1 ? '' : 's'} waiting to sync</Text>
          ) : failedCount > 0 ? (
            <Text style={styles.failedText}>⚠ {failedCount} record{failedCount === 1 ? '' : 's'} failed to sync</Text>
          ) : (
            <Text style={styles.syncedText}>✓ All data synchronized</Text>
          )}
        </View>
      </View>

      {/* Manual Sync Button when Online & Pending items exist */}
      {isOnline && pendingCount > 0 && !isSyncing && (
        <TouchableOpacity style={styles.syncButton} onPress={syncNow} activeOpacity={0.8}>
          <Ionicons name="sync" size={14} color="#FFFFFF" />
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 6,
  },
  onlineBg: {
    backgroundColor: '#F0FDF4',
    borderBottomColor: '#BBF7D0',
  },
  offlineBg: {
    backgroundColor: '#FFFBEB',
    borderBottomColor: '#FDE68A',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  greenDot: { backgroundColor: COLORS.success },
  orangeDot: { backgroundColor: COLORS.warning },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
  },
  greenText: { color: '#15803D' },
  orangeText: { color: '#B45309' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  syncingText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  pendingText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '700',
  },
  failedText: {
    fontSize: 12,
    color: COLORS.danger,
    fontWeight: '700',
  },
  syncedText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '700',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
