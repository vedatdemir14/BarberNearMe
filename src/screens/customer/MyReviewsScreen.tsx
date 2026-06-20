import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getCustomerReviews, Review } from '../../services/reviewService';
import { getBarber } from '../../services/barberService';

const MONTHS_TR = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];

function formatDate(at: any): string {
  const d = at?.toDate?.();
  return d ? `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}` : '';
}

export default function MyReviewsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<Review[]>([]);
  const [shopNames, setShopNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) { setLoading(false); return; }
      setLoading(true);
      getCustomerReviews(user.uid)
        .then(async data => {
          if (!active) return;
          setItems(data);
          const ids = [...new Set(data.map(r => r.barberId))];
          const entries = await Promise.all(
            ids.map(async id => [id, (await getBarber(id).catch(() => null))?.shopName ?? 'Berber'] as const)
          );
          if (active) setShopNames(Object.fromEntries(entries));
        })
        .catch(() => { if (active) setItems([]); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [user])
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <Text style={styles.title}>Değerlendirmelerim</Text>
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.shopName}>{shopNames[item.barberId] ?? 'Berber'}</Text>
                <Text style={styles.stars}>{'★'.repeat(item.rating)}</Text>
              </View>
              {!!item.comment && <Text style={styles.comment}>{item.comment}</Text>}
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, color: Colors.secondary }}>★</Text>
              <Text style={styles.emptyText}>Henüz değerlendirme yapmadın.</Text>
              <Text style={styles.emptyHint}>Tamamlanan bir randevuyu "Randevularım"dan değerlendirebilirsin.</Text>
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
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.borderLight },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: 15, fontWeight: '700', color: Colors.primary, flex: 1, marginRight: 8 },
  stars: { fontSize: 13, color: Colors.warning },
  comment: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, lineHeight: 19 },
  date: { fontSize: 11, color: Colors.textMuted, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
