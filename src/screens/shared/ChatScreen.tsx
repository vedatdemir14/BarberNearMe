import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Colors } from '../../constants';
import BackButton from '../../components/BackButton';
import { friendlyError } from '../../utils/errorMessage';
import { useAuth } from '../../hooks/useAuth';
import {
  ChatMessage, ensureChat, sendMessage, subscribeToMessages,
} from '../../services/chatService';

interface Props {
  navigation: any;
  route: { params: {
    barberId: string;
    barberName: string;
    customerId?: string;   // berber tarafından açılırsa dolu gelir
    customerName?: string;
  }};
}

function formatTime(ts: any): string {
  const d = ts?.toDate?.();
  if (!d) return '';
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen({ navigation, route }: Props) {
  const { user, profile } = useAuth();
  const { barberId, barberName, customerId, customerName } = route.params;

  // Hangi taraftayız?
  const isBarber   = profile?.role === 'barber';
  const myId       = user?.uid ?? '';
  const otherId    = isBarber ? (customerId ?? '') : barberId;
  const otherName  = isBarber ? (customerName ?? 'Müşteri') : barberName;
  const myName     = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

  const [cId,      setCId]      = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text,     setText]     = useState('');
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Chat oluştur/bul
  useEffect(() => {
    if (!myId || !barberId) return;
    const cIdLocal = isBarber
      ? `${barberId}_${customerId}`
      : `${barberId}_${myId}`;

    ensureChat(
      barberId,
      isBarber ? (customerId ?? myId) : myId,
      barberName,
      isBarber ? (customerName ?? myName) : myName,
    )
      .then(() => setCId(cIdLocal))
      .catch(e => Alert.alert('Hata', friendlyError(e)))
      .finally(() => setLoading(false));
  }, [myId, barberId]);

  // Gerçek zamanlı mesaj dinleyici
  useEffect(() => {
    if (!cId) return;
    const unsub = subscribeToMessages(cId, msgs => {
      setMessages(msgs);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return unsub;
  }, [cId]);

  async function handleSend() {
    if (!text.trim() || !cId || sending) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    try {
      await sendMessage(cId, myId, msg);
    } catch (e: any) {
      Alert.alert('Gönderilemedi', friendlyError(e));
      setText(msg);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={styles.avatar}>
          <Text style={{ fontSize: 16, color: Colors.primary }}>✂</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName}>{otherName}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        {/* Mesajlar */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>Henüz mesaj yok. İlk mesajı sen gönder.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isMine = item.senderId === myId;
            return (
              <View style={{ alignItems: isMine ? 'flex-end' : 'flex-start' }}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                  <Text style={[styles.bubbleText, isMine && { color: '#020000' }]}>
                    {item.text}
                  </Text>
                </View>
                <Text style={[styles.time, isMine && { textAlign: 'right' }]}>
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            );
          }}
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending
              ? <ActivityIndicator color="#020000" size="small" />
              : <Text style={{ color: '#020000', fontSize: 16 }}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  back:       { fontSize: 22, color: Colors.primary },
  avatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerName: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  emptyWrap: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  bubble:      { maxWidth: '78%', padding: 12, borderRadius: 16 },
  bubbleOther: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  bubbleMine:  { backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  bubbleText:  { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  time:        { fontSize: 10, color: Colors.textMuted, marginTop: 2 },

  inputRow: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'flex-end',
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20,
    fontSize: 14, backgroundColor: '#fafafa', color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center',
  },
});
