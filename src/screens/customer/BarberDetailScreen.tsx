import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { getBarber, BarberShop } from '../../services/barberService';
import { getBarberReviews, Review } from '../../services/reviewService';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberDetail'>;

// Fallback used when the barber doc cannot be loaded (e.g. offline / mock data)
const MOCK: Partial<BarberShop> & { services: any[]; staff: any[] } = {
  shopName: "Sirat's Barber Shop",
  rating: 4.9, reviewCount: 128,
  neighborhood: 'Kadıköy',
  workingHours: { days: [0,1,2,3,4,5], openTime: '09:00', closeTime: '21:00', slotDurationMin: 30 },
  services: [
    { id: 's1', name: 'Saç Kesimi', price: 500, durationMin: 30 },
    { id: 's2', name: 'Sakal Düzeltme', price: 350, durationMin: 20 },
    { id: 's3', name: 'Full Tıraş', price: 400, durationMin: 45 },
    { id: 's4', name: 'Saç + Sakal', price: 750, durationMin: 60 },
  ],
  staff: [
    { id: 'st1', name: 'Engyal T.', title: 'Kıdemli Berber' },
    { id: 'st2', name: 'Volkan B.', title: 'Berber' },
    { id: 'st3', name: 'Mehmet K.', title: 'Usta' },
  ],
};

export default function BarberDetailScreen({ navigation, route }: Props) {
  const { barberId } = route.params;
  const [barber, setBarber] = useState<BarberShop | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [b, r] = await Promise.all([
          getBarber(barberId),
          getBarberReviews(barberId).catch(() => []),
        ]);
        if (!active) return;
        setBarber(b);
        setReviews(r);
      } catch {
        /* fall back to mock below */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [barberId]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const data = barber ?? (MOCK as BarberShop);
  const wh = data.workingHours ?? MOCK.workingHours!;
  const services = (data.services?.length ? data.services : MOCK.services);
  const staff = (data.staff?.length ? data.staff : MOCK.staff);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <ScrollView>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#aabbff', fontSize: 15 }}>← Geri</Text>
          </TouchableOpacity>
          <View style={styles.shopIcon}><Text style={{ fontSize: 28 }}>💈</Text></View>
          <Text style={styles.shopName}>{data.shopName}</Text>
          <Text style={styles.shopSub}>⭐ {data.rating ?? 0} · {data.reviewCount ?? 0} yorum</Text>
          <View style={styles.metaRow}>
            {!!data.neighborhood && <Text style={styles.metaItem}>📍 {data.neighborhood}</Text>}
            <Text style={styles.metaItem}>🕐 {wh.openTime}–{wh.closeTime}</Text>
            <View style={styles.openBadge}><Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>● Açık</Text></View>
          </View>
        </View>

        <View style={{ padding: 16, gap: 16 }}>
          {/* Staff */}
          <Text style={styles.sectionTitle}>Berberler</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {staff.map((s: any) => (
              <View key={s.id} style={styles.staffItem}>
                <View style={styles.staffAvatar}><Text style={{ fontSize: 22 }}>✂</Text></View>
                <Text style={styles.staffName}>{s.name}</Text>
                <Text style={styles.staffTitle}>{s.title}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Services */}
          <Text style={styles.sectionTitle}>Hizmetler</Text>
          <View style={styles.card}>
            {services.map((s: any) => (
              <View key={s.id} style={styles.serviceItem}>
                <View>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceDesc}>{s.durationMin} dk</Text>
                </View>
                <Text style={styles.servicePrice}>₺{s.price}</Text>
              </View>
            ))}
          </View>

          {/* Reviews */}
          <Text style={styles.sectionTitle}>Yorumlar</Text>
          <View style={styles.card}>
            {reviews.length === 0 ? (
              <Text style={{ fontSize: 12, color: Colors.textMuted, paddingVertical: 8 }}>Henüz yorum yok.</Text>
            ) : reviews.map((r, i) => (
              <View key={r.id} style={[styles.reviewItem, i < reviews.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.borderLight }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', fontSize: 13 }}>{r.customerName}</Text>
                  <Text style={{ color: Colors.warning }}>{'⭐'.repeat(r.rating)}</Text>
                </View>
                <Text style={{ fontSize: 12, color: Colors.textSecondary, marginTop: 4 }}>{r.comment}</Text>
              </View>
            ))}
          </View>

          {/* Buttons */}
          <TouchableOpacity style={styles.btnPrimary} onPress={() => navigation.navigate('Appointment', { barberId })}>
            <Text style={styles.btnPrimaryText}>Randevu Al</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Messaging', { barberId, barberName: data.shopName })}>
            <Text style={styles.btnSecondaryText}>Mesaj Gönder</Text>
          </TouchableOpacity>
          <View style={{ height: 16 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: '#1a1a3e', padding: 20, paddingTop: 16 },
  shopIcon: { width: 60, height: 60, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  shopName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  shopSub: { fontSize: 13, color: '#aabbff', marginTop: 4 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' },
  metaItem: { fontSize: 12, color: '#ccd' },
  openBadge: { backgroundColor: 'rgba(34,197,94,0.2)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  staffItem: { alignItems: 'center', marginRight: 16, width: 64 },
  staffAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#e8e0ff', alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: 11, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  staffTitle: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  serviceName: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  serviceDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  reviewItem: { paddingVertical: 10 },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnSecondary: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnSecondaryText: { fontSize: 15, color: Colors.primary },
});
