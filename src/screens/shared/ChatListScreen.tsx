import React, { useCallback, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Chat, getChatsForBarber, getChatsForCustomer, deleteChat } from '../../services/chatService';

function formatTime(ts: any): string {
  const d = ts?.toDate?.();
  if (!d) return '';
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}

export default function ChatListScreen({ navigation }: any) {
  const { user, profile } = useAuth();
  const isBarber = profile?.role === 'barber';

  const [chats,      setChats]      = useState<Chat[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const data = isBarber
        ? await getChatsForBarber(user.uid)
        : await getChatsForCustomer(user.uid);
      setChats(data);
    } catch (e) { console.warn(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user, isBarber]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function handleDelete(chat: Chat) {
    const who = isBarber ? chat.customerName : chat.barberName;
    Alert.alert('Konuşmayı sil', `${who} ile olan tüm konuşma silinsin mi?`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive',
        onPress: async () => {
          try {
            await deleteChat(chat.id);
            setChats(prev => prev.filter(c => c.id !== chat.id));
          } catch {
            Alert.alert('Hata', 'Konuşma silinemedi.');
          }
        },
      },
    ]);
  }

  function openChat(chat: Chat) {
    navigation.navigate('Chat', {
      barberId:     chat.barberId,
      barberName:   chat.barberName,
      customerId:   chat.customerId,
      customerName: chat.customerName,
    });
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesajlar</Text>
        {chats.length > 0 && <Text style={styles.hint}>Konuşmayı silmek için 🗑 ikonuna dokun</Text>}
      </View>

      <FlatList
        data={chats}
        keyExtractor={c => c.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 28, color: Colors.secondary }}>✉</Text>
            <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
            <Text style={styles.emptySub}>
              {isBarber
                ? 'Müşteriler randevu onaylandıktan sonra mesaj atabilir.'
                : 'Randevu aldıktan sonra berberinizle iletişime geçebilirsiniz.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const otherName = isBarber ? item.customerName : item.barberName;
          const hasMsg    = !!item.lastMessage;
          return (
            <TouchableOpacity style={styles.row} onPress={() => openChat(item)} onLongPress={() => handleDelete(item)} delayLongPress={350}>
              <View style={styles.avatar}>
                <Text style={{ fontSize: 16, color: Colors.primary }}>{isBarber ? 'M' : '✂'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                  <Text style={styles.name}>{otherName}</Text>
                  {hasMsg && (
                    <Text style={styles.time}>{formatTime(item.lastMessageAt)}</Text>
                  )}
                </View>
                <Text style={styles.preview} numberOfLines={1}>
                  {item.lastMessage || 'Konuşmayı başlat…'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} style={styles.delBtn}>
                <Ionicons name="trash-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header:  { padding: 16, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:   { fontSize: 20, fontWeight: '800', color: Colors.primary },
  hint:    { fontSize: 11, color: Colors.textMuted, marginTop: 2 },

  row:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.surface },
  avatar:  { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  rowTop:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  name:    { fontSize: 15, fontWeight: '700', color: Colors.primary },
  time:    { fontSize: 11, color: Colors.textMuted },
  preview: { fontSize: 13, color: Colors.textSecondary },
  delBtn:  { padding: 4 },

  separator: { height: 1, backgroundColor: Colors.borderLight, marginLeft: 76 },

  empty:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptySub:   { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});
