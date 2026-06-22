import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import { getBarberAppointments, updateAppointmentStatus, Appointment } from '../../services/appointmentService';

const STATUS_FILTERS = ['Tümü', 'Bekleyen', 'Onaylı', 'Tamamlandı', 'İptal'];
const STATUS_MAP: Record<string, string> = {
  'Bekleyen': 'pending', 'Onaylı': 'confirmed',
  'Tamamlandı': 'completed', 'İptal': 'cancelled',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Bekliyor',   color: '#D97706' },
  confirmed: { label: 'Onaylandı',  color: '#16A34A' },
  completed: { label: 'Tamamlandı', color: '#2563EB' },
  cancelled: { label: 'İptal',      color: '#DC2626' },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_META[status] ?? { label: status, color: Colors.textMuted };
  return (
    <View style={styles.badge}>
      <View style={[styles.badgeDot, { backgroundColor: s.color }]} />
      <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
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
              await updateAppointmentStatus(appt.id, action, action === 'cancelled' ? 'barber' : undefined);
              setAppts(prev => prev.map(a => a.id === appt.id ? { ...a, status: action } : a));
            } catch (e: any) {
              Alert.alert('Hata', friendlyError(e));
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
            <Ionicons name="calendar-outline" size={34} color={Colors.textMuted} />
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
            <View style={[styles.card, { borderLeftWidth: 4, borderLeftColor: STATUS_META[a.status]?.color ?? Colors.border }]}>
              {/* Üst satır */}
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <View style={styles.customerRow}>
                    <Ionicons name="person-circle-outline" size={18} color={Colors.primary} />
                    <Text style={styles.customerName}>{a.customerName || 'Müşteri'}</Text>
                  </View>
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
                      <TouchableOpacity style={[styles.actionBtn, styles.confirmBtn]} onPress={() => handleAction(a, 'confirmed')}>
                        <Ionicons name="checkmark" size={16} color="#fff" />
                        <Text style={styles.confirmText}>Onayla</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => handleAction(a, 'cancelled')}>
                        <Ionicons name="close" size={16} color={Colors.danger} />
                        <Text style={styles.cancelText}>Reddet</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {a.status === 'confirmed' && (
                    <TouchableOpacity style={[styles.actionBtn, styles.completeBtn]} onPress={() => handleAction(a, 'completed')}>
                      <Ionicons name="checkmark-done" size={16} color="#fff" />
                      <Text style={styles.completeText}>Tamamlandı İşaretle</Text>
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
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  customerName:{ fontSize: 15, fontWeight: '800', color: Colors.primary },
  serviceName: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  meta:        { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  kapora:      { fontSize: 12, color: '#16a34a', fontWeight: '600', marginTop: 3 },
  price:       { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  badge:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badgeDot:    { width: 8, height: 8, borderRadius: 4 },
  badgeText:   { fontSize: 12, fontWeight: '700' },

  actions:     { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn:   { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 11, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  confirmBtn:  { backgroundColor: '#16A34A' },
  confirmText: { fontWeight: '700', color: '#fff', fontSize: 13 },
  cancelBtn:   { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.danger },
  cancelText:  { fontWeight: '700', color: Colors.danger, fontSize: 13 },
  completeBtn: { backgroundColor: Colors.primary },
  completeText:{ fontWeight: '700', color: '#fff', fontSize: 13 },

  empty:     { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, color: Colors.textSecondary },
});
