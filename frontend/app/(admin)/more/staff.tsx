import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS } from '../../../src/constants/theme';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { Modal } from '../../../src/components/ui/Modal';
import { DatabaseService } from '../../../src/services/database';
import { Profile } from '../../../src/types';

export default function StaffManagementScreen() {
  const [staffList, setStaffList] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStaff = async () => {
    try {
      setLoading(true);
      const all = await DatabaseService.getAllProfiles();
      setStaffList(all.filter(p => p.role === 'STAFF'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert('Validation Error', 'Staff name and email are required.');
      return;
    }

    try {
      setSaving(true);
      await DatabaseService.createProfile({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: 'STAFF',
        status: 'ACTIVE',
      });
      setSaving(false);
      setModalVisible(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadStaff();
      Alert.alert('Success', 'Staff profile created. Staff can sign in using assigned email.');
    } catch (e: any) {
      setSaving(false);
      Alert.alert('Error', e.message || 'Failed to create staff account');
    }
  };

  const handleToggleStatus = async (staff: Profile) => {
    const nextStatus = staff.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await DatabaseService.updateProfileStatus(staff.id, nextStatus);
      await loadStaff();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update staff status');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Staff Account Directory</Text>
          <Text style={styles.subtitle}>Manage teacher access & batch permissions</Text>
        </View>

        <Button
          title="+ Add Staff"
          onPress={() => setModalVisible(true)}
          size="sm"
        />
      </View>

      <FlatList
        data={staffList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={[styles.card, SHADOWS.sm]}>
            <View style={styles.avatarBox}>
              <Ionicons name="person" size={24} color={COLORS.primary} />
            </View>

            <View style={styles.info}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.phone}>📞 {item.phone || 'No phone provided'}</Text>
            </View>

            <TouchableOpacity
              style={[styles.statusBadge, item.status === 'ACTIVE' ? styles.bgActive : styles.bgInactive]}
              onPress={() => handleToggleStatus(item)}
            >
              <Text style={[styles.statusText, item.status === 'ACTIVE' ? styles.txtActive : styles.txtInactive]}>
                {item.status}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)} title="Create Staff Account">
        <Input
          label="Full Name *"
          placeholder="e.g. Mrs. Priya Sharma"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Email Address *"
          placeholder="e.g. staff.priya@kfa.edu"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Phone Number"
          placeholder="e.g. +91 98765 12345"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <Button
          title="Create Staff Credentials"
          onPress={handleCreateStaff}
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
    gap: 8,
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    flexWrap: 'wrap',
    gap: 8,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.infoLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs,
  },
  info: {
    flex: 1,
  },
  name: {
    ...TYPOGRAPHY.h3,
    fontSize: 15,
  },
  email: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  phone: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bgActive: { backgroundColor: COLORS.successLight },
  bgInactive: { backgroundColor: COLORS.borderLight },
  statusText: { fontSize: 10, fontWeight: '800' },
  txtActive: { color: COLORS.success },
  txtInactive: { color: COLORS.textMuted },
});
