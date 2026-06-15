import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../constants';

const INITIAL_MSGS = [
  { id: '1', text: 'Merhaba! Size nasıl yardımcı olabilirim? 💈', sent: false, time: '09:45' },
  { id: '2', text: 'Merhaba, yarın randevum var. Yaklaşık kaç dakika sürer?', sent: true, time: '09:47' },
  { id: '3', text: 'Saç kesimi genellikle 30–35 dakika sürer. Randevunuz saat 10:30\'da, tam vaktinde olursanız çok iyi olur 👍', sent: false, time: '09:48' },
  { id: '4', text: 'Tamam teşekkürler! Görüşürüz 🙏', sent: true, time: '09:49' },
];

export default function MessagingScreen({ navigation }: any) {
  const [msgs, setMsgs] = useState(INITIAL_MSGS);
  const [text, setText] = useState('');

  function send() {
    if (!text.trim()) return;
    setMsgs(prev => [...prev, { id: Date.now().toString(), text: text.trim(), sent: true, time: new Date().toLocaleTimeString('tr', { hour: '2-digit', minute: '2-digit' }) }]);
    setText('');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.surface }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}><Text style={{ fontSize: 22 }}>←</Text></TouchableOpacity>
        <View style={styles.avatar}><Text style={{ fontSize: 18 }}>💈</Text></View>
        <View>
          <Text style={styles.name}>Sirat's Barber Shop</Text>
          <Text style={styles.online}>● Çevrimiçi</Text>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          data={msgs}
          keyExtractor={m => m.id}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          renderItem={({ item }) => (
            <View style={{ alignItems: item.sent ? 'flex-end' : 'flex-start' }}>
              <View style={[styles.bubble, item.sent ? styles.bubbleSent : styles.bubbleRecv]}>
                <Text style={[styles.bubbleText, item.sent && { color: '#fff' }]}>{item.text}</Text>
              </View>
              <Text style={[styles.time, item.sent && { textAlign: 'right' }]}>{item.time}</Text>
            </View>
          )}
        />
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
  online: { fontSize: 11, color: '#22c55e' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16 },
  bubbleRecv: { backgroundColor: '#f3f4f6', borderBottomLeftRadius: 4 },
  bubbleSent: { backgroundColor: Colors.secondary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: Colors.primary, lineHeight: 20 },
  time: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: Colors.border, alignItems: 'center' },
  input: { flex: 1, padding: 10, paddingHorizontal: 14, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 20, fontSize: 14, backgroundColor: '#fafafa' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.secondary, alignItems: 'center', justifyContent: 'center' },
});
