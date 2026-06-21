import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { logout } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const MENU: { label: string; screen: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Randevularım', screen: 'Appointments', icon: 'calendar-outline' },
  { label: 'Mesajlarım', screen: 'Messages', icon: 'chatbubble-ellipses-outline' },
  { label: 'Değerlendirmelerim', screen: 'MyReviews', icon: 'star-outline' },
  { label: 'Bildirimler', screen: 'Notifications', icon: 'notifications-outline' },
  { label: 'Ayarlar', screen: 'Settings', icon: 'settings-outline' },
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
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
          <Text style={styles.name}>{fullName || 'Kullanıcı'}</Text>
          {!!profile?.email && <Text style={styles.email}>{profile.email}</Text>}
          <View style={styles.badge}>
            <Ionicons name={isBarber ? 'cut' : 'person'} size={12} color={Colors.primary} />
            <Text style={styles.badgeText}>{isBarber ? 'Berber Hesabı' : 'Müşteri Hesabı'}</Text>
          </View>
        </View>

        {/* Menü */}
        <Text style={styles.section}>Hesabım</Text>
        <View style={styles.card}>
          {MENU.map((m, i) => (
            <TouchableOpacity
              key={m.label}
              style={[styles.menuItem, i < MENU.length - 1 && styles.menuBorder]}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(m.screen)}
            >
              <View style={styles.iconChip}><Ionicons name={m.icon} size={19} color={Colors.primary} /></View>
              <Text style={styles.menuLabel}>{m.label}</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Çıkış */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={19} color={Colors.danger} />
          <Text style={styles.logoutText}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  initials: { fontSize: 30, fontWeight: '800', color: '#020000' },
  name: { fontSize: 21, fontWeight: '800', color: Colors.primary },
  email: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF7DE', borderWidth: 1, borderColor: Colors.secondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, marginTop: 12 },
  badgeText: { fontSize: 12, color: Colors.primary, fontWeight: '700' },

  section: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginTop: 22, marginBottom: 8, marginHorizontal: 20 },
  card: { backgroundColor: Colors.surface, marginHorizontal: 16, borderRadius: 16, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 15 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  iconChip: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#FFF7DE', alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.primary },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 16, marginTop: 22, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.danger },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.danger },
});
