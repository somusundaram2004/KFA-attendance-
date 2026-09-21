import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../src/constants/theme';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';

const REMEMBER_EMAIL_KEY = '@kfa_remember_email';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Load remembered email on mount
  useEffect(() => {
    async function loadRememberedEmail() {
      try {
        const savedEmail = await AsyncStorage.getItem(REMEMBER_EMAIL_KEY);
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (e) {
        console.error('Failed to load remembered email', e);
      }
    }
    loadRememberedEmail();
  }, []);

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    // Save or clear remembered email
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        await AsyncStorage.removeItem(REMEMBER_EMAIL_KEY);
      }
    } catch (e) {
      console.error('Failed to save remember me state', e);
    }

    const res = await login(email, password);
    if (res.success) {
      router.replace('/');
    } else {
      setErrorMessage(res.error || 'Authentication failed. Check credentials.');
    }
  };

  const handleFillDemo = (type: 'admin' | 'staff') => {
    if (type === 'admin') {
      setEmail('admin@kfa.edu');
      setPassword('AdminPass123!');
    } else {
      setEmail('staff.priya@kfa.edu');
      setPassword('StaffPass123!');
    }
    setErrorMessage('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.headerBackground}>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.academyTitle}>KFA ACADEMY</Text>
          <Text style={styles.academySubtitle}>Attendance & Class Management</Text>
        </View>

        <View style={[styles.card, SHADOWS.lg]}>
          <Text style={styles.loginTitle}>Account Login</Text>
          <Text style={styles.loginDesc}>Access student records, schedules & attendance</Text>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorBoxText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Input
            label="Email Address"
            placeholder="e.g. admin@kfa.edu"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.textSecondary} />}
          />

          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            isPassword
            leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.textSecondary} />}
          />

          {/* Remember Me & Forgot Password Row */}
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberMeText}>Remember Me</Text>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Login to Portal"
            onPress={handleLogin}
            loading={isLoading}
            size="lg"
            style={{ marginTop: SPACING.md }}
          />

          {/* Quick Demo Helpers */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Demo Sign-In Shortcuts:</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleFillDemo('admin')}
              >
                <Text style={styles.demoChipText}>🔑 Fill Admin Credentials</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoChip}
                onPress={() => handleFillDemo('staff')}
              >
                <Text style={styles.demoChipText}>👨‍🏫 Fill Staff Credentials</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Authorized access only. Contact Academy Administrator for account credentials.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    paddingBottom: SPACING.xxl,
  },
  headerBackground: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 50,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  academyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  academySubtitle: {
    fontSize: 14,
    color: '#DBEAFE',
    marginTop: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.md,
    marginTop: -30,
    borderRadius: 20,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    maxWidth: 480,
    alignSelf: 'center',
    width: '92%',
  },
  loginTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    marginBottom: 4,
  },
  loginDesc: {
    ...TYPOGRAPHY.caption,
    marginBottom: SPACING.lg,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    padding: SPACING.sm,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorBoxText: {
    fontSize: 13,
    color: COLORS.danger,
    marginLeft: 8,
    fontWeight: '600',
    flex: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.xs,
    flexWrap: 'wrap',
    gap: 6,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.card,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  rememberMeText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  demoSection: {
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  demoRow: {
    flexDirection: 'column',
    gap: 8,
  },
  demoChip: {
    backgroundColor: COLORS.borderLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  footerNote: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
});
