import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import { logout, updateUserProfile } from '../../services/authService';

export default function SettingsScreen({ navigation }: any) {
  const { user, profile, refreshUser } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState(profile?.firstName ?? '');
  const [lastName, setLastName] = useState(profile?.lastName ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');

  function startEdit() {
    setFirstName(profile?.firstName ?? '');
    setLastName(profile?.lastName ?? '');
    setPhone(profile?.phone ?? '');
    setEditing(true);
  }

  async function handleSave() {
    if (!user) return;
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Eksik bilgi', 'Ad ve soyad boş bırakılamaz.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
      });
      await refreshUser();
      setEditing(false);
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e, 'Profil güncellenemedi.'));
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    Alert.alert('Çıkış', 'Çıkış yapmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const readonlyRows: [string, string][] = [
    ['E-posta', profile?.email ?? '-'],
    ['Hesap türü', profile?.role === 'barber' ? 'Berber' : 'Müşteri'],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.sectionRow}>
          <Text style={styles.section}>Hesap Bilgileri</Text>
          {!editing && (
            <TouchableOpacity onPress={startEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editLink}>Düzenle</Text>
            </TouchableOpacity>
          )}
        </View>

        {editing ? (
          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Ad</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName}
                placeholder="Ad" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Soyad</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName}
                placeholder="Soyad" placeholderTextColor={Colors.textMuted} />
            </View>
            <View style={[styles.field, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>Telefon</Text>
              <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad"
                placeholder="+90 5XX XXX XX XX" placeholderTextColor={Colors.textMuted} />
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Ad Soyad</Text>
              <Text style={styles.rowVal}>{profile ? `${profile.firstName} ${profile.lastName}`.trim() : '-'}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Telefon</Text>
              <Text style={styles.rowVal}>{profile?.phone || '-'}</Text>
            </View>
            {readonlyRows.map(([l, v]) => (
              <View key={l} style={styles.row}>
                <Text style={styles.rowLabel}>{l}</Text>
                <Text style={styles.rowVal}>{v}</Text>
              </View>
            ))}
          </View>
        )}

        {editing && (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)} disabled={saving}>
              <Text style={styles.cancelText}>Vazgeç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color={Colors.primary} /> : <Text style={styles.saveText}>Kaydet</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.section}>Uygulama</Text>
        <View style={styles.card}>
          <View style={[styles.row, { borderBottomWidth: 0 }]}><Text style={styles.rowLabel}>Sürüm</Text><Text style={styles.rowVal}>1.0.0</Text></View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: -8 },
  section: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  editLink: { fontSize: 13, fontWeight: '700', color: Colors.primary },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.borderLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 14, color: Colors.textSecondary },
  rowVal: { fontSize: 14, fontWeight: '600', color: Colors.primary, flexShrink: 1, marginLeft: 12, textAlign: 'right' },
  field: { paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  input: { fontSize: 15, color: Colors.primary, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border, borderRadius: 8, paddingHorizontal: 10 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary },
  saveBtn: { flex: 1, backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  saveText: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  logoutBtn: { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
