import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getBarber, BarberShop } from '../../services/barberService';
import { getBarberAppointments, Appointment } from '../../services/appointmentService';
import { useNavigation } from '@react-navigation/native';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

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
  const [toggling, setToggling]   = useState(false);

  async function handleToggleOpen(val: boolean) {
    if (!user || toggling) return;
    setToggling(true);
    try {
      await updateDoc(doc(db, 'barbers', user.uid), { isActive: val });
      setShop(prev => prev ? { ...prev, isActive: val } : prev);
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e));
    } finally { setToggling(false); }
  }

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
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const hasServices = (shop?.services?.length ?? 0) > 0;
  const hasHours    = !!shop?.workingHours?.openTime;
  const setupComplete = hasServices && hasHours;

  // Kurulum tamamlanmamış (henüz hizmet/saat girilmemiş) → kurulum sihirbazı
  if (user && shop && !setupComplete) {
    const nextStep    = !hasServices ? 'BarberRegStep2' : !hasHours ? 'BarberRegStep3' : 'BarberRegStep4';
    const steps = [
      { label: 'Hesap oluşturuldu',     done: true },
      { label: 'Hizmet & çalışan ekle', done: hasServices },
      { label: 'Çalışma saatleri',      done: hasHours },
      { label: 'Dükkanı aç',            done: false },
    ];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <View style={{ flex: 1, padding: 28, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text style={{ fontSize: 48, color: Colors.secondary }}>✂</Text>
          <Text style={{ fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'center' }}>Dükkan Kurulumu</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Müşterilere görünmek için kurulumu tamamla.
          </Text>
          <View style={{ width: '100%', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: Colors.borderLight }}>
            {steps.map(s => (
              <View key={s.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 14, color: s.done ? Colors.secondary : Colors.border }}>{s.done ? '●' : '○'}</Text>
                <Text style={{ fontSize: 14, color: s.done ? Colors.textSecondary : Colors.primary, fontWeight: s.done ? '400' : '700' }}>{s.label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={{ backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40 }}
            onPress={() => navigation.navigate(nextStep, { uid: user.uid })}
          >
            <Text style={{ color: '#020000', fontSize: 16, fontWeight: '700' }}>Devam Et →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
            <Text style={styles.greeting}>Hoş geldin</Text>
            <Text style={styles.shopName}>{shop?.shopName ?? 'Dükkanım'}</Text>
          </View>
          <View style={[styles.activeBadge, { backgroundColor: shop?.isActive ? '#dcfce7' : '#fee2e2' }]}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: shop?.isActive ? '#166534' : '#991b1b' }}>
              {shop?.isActive ? '● Açık' : '● Kapalı'}
            </Text>
          </View>
        </View>

        {/* Dükkan kapalı uyarısı + aç/kapa */}
        {!shop?.isActive && (
          <View style={styles.closedBanner}>
            <View style={styles.closedRow}>
              <Ionicons name="moon" size={20} color="#991b1b" />
              <View style={{ flex: 1 }}>
                <Text style={styles.closedTitle}>Dükkanınız kapalı</Text>
                <Text style={styles.closedSub}>Müşteriler sizi göremez ve randevu alamaz.</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.openBtn, toggling && { opacity: 0.6 }]}
              onPress={() => handleToggleOpen(true)}
              disabled={toggling}
            >
              <Ionicons name="storefront" size={16} color="#020000" />
              <Text style={styles.openBtnText}>Dükkanı Aç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hızlı aç/kapa */}
        {shop?.isActive && (
          <View style={styles.quickToggle}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
              <Text style={styles.quickToggleText}>Dükkan açık — randevu kabul ediliyor</Text>
            </View>
            <Switch
              value={!!shop?.isActive}
              onValueChange={handleToggleOpen}
              disabled={toggling}
              trackColor={{ false: Colors.border, true: '#22c55e' }}
              thumbColor="#fff"
            />
          </View>
        )}

        {/* Cüzdan kartı */}
        <View style={styles.walletCard}>
          <Text style={styles.walletLabel}>Cüzdan Bakiyesi (toplam kapora geliri)</Text>
          <Text style={styles.walletAmount}>₺{walletBalance.toLocaleString('tr-TR')}</Text>
          <Text style={styles.walletSub}>{appointments.length} randevu · {completedCount} tamamlandı</Text>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsRow}>
          {[
            { label: 'Bugün', value: today.length },
            { label: 'Bekleyen', value: pending.length },
            { label: 'Toplam', value: appointments.length },
          ].map(s => (
            <View key={s.label} style={styles.statCard}>
              <Text style={styles.statVal}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bekleyen randevular */}
        {pending.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Onay Bekleyen ({pending.length})</Text>
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
            <Text style={styles.sectionTitle}>Bugünün Randevuları</Text>
            {today.map(a => (
              <AppointmentCard key={a.id} appt={a} onPress={() => navigation.navigate('BarberAppointments')} />
            ))}
          </>
        )}

        {appointments.length === 0 && (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 28, color: Colors.secondary }}>✂</Text>
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
        <Text style={styles.apptService}>{appt.serviceName ?? appt.serviceId}</Text>
        <Text style={styles.apptMeta}>{dateStr}  {appt.timeSlot}</Text>
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

  closedBanner: { backgroundColor: '#fef2f2', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#fecaca', gap: 12 },
  closedRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  closedTitle:  { fontSize: 15, fontWeight: '800', color: '#991b1b' },
  closedSub:    { fontSize: 12, color: '#b91c1c', marginTop: 1 },
  openBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.secondary, borderRadius: 12, paddingVertical: 13 },
  openBtnText:  { fontSize: 15, fontWeight: '800', color: '#020000' },

  quickToggle:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  quickToggleText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  dot:          { width: 9, height: 9, borderRadius: 5 },

  walletCard:   { backgroundColor: Colors.secondary, borderRadius: 16, padding: 20 },
  walletLabel:  { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 4 },
  walletAmount: { fontSize: 36, fontWeight: '900', color: '#020000' },
  walletSub:    { fontSize: 12, color: 'rgba(0,0,0,0.5)', marginTop: 6 },

  statsRow:  { flexDirection: 'row', gap: 10 },
  statCard:  { flex: 1, backgroundColor: Colors.surface, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.borderLight },
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
