import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors, DAYS_TR } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getBarber, BarberShop, Service, StaffMember } from '../../services/barberService';
import { getBookedSlots } from '../../services/appointmentService';

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

export default function AppointmentScreen({ navigation, route }: Props) {
  const { barberId } = route.params;
  const { user, profile } = useAuth();

  const [barber, setBarber] = useState<BarberShop | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSvc, setSelectedSvc] = useState(0);
  const [selectedStaff, setSelectedStaff] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

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

    navigation.navigate('Payment', {
      barberId,
      barberName: barber?.shopName ?? 'Berber',
      serviceId: svc.id,
      serviceName: svc.name,
      servicePrice: svc.price,
      date: date.toISOString(),
      timeSlot: selectedTime,
      staffId: stf.id,
      staffName: stf.name,
    });
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
          <TouchableOpacity key={s.id} style={[styles.serviceCard, selectedSvc === i && styles.serviceCardActive]} onPress={() => setSelectedSvc(i)}>
            <View><Text style={styles.serviceName}>{s.name}</Text><Text style={styles.serviceSub}>~{s.durationMin} dk</Text></View>
            <Text style={styles.servicePrice}>₺{s.price}</Text>
          </TouchableOpacity>
        ))}

        {/* Staff */}
        <Text style={styles.sectionTitle}>Berber Seç</Text>
        <View style={styles.timeGrid}>
          {staff.map((s, i) => (
            <TouchableOpacity key={s.id} style={[styles.staffChip, selectedStaff === i && styles.timeSelected]} onPress={() => setSelectedStaff(i)}>
              <Text style={[styles.timeText, selectedStaff === i && { color: '#fff' }]}>{s.name}</Text>
            </TouchableOpacity>
          ))}
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
        