import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { friendlyError } from '../../utils/errorMessage';
import { getBarber, BarberShop } from '../../services/barberService';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'BarberRegStep4'>;

const DAYS_TR = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export default function BarberRegStep4Screen({ navigation, route }: Props) {
  const { uid } = route.params;
  const [shop,    setShop]    = useState<BarberShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    getBarber(uid)
      .then(setShop)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [uid]);

  async function handleActivate() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'barbers', uid), { isActive: true });
      // useAuth listener'ı profile değişikliğini algılayacak ve
      // BarberTabs'e zaten oturum açıldığından navigation otomatik oluyor.
      // Dashboard şimdi isActive=true görecek.
      navigation.reset({ index: 0, routes: [{ name: 'BarberTabs' }] });
    } catch (e: any) {
      Alert.alert('Hata', friendlyError(e));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const wh = shop?.workingHours;
  const openDayNames = wh?.days.map(d => DAYS_TR[d]).join(', ') ?? '—';

  const rows: [string, string][] = [
    ['Dükkan Adı',       shop?.shopName ?? '—'],
    ['Şehir',            shop?.city ?? '—'],
    ['Adres',            shop?.address ?? '—'],
    ['Hizmet Sayısı',    `${shop?.services?.length ?? 0} hizmet`],
    ['Çalışan Sayısı',   `${shop?.staff?.length ?? 0} çalışan`],
    ['Çalışma Günleri',  openDayNames],
    ['Çalışma Saatleri', wh ? `${wh.openTime} – ${wh.closeTime}` : '—'],
    ['Randevu Aralığı',  wh ? `${wh.slotDurationMin} dk` : '—'],
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner}>

        <BackButton onPress={() => navigation.goBack()} label="Geri" color={Colors.secondary} size={18} style={{ marginBottom: 8 }} />

        {/* Progress */}
        <View style={styles.progress}>
          {[1, 2, 3, 4].map(n => (
            <View key={n} style={[styles.dot, styles.dotActive]}>
              <Text style={styles.dotTextActive}>{n}</Text>
            </View>
          ))}
        </View>

        {/* Başlık */}
        <View style={styles.checkWrap}>
          <View style={styles.checkCircle}><Text style={{ fontSize: 32, color: Colors.secondary }}>✂</Text></View>
          <Text style={styles.title}>Her Şey Hazır!</Text>
          <Text style={styles.sub}>Bilgilerini kontrol et ve dükkanını aç.</Text>
        </View>

        {/* Özet kartı */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dükkan Özeti</Text>
          {rows.map(([l, v]) => (
            <View key={l} style={styles.row}>
              <Text style={styles.rowLabel}>{l}</Text>
              <Text style={styles.rowVal} numberOfLines={2}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Hizmetler */}
        {(shop?.services?.length ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hizmetler</Text>
            {shop!.services.map(s => (
              <View key={s.id} style={styles.row}>
                <Text style={styles.rowLabel}>{s.name}</Text>
                <Text style={styles.rowVal}>₺{s.price} · {s.durationMin}dk</Text>
              </View>
            ))}
          </View>
        )}

        {/* Uyarı */}
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Dükkanı açtıktan sonra bu bilgileri Dashboard → Ayarlar kısmından güncelleyebilirsin.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, saving && { opacity: 0.6 }]}
          onPress={handleActivate}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#020000" />
            : <Text style={styles.btnText}>Dükkanı Aç</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner:     { padding: 20, gap: 14 },

  progress:     { flexDirection: 'row', gap: 8 },
  dot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center' },
  dotActive:    { backgroundColor: Colors.secondary },
  dotText:      { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  dotTextActive:{ fontSize: 12, fontWeight: '700', color: '#020000' },

  checkWrap:   { alignItems: 'center', gap: 8, paddingVertical: 8 },
  checkCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF9D9', alignItems: 'center', justifyContent: 'center' },
  title:       { fontSize: 24, fontWeight: '800', color: Colors.primary },
  sub:         { fontSize: 14, color: Colors.textSecondary },

  card:      { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.borderLight, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 8 },
  row:       { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabel:  { fontSize: 12, color: Colors.textSecondary, flex: 1 },
  rowVal:    { fontSize: 13, fontWeight: '600', color: Colors.primary, flex: 1, textAlign: 'right' },

  notice:     { backgroundColor: '#FFF9D9', borderRadius: 10, padding: 12 },
  noticeText: { fontSize: 12, color: Colors.primary, lineHeight: 18 },

  btn:     { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#020000', fontSize: 17, fontWeight: '800' },
});
