import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Colors } from '../../constants';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const MENU = [
  { label: 'Randevularım', screen: 'Appointments' },
  { label: 'Mesajlarım', screen: 'Messages' },
  { label: 'Değerlendirmelerim', screen: 'MyReviews' },
  { label: 'Bildirimler', screen: 'Notifications' },
  { label: 'Ayarlar', screen: 'Settings' },
];

export default function ProfileScreen({ navigation }: any) {
  const { profile } = useAuth();
  const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';
  const initials = fullName ? fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'K';
  const isBarber = profile?.role === 'barber';

  async function handleLogout() {
    Alert.alert('Çıkış', 'Çıkış yapmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => logout() },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.initials}>{initials}</Text>
          </View>
          <Text style={styles.name}>{fullName || 'Kullanıcı'}</Text>
          <Text style={styles.email}>{profile?.email ?? ''}</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>{isBarber ? 'Berber Hesabı' : 'Müşteri Hesabı'}</Text></View>
        </View>
        <View style={styles.menuSection}>
          {MENU.map(m => (
            <TouchableOpacity key={m.label} style={styles.menuItem} onPress={() => m.screen && navigation.navigate(m.screen)}>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuLabel, { color: Colors.danger }]}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', padding: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  initials: { fontSize: 28, fontWeight: '800', color: '#020000' },
  name: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { backgroundColor: '#FFF9D9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  badgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  menuSection: { backgroundColor: Colors.surface, margin: 16, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.primary },
  menuArrow: { color: Colors.textMuted, fontSize: 18 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
});
