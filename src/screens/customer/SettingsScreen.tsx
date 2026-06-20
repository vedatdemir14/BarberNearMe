import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { logout } from '../../services/authService';

export default function SettingsScreen({ navigation }: any) {
  const { profile } = useAuth();

  function handleLogout() {
    Alert.alert('Çıkış', 'Çıkış yapmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const rows: [string, string][] = [
    ['Ad Soyad', profile ? `${profile.firstName} ${profile.lastName}`.trim() : '-'],
    ['E-posta', profile?.email ?? '-'],
    ['Telefon', profile?.phone || '-'],
    ['Hesap türü', profile?.role === 'barber' ? 'Berber' : 'Müşteri'],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={styles.section}>Hesap Bilgileri</Text>
        <View style={styles.card}>
          {rows.map(([l, v]) => (
            <View key={l} style={styles.row}>
              <Text style={styles.rowLabel}>{l}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>Uygulama</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.rowLabel}>Sürüm</Text><Text style={styles.rowVal}>1.0.0</Text></View>
        </View>

        <Text style={styles.note}>Profil düzenleme yakında eklenecek.</Text>

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
  section: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: -8 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 4, borderWidth: 1, borderColor: Colors.borderLight },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 14, color: Colors.textSecondary },
  rowVal: { fontSize: 14, fontWeight: '600', color: Colors.primary, flexShrink: 1, marginLeft: 12, textAlign: 'right' },
  note: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  logoutBtn: { borderWidth: 1.5, borderColor: Colors.danger, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
