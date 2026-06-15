import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Alert } from 'react-native';
import { Colors } from '../../constants';

export default function RatingScreen({ navigation }: any) {
  const [stars, setStars] = useState(4);
  const [comment, setComment] = useState('');

  function submit() {
    Alert.alert('Teşekkürler!', 'Değerlendirmeniz gönderildi.', [
      { text: 'Tamam', onPress: () => navigation?.navigate?.('Appointments') }
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <View><Text style={styles.title}>Değerlendirme</Text><Text style={styles.sub}>Hizmetinizi değerlendirin</Text></View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.card}>
          <View style={styles.avatar}><Text style={{ fontSize: 24 }}>💈</Text></View>
          <View>
            <Text style={styles.shopName}>Sirat's Barber Shop</Text>
            <Text style={styles.apptInfo}>14 Mayıs 2025 · Saç Kesimi</Text>
            <Text style={styles.apptInfo}>Engyal Taskiran</Text>
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
        <TouchableOpacity style={styles.btnPrimary} onPress={submit}>
          <Text style={styles.btnText}>Değerlendirmeyi Gönder</Text>
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
