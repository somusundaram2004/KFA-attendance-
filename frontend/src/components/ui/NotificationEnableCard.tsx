import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import {
  isPushNotificationSupported,
  getNotificationPermissionState,
  subscribeToPushNotifications,
  sendTestPushNotification,
} from '../../pwa/pushManager';

export const NotificationEnableCard: React.FC = () => {
  const [permissionState, setPermissionState] = useState<string>('default');
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = () => {
    const state = getNotificationPermissionState();
    setPermissionState(state);
  };

  const handleEnableNotifications = async () => {
    setLoading(true);
    setStatusMessage(null);
    const result = await subscribeToPushNotifications();
    setLoading(false);
    checkStatus();

    if (result.success) {
      setStatusMessage({ text: result.message, type: 'success' });
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  const handleSendTestNotification = async () => {
    setTestLoading(true);
    setStatusMessage(null);
    const result = await sendTestPushNotification();
    setTestLoading(false);

    if (result.success) {
      setStatusMessage({
        text: '🔔 Push notification sent! Close this tab or minimize browser now to test background arrival.',
        type: 'success',
      });
    } else {
      setStatusMessage({ text: result.message, type: 'error' });
    }
  };

  if (!isPushNotificationSupported()) {
    return null; // Don't display card if push notification isn't supported by device environment
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Background & Offline Notifications</Text>
          <Text style={styles.subtitle}>
            Receive native alerts on your device even when the website is closed or in the background.
          </Text>
        </View>
      </View>

      {statusMessage && (
        <View
          style={[
            styles.messageBanner,
            statusMessage.type === 'success' && styles.successBanner,
            statusMessage.type === 'error' && styles.errorBanner,
            statusMessage.type === 'info' && styles.infoBanner,
          ]}
        >
          <Ionicons
            name={statusMessage.type === 'success' ? 'checkmark-circle' : 'alert-circle'}
            size={18}
            color={statusMessage.type === 'success' ? COLORS.success : COLORS.danger}
          />
          <Text
            style={[
              styles.messageText,
              { color: statusMessage.type === 'success' ? COLORS.success : COLORS.danger },
            ]}
          >
            {statusMessage.text}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {permissionState !== 'granted' ? (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleEnableNotifications}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="notifications" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>Enable Site-Closed Notifications</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.enabledRow}>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.badgeText}>Background Notifications Active</Text>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleSendTestNotification}
              disabled={testLoading}
            >
              {testLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.secondaryButtonText}>Send Test Push Notification</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: COLORS.infoLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...TYPOGRAPHY.h3,
    marginBottom: 2,
  },
  subtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  messageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: 8,
    marginTop: SPACING.sm,
    gap: 8,
  },
  successBanner: {
    backgroundColor: COLORS.successBg,
    borderColor: COLORS.successBorder,
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
    borderWidth: 1,
  },
  infoBanner: {
    backgroundColor: COLORS.infoBg,
    borderColor: COLORS.infoBorder,
    borderWidth: 1,
  },
  messageText: {
    ...TYPOGRAPHY.caption,
    flex: 1,
    fontWeight: '500',
  },
  actions: {
    marginTop: SPACING.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: COLORS.infoBg,
    borderWidth: 1,
    borderColor: COLORS.infoBorder,
  },
  secondaryButtonText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  enabledRow: {
    gap: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
});
