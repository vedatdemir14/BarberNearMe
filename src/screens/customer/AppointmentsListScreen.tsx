import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerAppointments, updateAppointmentStatus, Appointment } from '../../services/appointmentService';
import { getBarber } from '../../services/barberService';

const TABS = ['Yaklaşan', 'Geçmiş', 'İptal'];
const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

// Randevuya en az bu kadar kalmışsa iptal edilebilir
const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 saat

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AppointmentsListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) { setLoading(false); return; }
      setLoading(true);
      getCustomerAppointments(user.uid)
        .then(async data => {
          if (!active) return;
          setAppts(data);
          // Resolve shop names for the barbers referenced by these appointments
          const ids = [...new Set(data.map(a => a.barberId))];
          const entries = await Promise.all(
            ids.map(async id => [id, (await getBarber(id).catch(() => null))?.shopName ?? 'Berber'] as const)
          );
          if (active) setShopNames(Object.fromEntries(entries));
        })
        .catch(() => { if (active) setAppts([]); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [user])
  );

  function handleCancel(item: Appointment) {
    const msLeft = item.date.toDate().getTime() - Date.now();
    if (msLeft < CANCEL_WINDOW_MS) {
      Alert.alert('İptal edilemez', 'Randevuya 2 saatten az kaldığı için iptal edilemez.');
      return;
    }
    Alert.alert('Randevuyu iptal et', 'Bu randevuyu iptal etmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'İptal Et',
        style: 'destructive',
        onPress: async () => {
          try {
            await updateAppointmentStatus(item.id, 'cancelled');
            // Anlık güncelle: listede durumu cancelled yap
            setAppts(prev => prev.map(a => (a.id === item.id ? { ...a, status: 'cancelled' } : a)));
          } catch (e: any) {
            Alert.alert('Hata', friendlyError(e, 'Randevu iptal edilemedi.'));
          }
        },
      },
    ]);
  }

  const now = Date.now();
  const filtered = appts.filter(a => {
    const isPast = a.date.toDate().getTime() < now;
    if (tab === 2) return a.status === 'cancelled';
    if (tab === 1) return a.status !== 'cancelled' && (a.status === 'completed' || isPast);
    return a.status !== 'cancelled' && a.status !== 'completed' && !isPast;
  });

  const badgeStyle = (s: string) => s === 'confirmed'
    ? { bg: '#dbeafe', text: '#1d4ed8', label: 'Onaylandı' }
    : s === 'completed'
    ? { bg: '#dcfce7', text: '#16a34a', label: 'Tamamlandı' }
    : s === 'cancelled'
    ? { bg: '#f3f4f6', text: '#6b7280', label: 'İptal' }
    : { bg: '#fef3c7', text: '#b45309', label: 'Onay Bekliyor' };

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
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const badge = badgeStyle(item.status);
            return (
              <View style={styles.card}>
                <View style={styles.icon}><Text style={{ fontSize: 18, color: Colors.primary }}>✂</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.shopName}>{shopNames[item.barberId] ?? 'Berber'}</Text>
                  <Text style={styles.sub}>{item.serviceName} · {item.staffName}</Text>
                  <Text style={styles.date}>{formatDate(item.date.toDate())} · {item.timeSlot}</Text>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                  {item.status === 'completed' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Rating', { appointmentId: item.id })}>
                      <Text style={styles.rateLink}>Değerlendir →</Text>
                    </TouchableOpacity>
                  )}
                  {(item.status === 'pending' || item.status === 'confirmed') &&
                    item.date.toDate().getTime() > now && (
                      <TouchableOpacity style={styles.actionBtn} onPress={() => handleCancel(item)}>
                        <Text style={styles.cancelLink}>İptal Et</Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.empty}>Randevu bulunamadı.</Text>}
        />
      )}
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
  icon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  sub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, color: Colors.secondary, fontWeight: '600', marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginTop: 6 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionBtn: { alignSelf: 'flex-end', marginTop: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: Colors.borderLight },
  rateLink: { color: Colors.secondary, fontSize: 12, fontWeight: '700' },
  cancelLink: { color: Colors.danger, fontSize: 12, fontWeight: '700' },
  empty: { textAlign: 'center', color: Colors.textMuted, marginTop: 40 },
});
