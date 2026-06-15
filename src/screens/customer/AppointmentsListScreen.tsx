import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Colors } from '../../constants';

const TABS = ['Yaklaşan', 'Geçmiş', 'İptal'];
const MOCK = [
  { id: '1', shop: "Sirat's Barber Shop", service: 'Saç Kesimi', staff: 'Engyal Taskiran', date: '14 Mayıs 2025', time: '10:30', status: 'confirmed', past: false },
  { id: '2', shop: "Brian's Barber", service: 'Sakal Düzeltme', staff: 'Volkan B.', date: '2 Nisan 2025', time: '14:00', status: 'completed', past: true },
];

export default function AppointmentsListScreen({ navigation }: any) {
  const [tab, setTab] = useState(0);
  const filtered = MOCK.filter(a => tab === 0 ? !a.past : tab === 1 ? a.past : false);

  const badgeStyle = (s: string) => s === 'confirmed'
    ? { bg: '#dbeafe', text: '#1d4ed8', label: 'Onaylandı' }
    : s === 'completed'
    ? { bg: '#dcfce7', text: '#16a34a', label: 'Tamamlandı' }
    : { bg: '#f3f4f6', text: '#6b7280', label: 'İptal' };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Randevularım</Text></View>
      <View style={styles.tabRow}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabActive]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={i => i.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => {
          const badge = badgeStyle(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.icon}><Text style={{ fontSize: 22 }}>💈</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.shopName}>{item.shop}</Text>
                <Text style={styles.sub}>{item.service} · {item.staff}</Text>
                <Text style={styles.date}>📅 {item.date} · {item.time}</Text>
                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                </View>
                {item.status === 'completed' && (
                  <TouchableOpacity onPress={() => (navigation as any).navigate('Rating', { appointmentId: item.id })}>
                    <Text style={styles.rateLink}>Değerlendir →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>Randevu bulunamadı.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.secondary },
  tabText: { fontSize: 13, color: Colors.textSecondary },
  tabTextActive: { color: Colors.secondary, fontWeight: '700' },
  card: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderLight },
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: Colors.secondary, fontWeight: '600', marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  rateLink: { color: Colors.secondary, fontSize: 12, marginTop: 6, fontWeight: '600' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
