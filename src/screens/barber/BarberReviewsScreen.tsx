import React, { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getBarberReviews, Review } from '../../services/reviewService';

type Props = { navigation: any };

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function formatDate(at: any): string {
  const d = at?.toDate?.();
  return d ? `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}` : '';
}

export default function BarberReviewsScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!user) { setLoading(false); return; }
    getBarberReviews(user.uid)
      .then(data => { if (active) setItems(data); })
      .catch(() => { if (active) setItems([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  const avg = items.length
    ? Math.round((items.reduce((a, r) => a + r.rating, 0) / items.length) * 10) / 10
    : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Değerlendirmeler</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          ListHeaderComponent={
            items.length > 0 ? (
              <View style={styles.summary}>
                <Text style={styles.summaryAvg}>★ {avg}</Text>
                <Text style={styles.summaryCount}>{items.length} değerlendirme</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name}>{item.customerName || 'Müşteri'}</Text>
                <Text style={styles.stars}>{'★'.repeat(item.rating)}</Text>
              </View>
              {!!formatDate(item.createdAt) && <Text style={styles.date}>{formatDate(item.createdAt)}</Text>}
              {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>⭐</Text>
              <Text style={styles.emptyText}>Henüz değerlendirme yok.</Text>
              <Text style={styles.emptyHint}>Tamamlanan randevulardan sonra müşterilerin yorumları burada görünür.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  summary: { alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.borderLight, gap: 2 },
  summaryAvg: { fontSize: 28, fontWeight: '800', color: Colors.primary },
  summaryCount: { fontSize: 12, color: Colors.textSecondary },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  stars: { fontSize: 13, color: Colors.warning },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  comment: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },
  empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
