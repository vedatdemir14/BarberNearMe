import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { useAuth } from '../../hooks/useAuth';
import { getBarber } from '../../services/barberService';
import { getBarberAppointments, buildWalletTransactions, WalletTx } from '../../services/appointmentService';

const MONTHS_TR = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
function formatDate(ms: number): string {
  if (!ms) return '';
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()]} ${d.getFullYear()}`;
}

export default function BarberWalletScreen({ navigation }: any) {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    try {
      const [shop, appts] = await Promise.all([
        getBarber(user.uid),
        getBarberAppointments(user.uid),
      ]);
      setBalance((shop as any)?.walletBalance ?? 0);
      setTxs(buildWalletTransactions(appts));
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const totalIn  = txs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
  const totalOut = txs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Hesap Hareketleri</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={txs}
          keyExtractor={t => t.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListHeaderComponent={
            <View style={{ gap: 12, marginBottom: 4 }}>
              {/* Bakiye kartı */}
              <View style={styles.balanceCard}>
                <Text style={styles.balanceLabel}>Cüzdan Bakiyesi</Text>
                <Text style={styles.balanceAmount}>₺{balance.toLocaleString('tr-TR')}</Text>
              </View>
              {/* Giriş / Çıkış özeti */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="arrow-down" size={16} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Giren</Text>
                    <Text style={[styles.summaryVal, { color: '#16a34a' }]}>+₺{totalIn.toLocaleString('tr-TR')}</Text>
                  </View>
                </View>
                <View style={styles.summaryCard}>
                  <View style={[styles.summaryIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="arrow-up" size={16} color="#dc2626" />
                  </View>
                  <View>
                    <Text style={styles.summaryLabel}>Çıkan</Text>
                    <Text style={[styles.summaryVal, { color: '#dc2626' }]}>−₺{totalOut.toLocaleString('tr-TR')}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.listTitle}>Hareketler</Text>
            </View>
          }
          renderItem={({ item }) => {
            const inFlow = item.type === 'in';
            return (
              <View style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: inFlow ? '#dcfce7' : '#fee2e2' }]}>
                  <Ionicons
                    name={inFlow ? 'cash-outline' : 'arrow-undo-outline'}
                    size={18}
                    color={inFlow ? '#16a34a' : '#dc2626'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txTitle}>{item.title}</Text>
                  <Text style={styles.txMeta}>
                    {[item.customerName, item.serviceName].filter(Boolean).join(' · ') || '—'}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(item.dateMs)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: inFlow ? '#16a34a' : '#dc2626' }]}>
                  {inFlow ? '+' : '−'}₺{item.amount.toLocaleString('tr-TR')}
                </Text>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="wallet-outline" size={36} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Henüz hesap hareketi yok</Text>
              <Text style={styles.emptyHint}>Kapora ve tamamlanan işlerden gelen tutarlar burada görünür.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary },

  balanceCard: { backgroundColor: Colors.secondary, borderRadius: 16, padding: 20 },
  balanceLabel: { fontSize: 13, color: 'rgba(0,0,0,0.6)', marginBottom: 4 },
  balanceAmount: { fontSize: 34, fontWeight: '900', color: '#020000' },

  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.borderLight },
  summaryIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary },
  summaryVal: { fontSize: 15, fontWeight: '800' },

  listTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginTop: 6 },

  txCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.surface, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: Colors.borderLight },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  txMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  txDate: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '800' },

  empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
