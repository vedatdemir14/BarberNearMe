import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';

type Props = NativeStackScreenProps<RootStackParamList, 'Appointment'>;

const SERVICES = [
  { id: 's1', name: 'Saç Kesimi', price: 500, durationMin: 30 },
  { id: 's2', name: 'Sakal Düzeltme', price: 350, durationMin: 20 },
  { id: 's3', name: 'Full Tıraş', price: 400, durationMin: 45 },
];
const DAYS = ['Pzt','Sal','Çrş','Prş','Cum','Cmt','Paz'];
const TIMES = ['09:00','09:30','10:00','10:30','11:00','11:30','13:00','14:00','14:30','15:00','15:30','16:00'];
const UNAVAILABLE = ['09:00','09:30','13:00'];

export default function AppointmentScreen({ navigation }: Props) {
  const [selectedSvc, setSelectedSvc] = useState(0);
  const [selectedDay, setSelectedDay] = useState(13);
  const [selectedTime, setSelectedTime] = useState('10:30');

  function handleBook() {
    if (!selectedTime) { Alert.alert('Saat seçin'); return; }
    const svc = SERVICES[selectedSvc];
    navigation.navigate('Payment', {
      barberId:     (route.params as any)?.barberId ?? 'barber_001',
      barberName:   'Sirat\'s Barber Shop',
      serviceName:  svc.name,
      servicePrice: svc.price,
      serviceId:    svc.id,
      date:         `${selectedDay} Mayıs 2025`,
      timeSlot:     selectedTime,
      staffName:    'Engyal T.',
      staffId:      'st1',
    });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Randevu Al</Text><Text style={styles.headerSub}>Sirat's Barber Shop</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Service */}
        <Text style={styles.sectionTitle}>Hizmet Seç</Text>
        {SERVICES.map((s, i) => (
          <TouchableOpacity key={s.id} style={[styles.serviceCard, selectedSvc === i && styles.serviceCardActive]} onPress={() => setSelectedSvc(i)}>
            <View><Text style={styles.serviceName}>{s.name}</Text><Text style={styles.serviceSub}>~{s.durationMin} dk</Text></View>
            <Text style={styles.servicePrice}>₺{s.price}</Text>
          </TouchableOpacity>
        ))}

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Tarih Seç — Mayıs 2025</Text>
        <View style={styles.calGrid}>
          {DAYS.map(d => <Text key={d} style={styles.calHeader}>{d}</Text>)}
          {[...Array(2)].map((_, i) => <View key={'e'+i} />)}
          {[...Array(31)].map((_, i) => {
            const day = i + 1;
            const isSel = selectedDay === day;
            return (
              <TouchableOpacity key={day} style={[styles.calDay, isSel && styles.calDaySelected]} onPress={() => setSelectedDay(day)}>
                <Text style={[styles.calDayText, isSel && { color: '#fff' }]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time */}
        <Text style={styles.sectionTitle}>Saat Seç</Text>
        <View style={styles.timeGrid}>
          {TIMES.map(t => {
            const unavail = UNAVAILABLE.includes(t);
            const isSel = selectedTime === t;
            return (
              <TouchableOpacity key={t} disabled={unavail}
                style={[styles.timeSlot, unavail && styles.timeUnavail, isSel && styles.timeSelected]}
                onPress={() => setSelectedTime(t)}>
                <Text style={[styles.timeText, unavail && { color: '#ccc' }, isSel && { color: '#fff' }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Özet</Text>
        <View style={styles.summaryCard}>
          {[['Hizmet', SERVICES[selectedSvc].name], ['Berber', 'Engyal T.'], ['Tarih', `${selectedDay} Mayıs 2025`], ['Saat', selectedTime]].map(([l, v]) => (
            <View key={l} style={styles.summaryRow}><Text style={styles.summaryLabel}>{l}</Text><Text style={styles.summaryVal}>{v}</Text></View>
          ))}
          <View style={[styles.summaryRow, { borderTopWidth: 1.5, borderTopColor: Colors.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: 15 }]}>Toplam</Text>
            <Text style={[styles.summaryVal, { fontSize: 15 }]}>₺{SERVICES[selectedSvc].price}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleBook}>
          <Text style={styles.btnText}>Randevu Oluştur →</Text>
        </TouchableOpacity>
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back: { fontSize: 22, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  headerSub: { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  serviceCardActive: { borderColor: Colors.secondary, backgroundColor: '#eff6ff' },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  serviceSub: { fontSize: 12, color: Colors.textSecondary },
  servicePrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  calHeader: { width: '13%', textAlign: 'center', fontSize: 10, fontWeight: '600', color: Colors.textMuted, paddingVertical: 4 },
  calDay: { width: '13%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  calDaySelected: { backgroundColor: Colors.secondary, borderRadius: 999 },
  calDayText: { fontSize: 12, color: Colors.text },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { width: '30%', paddingVertical: 10, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, alignItems: 'center' },
  timeSelected: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  timeUnavail: { backgroundColor: Colors.borderLight },
  timeText: { fontSize: 13, color: Colors.text },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  summaryLabel: { fontSize: 13, color: Colors.textSecondary },
  summaryVal: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
