import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants';

type Props = TextInputProps & {
  /** Dış sarmalayıcıya uygulanacak ek stil (ör. boşluk) */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Şifre alanı + göster/gizle (göz) butonu.
 * Var olan TextInput stilini `style` ile aynen alır; sağ tarafa göz ikonu ekler.
 */
export default function PasswordInput({ style, containerStyle, ...rest }: Props) {
  const [hidden, setHidden] = useState(true);

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        {...rest}
        style={[style, styles.input]}
        secureTextEntry={hidden}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.toggle}
        onPress={() => setHidden(h => !h)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
      >
        <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center' },
  input: { paddingRight: 44 }, // göz ikonu için sağda yer aç
  toggle: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center' },
});
