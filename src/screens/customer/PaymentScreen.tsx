import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { addToWallet } from '../../services/barberService';
import { createAppointment } from '../../services/appointmentService';
import { auth } from '../../services/firebase';
import { Timestamp } from 'firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

function formatCardNumber(val: string) {
  return val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}
function formatExpiry(val: string) {
  const digits = val.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function PaymentScreen({ route, navigation }: Props) {
  const { barberId, barberName, serviceName, servicePrice, serviceId,
          date, timeSlot, staffName, staffId } = route.params;

  const kapora = Math.round(servicePrice * 0.1);

  // Demo: kart bilgileri önceden dolu gelir (sunumda hızlı "Öde")
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [expiry, setExpiry]         = useState('12/30');
  const [cvv, setCvv]               = useState('123');
  const [cardName, setCardName]     = useState('Demo Kullanıcı');
  const [loading, setLoading]       = useState(false);

  function isFormValid() {
    return (
      cardNumber.replace(/\s/g, '').length === 16 &&
      expiry.length === 5 &&
      cvv.length === 3 &&
      cardName.trim().length > 2
    );
  }

  async function handlePay() {
    if (!isFormValid()) {
      Alert.alert('Hata', 'Lütfen kart bilgilerini eksiksiz girin.');
      return;
    }

    const user = auth.currentUser;
    if (!user) { Alert.alert('Hata', 'Oturum açmanız gerekiyor.'); return; }

    setLoading(true);
    try {
      // 1. Kapora'yı berberin cüzdanına aktar
      await addToWallet(barberId, kapora);

      // 2. Randevuyu oluştur
      const appointmentId = await createAppointment({
        customerId:   user.uid,
        barberId,
        serviceId,
        serviceName,
        servicePrice,
        staffId,
        staffName,
        date:         Timestamp.fromDate(new Date(date)),
        timeSlot,
        status:       'pending',
        kaporaPaid:   true,
        kaporaAmount: kapora,
        totalPrice:   servicePrice,
      });

      navigation.replace('AppointmentConfirm', { appointmentId });
    } catch (err: any) {
      Alert.alert('Ödeme Hatası', err.message ?? 'Bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Kapora Ödemesi</Text>
          <Text style={styles.headerSub}>{barberName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Özet kartı */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Randevu Özeti</Text>
          {[
            ['Hizmet',  serviceName],
            ['Çalışan', staffName],
            ['Tarih',   date],
            ['Saat',    timeSlot],
          ].map(([l, v]) => (
            <View key={l} style={styles.row}>
              <Text style={styles.rowLabel}>{l}</Text>
              <Text style={styles.rowVal}>{v}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>Hizmet Bedeli</Text>
            <Text style={styles.rowVal}>₺{servicePrice}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { fontWeight: '700' }]}>Kapora (%10)</Text>
            <Text style={[styles.rowVal, styles.kaporaText]}>₺{kapora}</Text>
          </View>
          <Text style={styles.kaporaNote}>
            Kalan ₺{servicePrice - kapora} tutarı berberde nakit/kart ile ödersiniz.
          </Text>
        </View>

        {/* Kart formu */}
        <View style={styles.cardForm}>
          <Text style={styles.sectionTitle}>Kart Bilgileri</Text>

          <Text style={styles.label}>Kart Üzerindeki İsim</Text>
          <TextInput
            style={styles.input}
            placeholder="AD SOYAD"
            placeholderTextColor={Colors.textMuted}
            value={cardName}
            onChangeText={setCardName}
            autoCapitalize="characters"
          />

          <Text style={styles.label}>Kart Numarası</Text>
          <View style={styles.inputRow}>
            <Text style={styles.cardIcon}>💳</Text>
            <TextInput
              style={{ flex: 1, paddingVertical: 12, fontSize: 15, color: Colors.text }}
              placeholder="0000 0000 0000 0000"
              placeholderTextColor={Colors.textMuted}
              value={cardNumber}
              onChangeText={t => setCardNumber(formatCardNumber(t))}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Son Kullanma</Text>
              <TextInput
                style={styles.input}
                placeholder="AA/YY"
                placeholderTextColor={Colors.textMuted}
                value={expiry}
                onChangeText={t => setExpiry(formatExpiry(t))}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                placeholder="•••"
                placeholderTextColor={Colors.textMuted}
                value={cvv}
                onChangeText={t => setCvv(t.replace(/\D/g, '').slice(0, 3))}
                keyboardType="numeric"
                maxLength={3}
                secureTextEntry
              />
            </View>
          </View>
        </View>

        {/* Güvenlik notu */}
        <View style={styles.secureNote}>
          <Text style={styles.secureText}>256-bit SSL ile şifrelenmiş güvenli ödeme</Text>
        </View>

        {/* Ödeme butonu */}
        <TouchableOpacity
          style={[styles.payBtn, (!isFormValid() || loading) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={!isFormValid() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.payBtnText}>₺{kapora} Kapora Öde →</Text>
          }
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  header:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  back:        { fontSize: 22, color: Colors.primary },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
  headerSub:   { fontSize: 12, color: Colors.textSecondary },
  scroll:      { padding: 16, gap: 16 },

  summaryCard:  { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 12 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowBorder:    { borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 8, paddingTop: 12 },
  rowLabel:     { fontSize: 13, color: Colors.textSecondary },
  rowVal:       { fontSize: 13, fontWeight: '600', color: Colors.primary },
  kaporaText:   { fontSize: 15, fontWeight: '800', color: '#16a34a' },
  kaporaNote:   { marginTop: 8, fontSize: 12, color: Colors.textMuted, lineHeight: 17, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 8 },

  cardForm:  { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.borderLight },
  label:     { fontSize: 12, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, marginTop: 4 },
  input:     { backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text, marginBottom: 4 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 14 },
  cardIcon:  { fontSize: 18, marginRight: 8 },

  secureNote: { alignItems: 'center', paddingVertical: 4 },
  secureText: { fontSize: 12, color: Colors.textMuted },

  payBtn:         { backgroundColor: Colors.secondary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  payBtnDisabled: { backgroundColor: Colors.textMuted },
  payBtnText:     { color: '#020000', fontSize: 16, fontWeight: '800' },
});
