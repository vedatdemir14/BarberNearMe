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
     