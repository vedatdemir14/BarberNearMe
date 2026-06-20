import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getBarber, BarberShop } from '../../services/barberService';
import { getBarberAppointments, Appointment } from '../../services/appointmentService';
import { useNavigation } from '@react-navigation/native';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Bekliyor',  bg: '#fef9c3', color: '#854d0e' },
    confirmed: { label: 'Onaylandı', bg: '#dcfce7', color: '#166534' },
    completed: { label: 'Tamamlandı',bg: '#e0e7ff', color: '#3730a3' },
    cancelled: { label: 'İptal',     bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function BarberDashboardScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [shop, setShop]           = useState<BarberShop | null>(null);
  const [appointments, setAppts]  = useState<Appointment[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!user) return;
    try {
      const [s, a] = await Promise.all([
        getBarber(user.uid),
        getBarberAppointments(user.uid),
      ]);
      setShop(s);
      setAppts(a);
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, [user]);

  const pending   = appointments.filter(a => a.status === 'pending');
  const today     = appointments.filter(a => {
    const d = (a.date as any)?.toDate?.();
    if (!d) return false;
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const walletBalance = (shop as any)?.walletBalance ?? 0;
  const totalEarnings = appointments
    .filter(a => a.status === 'completed')
    .reduce((sum, a) => sum + (a.kaporaAmount ?? 0), 0);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hoş geldin 👋</Text>
            <Text style={styles.shopName}>{shop?.shopName ?? 'Dükkanım'}</Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: shop?.isActive ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: shop?.isActive ? '#166534' : '#991b1b' }}>
              {shop?.isActive ? '● Açık' : '● Kapalı'}
            </Text>
          </View>
        </View>

        {/* Cüzdan kartı */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Cüzdan Bakiyesi</Text>
          <Text style={styles.walletAmount}>₺{walletBalance.toLocaleString('tr-TR')}</Text>
          <Text style={styles.walletSub}>Toplam kapora geliri: ₺{totalEarnings.toLocaleString('tr-TR')}</Text>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsRow}>
          {[
            { label: 'Bugün', value: today.length, icon: '📅' },
            { label: 'Bekleyen', value: pending.length, icon: '⏳' },
            { label: 'Toplam', value: appointments.length, icon: '📊' },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bekleyen randevular */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⏳ Onay Bekleyen ({pending.length})</Text>
            {pending.slice(0, 3).map(a => (
              <AppointmentCard key={a.id} appt={a} onPress={() => navigation.navigate('BarberAppointments')} />
            ))}
            {pending.length > 3 && (
              <TouchableOpacity onPress={() => navigation.navigate('BarberAppointments')}>
                <Text style={styles.showMore}>Tümünü Gör ({pending.length}) →</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bugünkü randevular */}
        {today.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📅 Bugünün Randevuları</Text>
            {today.map(a => (
              <AppointmentCard key={a.id} appt={a} onPress={() => navigation.navigate('BarberAppointments')} />
            ))}
          </>
        )}

        {appointments.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 32 }}>✂️</Text>
            <Text style={styles.emptyText}>Henüz randevu yok</Text>
            <Text style={styles.emptySub}>Müşteriler randevu aldığında burada görünecek</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function AppointmentCard({ appt, onPress }: { appt: Appointment; onPress: () => void }) {
  const date = (appt.date as any)?.toDate?.();
  const dateStr = date
    ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
    : '—';

  return (
    <TouchableOpacity style={styles.apptCard} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={styles.apptService}>{appt.serviceId}</Text>
        <Text style={styles.apptMeta}>📅 {dateStr}  🕐 {appt.timeSlot}</Text>
        {appt.kaporaAmount ? (
          <Text style={styles.apptKapora}>Kapora: ₺{appt.kaporaAmount}</Text>
        ) : null}
      </View>
      <StatusBadge status={appt.status} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  scroll:      { padding: 16, gap: 14 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:    { fontSize: 13, color: Colors.textSecondary },
  shopName:    { fontSize: 22, fontWeight: '800', color: Colors.primary },
  activeBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },

  walletCard:   { backgroundColor: Colors.primary, borderRadius: 16, padding: 20 },
  walletLabel:  { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  walletAmount: { fontSize: 36, fontWeight: '900', color: '#fff' },
  walletSub:    { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  statsRow:  { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  statIcon:  { fontSize: 20, marginBottom: 4 },
  statVal:   { fontSize: 22, fontWeight: '800', color: Colors.primary },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  apptCard:    { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
  apptService: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  apptMeta:    { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  apptKapora:  { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 2 },

  showMore:  { textAlign: 'center', color: Colors.secondary, fontWeight: '600', fontSize: 13, paddingVertical: 6 },
  emptyBox:  { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptySub:  { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
});
