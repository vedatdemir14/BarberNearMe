import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors, DAYS_TR } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getBarber, BarberShop, Service, StaffMember } from '../../services/barberService';
import { createAppointment, getBookedSlots, BookedSlot } from '../../services/appointmentService';

type Props = NativeStackScreenProps<RootStackParamList, 'Appointment'>;

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

const FALLBACK_SERVICES: Service[] = [
  { id: 's1', name: 'Saç Kesimi', price: 500, durationMin: 30 },
  { id: 's2', name: 'Sakal Düzeltme', price: 350, durationMin: 20 },
  { id: 's3', name: 'Full Tıraş', price: 400, durationMin: 45 },
];
const FALLBACK_STAFF: StaffMember[] = [{ id: 'st1', name: 'Engyal T.', title: 'Berber' }];
const FALLBACK_HOURS = { openTime: '09:00', closeTime: '21:00', slotDurationMin: 30 };

// Generate "HH:MM" slots between open and close times
function genSlots(open: string, close: string, stepMin: number): string[] {
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  const end = ch * 60 + cm;
  const out: string[] = [];
  for (let t = oh * 60 + om; t < end; t += stepMin) {
    out.push(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`);
  }
  return out;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "HH:MM" -> dakika
function toMin(s: string) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

export default function AppointmentScreen({ navigation, route }: Props) {
  const { barberId } = route.params;
  const { user, profile } = useAuth();

  const [barber, setBarber] = useState<BarberShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  const [selectedSvc, setSelectedSvc] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);

  useEffect(() => {
    let active = true;
    getBarber(barberId)
      .then(b => { if (active) setBarber(b); })
      .catch(() => { /* fallback below */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [barberId]);

  const services = barber?.services?.length ? barber.services : FALLBACK_SERVICES;
  const staff = barber?.staff?.length ? barber.staff : FALLBACK_STAFF;
  const hours = barber?.workingHours ?? FALLBACK_HOURS;

  const slots = useMemo(
    () => genSlots(hours.openTime, hours.closeTime, hours.slotDurationMin),
    [hours.openTime, hours.closeTime, hours.slotDurationMin]
  );

  // Fetch already-booked slots whenever the selected day changes
  useEffect(() => {
    let active = true;
    setSelectedTime(null);
    getBookedSlots(barberId, selectedDate)
      .then(s => { if (active) setBookedSlots(s); })
      .catch(() => { if (active) setBookedSlots([]); });
    return () => { active = false; };
  }, [barberId, selectedDate]);

  // Current month calendar grid
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-based offset

  async function handleBook() {
    if (!user) { Alert.alert('Giriş gerekli', 'Randevu almak için giriş yapın.'); return; }
    if (!selectedTime) { Alert.alert('Saat seçin', 'Lütfen bir saat seçin.'); return; }

    const svc = services[selectedSvc];
    const stf = staff[selectedStaff];
    const [h, m] = selectedTime.split(':').map(Number);
    const date = new Date(selectedDate);
    date.setHours(h, m, 0, 0);

    if (date.getTime() < Date.now()) { Alert.alert('Geçmiş saat', 'Geçmiş bir saate randevu alınamaz.'); return; }

    setBooking(true);
    try {
      const id = await createAppointment({
        customerId: user.uid,
        barberId,
        staffId: stf.id,
        staffName: stf.name,
        serviceId: svc.id,
        serviceName: svc.name,
        servicePrice: svc.price,
        date: Timestamp.fromDate(date),
        timeSlot: selectedTime,
        durationMin: svc.durationMin,
        status: 'pending',
      });
      navigation.navigate('AppointmentConfirm', { appointmentId: id });
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Randevu oluşturulamadı.');
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const svc = services[selectedSvc];
  const stf = staff[selectedStaff];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <View><Text style={styles.headerTitle}>Randevu Al</Text><Text style={styles.headerSub}>{barber?.shopName ?? 'Berber'}</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Service */}
        <Text style={styles.sectionTitle}>Hizmet Seç</Text>
        {services.map((s, i) => (
          <TouchableOpacity key={s.id} style={[styles.serviceCard, selectedSvc === i && styles.serviceCardActive]} onPress={() => { setSelectedSvc(i); setSelectedTime(null); }}>
            <View><Text style={styles.serviceName}>{s.name}</Text><Text style={styles.serviceSub}>~{s.durationMin} dk</Text></View>
            <Text style={styles.servicePrice}>₺{s.price}</Text>
          </TouchableOpacity>
        ))}

        {/* Staff */}
        <Text style={styles.sectionTitle}>Berber Seç</Text>
        <View style={styles.staffRow}>
          {staff.map((s, i) => {
            const sel = selectedStaff === i;
            return (
              <TouchableOpacity key={s.id} style={[styles.staffCard, sel && styles.staffCardActive]} onPress={() => setSelectedStaff(i)}>
                <View style={styles.staffAvatar}><Text style={{ fontSize: 18 }}>✂</Text></View>
                <Text style={[styles.staffCardName, sel && { color: '#fff' }]} numberOfLines={1}>{s.name}</Text>
                {!!s.title && <Text style={[styles.staffCardTitle, sel && { color: '#dbe4ff' }]} numberOfLines={1}>{s.title}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Tarih Seç — {MONTHS_TR[month]} {year}</Text>
        <View style={styles.calGrid}>
          {DAYS_TR.map(d => <Text key={d} style={styles.calHeader}>{d}</Text>)}
          {[...Array(firstWeekday)].map((_, i) => <View key={'e' + i} style={styles.calDay} />)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const date = new Date(year, month, day);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isSel = sameDay(selectedDate, date);
            return (
              <TouchableOpacity key={day} disabled={isPast}
                style={[styles.calDay, isSel && styles.calDaySelected]}
                onPress={() => setSelectedDate(date)}>
                <Text style={[styles.calDayText, isPast && { color: Colors.textMuted, opacity: 0.4 }, isSel && { color: '#fff' }]}>{day}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Time */}
        <Text style={styles.sectionTitle}>Saat Seç <Text style={styles.durationHint}>· seçilen hizmet ~{services[selectedSvc]?.durationMin ?? 30} dk</Text></Text>
        <View style={styles.timeGrid}>
          {(() => {
            const svcDur = services[selectedSvc]?.durationMin ?? 30;
            const closeMin = toMin(hours.closeTime);
            const ranges = bookedSlots.map(b => [toMin(b.timeSlot), toMin(b.timeSlot) + b.durationMin] as const);
            return slots.map(t => {
              const [h, m] = t.split(':').map(Number);
              const slotDate = new Date(selectedDate); slotDate.setHours(h, m, 0, 0);
              const start = toMin(t);
              const end = start + svcDur;
              // Süre boyunca başka randevuyla çakışıyor mu / kapanışı aşıyor mu / geçmiş mi
              const overlaps = ranges.some(([bs, be]) => start < be && end > bs);
              const unavail = slotDate.getTime() < Date.now() || end > closeMin || overlaps;
              const isSel = selectedTime === t;
              return (
                <TouchableOpacity key={t} disabled={unavail}
                  style={[styles.timeSlot, unavail && styles.timeUnavail, isSel && styles.timeSelected]}
                  onPress={() => setSelectedTime(t)}>
                  <Text style={[styles.timeText, unavail && { color: '#ccc' }, isSel && { color: '#fff' }]}>{t}</Text>
                </TouchableOpacity>
              );
            });
          })()}
        </View>

        {/* Summary */}
        <Text style={styles.sectionTitle}>Özet</Text>
        <View style={styles.summaryCard}>
          {[
            ['Hizmet', svc.name],
            ['Berber', stf.name],
            ['Tarih', `${selectedDate.getDate()} ${MONTHS_TR[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`],
            ['Saat', selectedTime ?? '—'],
          ].map(([l, v]) => (
            <View key={l} style={styles.summaryRow}><Text style={styles.summaryLabel}>{l}</Text><Text style={styles.summaryVal}>{v}</Text></View>
          ))}
          <View style={[styles.summaryRow, { borderTopWidth: 1.5, borderTopColor: Colors.border, marginTop: 8, paddingTop: 8 }]}>
            <Text style={[styles.summaryLabel, { fontWeight: '700', fontSize: 15 }]}>Toplam</Text>
            <Text style={[styles.summaryVal, { fontSize: 15 }]}>₺{svc.price}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.btnPrimary, booking && { opacity: 0.6 }]} onPress={handleBook} disabled={booking}>
          {booking ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Randevu Oluştur →</Text>}
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
  durationHint: { fontSize: 12, fontWeight: '500', color: Colors.textSecondary },
  staffRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  staffCard: { width: '31%', alignItems: 'center', paddingVertical: 12, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, backgroundColor: Colors.surface, gap: 5 },
  staffCardActive: { borderColor: Colors.secondary, backgroundColor: Colors.secondary },
  staffAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#e8e0ff', alignItems: 'center', justifyContent: 'center' },
  staffCardName: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  staffCardTitle: { fontSize: 10, color: Colors.textSecondary },
  serviceCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border },
  serviceCardActive: { borderColor: Colors.secondary, backgroundColor: '#eff6ff' },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  serviceSub: { fontSize: 12, color: Colors.textSecondary },
  servicePrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  staffChip: { paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, alignItems: 'center' },
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
