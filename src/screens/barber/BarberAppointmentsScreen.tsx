import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getBarberAppointments, updateAppointmentStatus, Appointment } from '../../services/appointmentService';

const STATUS_FILTERS = ['Tümü', 'Bekleyen', 'Onaylı', 'Tamamlandı', 'İptal'];
const STATUS_MAP: Record<string, string> = {
  'Bekleyen': 'pending', 'Onaylı': 'confirmed',
  'Tamamlandı': 'completed', 'İptal': 'cancelled',
};

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    pending:   { label: 'Bekliyor',   bg: '#fef9c3', color: '#854d0e' },
    confirmed: { label: 'Onaylandı',  bg: '#dcfce7', color: '#166534' },
    completed: { label: 'Tamamlandı', bg: '#e0e7ff', color: '#3730a3' },
    cancelled: { label: 'İptal',      bg: '#fee2e2', color: '#991b1b' },
  };
  const s = map[status] ?? { label: status, bg: '#f3f4f6', color: '#374151' };
  return (
    <View style={{ backgroundColor: s.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: s.color }}>{s.label}</Text>
    </View>
  );
}

export default function BarberAppointmentsScreen() {
  const { user } = useAuth();
  const [appointments, setAppts] = useState<Appointment[]>([]);
  const [filter, setFilter]      = useState('Tümü');
  const [loading, setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId]  = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getBarberAppointments(user.uid);
      setAppts(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = appointments.filter(a => {
    if (filter === 'Tümü') return true;
    return a.status === STATUS_MAP[filter];
  });

  async function handleAction(appt: Appointment, action: 'confirmed' | 'cancelled' | 'completed') {
    const labels: Record<string, string> = {
      confirmed: 'Onayla', cancelled: 'İptal Et', completed: 'Tamamlandı İşaretle',
    };
    Alert.alert(
      labels[action],
      `Bu randevuyu "${labels[action]}" yapmak istediğinize emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: labels[action], style: action === 'cancelled' ? 'destructive' : 'default',
          onPress: async () => {
            setActionId(appt.id);
            try {
              await updateAppointmentStatus(appt.id, action);
              setAppts(prev => prev.map(a => a.id === appt.id ? { ...a, status: action } : a));
            } catch (e: any) {
              Alert.alert('Hata', e.message);
            } finally { setActionId(null); }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerBar}>
        <Text style={styles.title}>Randevular</Text>
        <Text style={styles.count}>{appointments.length} toplam</Text>
      </View>

      {/* Filtre */}
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.chip, filter === item && styles.chipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.chipText, filter === item && styles.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filtered}
        keyExtractor={a => a.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 28 }}>📭</Text>
            <Text style={styles.emptyText}>Bu filtrede randevu yok</Text>
          </View>
        }
        renderItem={({ item: a }) => {
          const date = (a.date as any)?.toDate?.();
          const dateStr = date
            ? date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
            : '—';
          const isActing = actionId === a.id;

          return (
            <View style={styles.card}>
              {/* Üst satır */}
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.serviceName}>{a.serviceName || a.serviceId}</Text>
                  <Text style={styles.meta}>{a.staffName || '—'}</Text>
                  <Text style={styles.meta}>{dateStr}  {a.timeSlot}</Text>
                  {a.kaporaAmount ? (
                    <Text style={styles.kapora}>Kapora alındı: ₺{a.kaporaAmount}</Text>
                  ) : null}
                  {a.servicePrice ? (
                    <Text style={styles.price}>Toplam: ₺{a.servicePrice}</Text>
                  ) : null}
                </View>
                <StatusBadge status={a.status} />
              </View>

              {/* Aksiyonlar */}
              {isActing ? (
                <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />
              ) : (
                <View style={styles.actions}>
                  {a.status === 'pending' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.confirmBtn]}
                        onPress={() => handleAction(a, 'confirmed')}
                      >
                        <Text style={styles.confirmText}>✓ Onayla</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.cancelBtn]}
                        onPress={() => handleAction(a, 'cancelled')}
                      >
                        <Text style={styles.cancelText}>✕ Reddet</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {a.status === 'confirmed' && (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn]}
                      onPress={() => handleAction(a, 'completed')}
                    >
                      <Text style={styles.completeText}>✓ Tamamlandı İşaretle</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  headerBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  title:       { fontSize: 22, fontWeight: '800', color: Colors.primary },
  count:       { fontSize: 13, color: Colors.textSecondary },
  filterScroll:{ flexGrow: 0, marginBottom: 4 },
  chip:        { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipActive:  { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  chipText:    { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#020000' },

  card:        { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  cardTop:     { flexDirection: 'row', gap: 10 },
  serviceName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  meta:        { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  kapora:      { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 3 },
  price:       { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  actions:     { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn:   { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  confirmBtn:  { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  confirmText: { fontWeight: '700', color: '#166534', fontSize: 13 },
  cancelBtn:   { backgroundColor: '#fee2e2', borderWidth: 1, borderColor: '#fca5a5' },
  cancelText:  { fontWeight: '700', color: '#991b1b', fontSize: 13 },
  completeBtn: { backgroundColor: '#e0e7ff', borderWidth: 1, borderColor: '#a5b4fc' },
  completeText:{ fontWeight: '700', color: '#3730a3', fontSize: 13 },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
