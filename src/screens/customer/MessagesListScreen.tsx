import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { getConversations, deleteConversation, Conversation } from '../../services/conversationService';

function formatWhen(at: any): string {
  const d = at?.toDate?.();
  if (!d) return '';
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('tr', { day: '2-digit', month: '2-digit' });
}

export default function MessagesListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) { setLoading(false); return; }
      setLoading(true);
      getConversations(user.uid)
        .then(data => { if (active) setItems(data); })
        .catch(() => { if (active) setItems([]); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [user])
  );

  function confirmDelete(c: Conversation) {
    Alert.alert('Konuşmayı sil', `${c.barberName} ile olan konuşmayı silmek istiyor musunuz?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteConversation(c.id);
            setItems(prev => prev.filter(x => x.id !== c.id));
          } catch (e: any) {
            Alert.alert('Hata', e.message ?? 'Konuşma silinemedi.');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}><Text style={styles.title}>Mesajlar</Text></View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigation.navigate('Messaging', {
                conversationId: item.id, barberId: item.barberId, barberName: item.barberName,
              })}
              onLongPress={() => confirmDelete(item)}
            >
              <View style={styles.avatar}><Text style={{ fontSize: 22 }}>💈</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name} numberOfLines={1}>{item.barberName}</Text>
                  <Text style={styles.time}>{formatWhen(item.lastAt)}</Text>
                </View>
                <Text style={styles.preview} numberOfLines={1}>{item.lastMessage || 'Sohbeti başlat'}</Text>
              </View>
              <TouchableOpacity onPress={() => confirmDelete(item)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={styles.trash}>🗑</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={styles.emptyText}>Henüz mesajın yok.</Text>
              <Text style={styles.emptyHint}>Bir berberin sayfasından "Mesaj Gönder" ile sohbet başlat.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: Colors.surface, borderRadius: 14, borderWidth: 1, borderColor: Colors.borderLight },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8e0ff', alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.primary, flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: Colors.textMuted },
  preview: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  trash: { fontSize: 18, paddingLeft: 4 },
  empty: { alignItems: 'center', marginTop: 80, paddingHorizontal: 32, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyHint: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
});
