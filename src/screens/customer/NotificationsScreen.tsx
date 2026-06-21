import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerAppointments, getBarberAppointments, Appointment, AppointmentStatus } from '../../services/appointmentService';
import { getBarber } from '../../services/barberService';

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDateTime(at: any, timeSlot?: string): string {
  const d = at?.toDate?.();
  if (!d) return '';
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]}${timeSlot ? ' • ' + timeSlot : ''}`;
}

interface Notif {
  id: string;
  icon: string;
  color: string;
  title: string;
  body: string;
}

// Müşteri için randevu durumundan bildirim üret
function customerNotif(a: Appointment, shop: string): Notif {
  const when = formatDateTime(a.date, a.timeSlot);
  const map: Record<AppointmentStatus, Omit<Notif, 'id'>> = {
    pending:   { icon: '⏳', color: Colors.warning, title: 'Randevu talebin alındı', body: `${shop} — ${when} için berber onayı bekleniyor.` },
    confirmed: { icon: '✅', color: Colors.accent,  title: 'Randevun onaylandı', body: `${shop} — ${when} randevun onaylandı.` },
    cancelled: { icon: '❌', color: Colors.danger,  title: 'Randevun iptal edildi', body: `${shop} — ${when} randevun iptal edildi.` },
    completed: { icon: '🎉', color: Colors.primary, title: 'Randevun tamamlandı', body: `${shop} — değerlendirmeyi unutma!` },
  };
  return { id: a.id, ...map[a.status] };
}

// Berber için randevu durumundan bildirim üret
function barberNotif(a: Appointment): Notif {
  const when = formatDateTime(a.date, a.timeSlot);
  const map: Record<AppointmentStatus, Omit<Notif, 'id'>> = {
    pending:   { icon: '✂️', color: Colors.warning, title: 'Yeni randevu talebi', body: `${a.serviceName} — ${when}. Onayını bekliyor.` },
    confirmed: { icon: '✅', color: Colors.accent,  title: 'Randevu onaylandı', body: `${a.serviceName} — ${when}.` },
    cancelled: { icon: '❌', color: Colors.danger,  title: 'Randevu iptal edildi', body: `${a.serviceName} — ${when}.` },
    completed: { icon: '🎉', color: Colors.primary, title: 'Randevu tamamlandı', body: `${a.serviceName} — ${when}.` },
  };
  return { id: a.id, ...map[a.status] };
}

export default function NotificationsScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) { setLoading(false); return; }
      setLoading(true);

      const isBarber = profile?.role === 'barber';
      const load = async () => {
        if (isBarber) {
          const appts = await getBarberAppointments(user.uid);
          return appts.map(barberNotif);
        }
        const appts = await getCustomerAppointments(user.uid);
        const ids = [...new Set(appts.map(a => a.barberId))];
        const names = Object.fromEntries(
          await Promise.all(ids.map(async id => [id, (await getBarber(id).catch(() => null))?.shopName ?? 'Berber'] as const))
        );
        return appts.map(a => customerNotif(a, names[a.barberId] ?? 'Berber'));
      };

      load()
        .then(list => { if (active) setItems(list); })
        .catch(() => { if (active) setItems([]); })
        .finally(() => { if (active) setLoading(false); });

      return () => { active = false; };
    }, [user, profile])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Bildirimler</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={[styles.iconWrap, { backgroundColor: item.color + '22' }]}>
                <Text style={{ fontSize: 18 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardBody}>{item.body}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 32, color: Colors.secondary }}>◎</Text>
              <Text style={styles.emptyText}>Henüz bildirimin yok.</Text>
              <Text style={styles.emptyHint}>Randevu hareketlerin (talep, onay, iptal, tamamlandı) burada görünecek.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.borderLight },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  cardBody: { fontSize: 12, color: Colors.textSecondary, marginTop: 2, lineHeight: 17 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 10, marginTop: 80 },
  emptyText: { fontSize: 17, fontWeight: '700', color: Colors.primary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 19 },
});
