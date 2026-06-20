import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { Colors } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import {
  getOrCreateConversation, subscribeMessages, sendMessage, Message,
} from '../../services/conversationService';

type Props = NativeStackScreenProps<RootStackParamList, 'Messaging'>;

function formatTime(at: any): string {
  const d = at?.toDate?.();
  return d ? d.toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' }) : '';
}

export default function MessagingScreen({ navigation, route }: Props) {
  const { barberId, barberName, conversationId } = route.params;
  const { user } = useAuth();

  const [convId, setConvId] = useState<string | null>(conversationId ?? null);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  // Konuşma id'si yoksa bul/oluştur
  useEffect(() => {
    let active = true;
    if (convId || !user || !barberId) { if (!convId) setLoading(false); return; }
    getOrCreateConversation(user.uid, barberId, barberName)
      .then(id => { if (active) setConvId(id); })
      .catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [convId, user, barberId, barberName]);

  // Mesajları canlı dinle
  useEffect(() => {
    if (!convId) return;
    const unsub = subscribeMessages(convId, m => { setMsgs(m); setLoading(false); });
    return unsub;
  }, [convId]);

  async function send() {
    const t = text.trim();
    if (!t || !convId) return;
    setText('');
    try {
      await sendMessage(convId, t, 'customer');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setText(t); // gönderilemezse metni geri koy
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <View style={styles.avatar}><Text style={{ fontSize: 18 }}>💈</Text></View>
        <View><Text style={styles.name}>{barberName || 'Berber'}</Text></View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : (
          <FlatList
            ref={listRef}
            data={msgs}
            keyExtractor={m => m.id}
            contentContainerStyle={{ padding: 16, gap: 8, flexGrow: 1 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const sent = item.senderRole === 'customer';
              return (
                <View style={{ alignItems: sent ? 'flex-end' : 'flex-start' }}>
                  <View style={[styles.bubble, sent ? styles.bubbleSent : styles.bubbleRecv]}>
                    <Text style={[styles.bubbleText, sent && { color: '#fff' }]}>{item.text}</Text>
                  </View>
                  <Text style={[styles.time, sent && { textAlign: 'right' }]}>{formatTime(item.createdAt)}</Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}>
                <Text style={{ color: Colors.textMuted }}>İlk mesajı sen gönder 👋</Text>
              </View>
            }
          />
        )}
        <View style={styles.inputRow}>
          <TextInput style={styles.input} placeholder="Mesaj yaz..." value={text} onChangeText={setText} />
          <TouchableOpacity style={styles.sendBtn} onPress={send}><Text style={{ color: '#fff', fontSize: 16 }}>➤</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e8e0ff', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  bubbleRecv: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  bubbleSent: { backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  time: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' },
  input: { flex: 1, padding: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, fontSize: 14, backgroundColor: '#fafafa' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
});
