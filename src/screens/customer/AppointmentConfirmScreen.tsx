import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { getAppointment, Appointment } from '../../services/appointmentService';
import { getBarber } from '../../services/barberService';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentConfirm'>;

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(d: Date) {
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AppointmentConfirmScreen({ navigation, route }: Props) {
  const { appointmentId } = route.params;
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [shopName, setShopName] = useState('Berber');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const a = await getAppointment(appointmentId);
        if (!active) return;
        setAppt(a);
        if (a) {
          const b = await getBarber(a.barberId).catch(() => null);
          if (active && b) setShopName(b.shopName);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [appointmentId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const rows: [string, string][] = appt
    ? [
        ['Berber', shopName],
        ['Çalışan', appt.staffName],
        ['Hizmet', appt.serviceName],
        ['Tarih', formatDate(appt.date.toDate())],
        ['Saat', appt.timeSlot],
        ['Ücret', `₺${appt.servicePrice}`],
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.checkCircle}><Text style={{ fontSize: 40 }}>✓</Text></View>
        <Text style={styles.title}>Randevu Oluşturuldu!</Text>
        <Text style={styles.sub}>Berberiniz onayladıktan sonra bildirim alacaksınız.</Text>
        <View style={styles.card}>
          {rows.map(([l, v]) => (
            <View key={l} style={styles.row}><Text style={styles.rowLabel}>{l}</Text><Text style={[styles.rowVal, l === 'Ücret' && { color: Colors.secondary }]}>{v}</Text></View>
          ))}
        </View>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('CustomerTabs', { screen: 'Appointments' } as any)}>
          <Text style={styles.btnText}>Randevularıma Git</Text>
        </TouchableOpacity>
        {appt && (
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Messaging', { barberId: appt.barberId, barberName: shopName })}>
            <Text style={styles.btnSecText}>Berberle Mesajlaş</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('CustomerTabs', { screen: 'Home' } as any)}>
          <Text style={styles.btnSecText}>Ana Sayfaya Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  inner: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: Colors.primary, textAlign: 'center' },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  card: { width: '100%', backgroundColor: '#f8f8ff', borderWidth: 1.5, borderColor: '#e0e0ff', borderRadius: 14, padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel: { fontSize: 12, color: Colors.textSecondary },
  rowVal: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  btnPrimary: { width: '100%', backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnSecondary: { width: '100%', borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnSecText: { fontSize: 14, color: Colors.primary },
});
