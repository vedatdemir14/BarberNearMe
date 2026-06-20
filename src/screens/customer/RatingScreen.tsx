import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getAppointment, Appointment } from '../../services/appointmentService';
import { getBarber } from '../../services/barberService';
import { addReview } from '../../services/reviewService';

type Props = NativeStackScreenProps<RootStackParamList, 'Rating'>;

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

export default function RatingScreen({ navigation, route }: Props) {
  const { appointmentId } = route.params;
  const { profile } = useAuth();
  const [stars, setStars] = useState(4);
  const [comment, setComment] = useState('');
  const [appt, setAppt] = useState<Appointment | null>(null);
  const [shopName, setShopName] = useState('Berber');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  async function submit() {
    if (!appt) { Alert.alert('Hata', 'Randevu bulunamadı.'); return; }
    setSubmitting(true);
    try {
      await addReview({
        customerId: appt.customerId,
        customerName: profile ? `${profile.firstName} ${profile.lastName}`.trim() : 'Müşteri',
        barberId: appt.barberId,
        appointmentId: appt.id,
        rating: stars,
        qualityRating: stars,
        cleanlinessRating: stars,
        timelinessRating: stars,
        comment: comment.trim(),
      });
      Alert.alert('Teşekkürler!', 'Değerlendirmeniz gönderildi.', [
        { text: 'Tamam', onPress: () => navigation.navigate('CustomerTabs', { screen: 'Appointments' } as any) },
      ]);
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Değerlendirme gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const apptDate = appt ? appt.date.toDate() : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <View><Text style={styles.title}>Değerlendirme</Text><Text style={styles.sub}>Hizmetinizi değerlendirin</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={{ fontSize: 24 }}>💈</Text></View>
          <View>
            <Text style={styles.shopName}>{shopName}</Text>
            {apptDate && (
              <Text style={styles.apptInfo}>
                {apptDate.getDate()} {MONTHS_TR[apptDate.getMonth()]} {apptDate.getFullYear()} · {appt?.serviceName}
              </Text>
            )}
            {!!appt?.staffName && <Text style={styles.apptInfo}>{appt.staffName}</Text>}
          </View>
        </View>
        <Text style={styles.sectionTitle}>Genel Puan</Text>
        <View style={styles.starRow}>
          {[1,2,3,4,5].map(n => (
            <TouchableOpacity key={n} onPress={() => setStars(n)}>
              <Text style={[styles.star, n <= stars && styles.starActive]}>⭐</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ textAlign: 'center', color: Colors.textSecondary, fontSize: 13 }}>{stars} / 5 yıldız</Text>
        <Text style={styles.sectionTitle}>Yorumunuz</Text>
        <TextInput
          style={styles.textarea}
          placeholder="Deneyiminizi paylaşın..."
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          textAlignVertical="top"
        />
        <TouchableOpacity style={[styles.btnPrimary, submitting && { opacity: 0.6 }]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Değerlendirmeyi Gönder</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  sub: { fontSize: 12, color: Colors.textSecondary },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e8e0ff', alignItems: 'center', justifyContent: 'center' },
  shopName: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  apptInfo: { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  star: { fontSize: 36, opacity: 0.3 },
  starActive: { opacity: 1 },
  textarea: { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, padding: 12, fontSize: 14, backgroundColor: '#fafafa', height: 100 },
  btnPrimary: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
