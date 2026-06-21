import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, GestureResponderEvent } from 'react-native';
import { Colors } from '../constants';

type Props = {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange?: (v: number) => void;   // sürüklerken canlı
  onComplete?: (v: number) => void; // parmak kalkınca
};

/**
 * Native bağımlılığı olmayan, PanResponder tabanlı slider.
 * Koordinat için locationX kullanır (wrap'e göreli) — measure gerekmez,
 * Modal içinde de doğru çalışır. Çocuk view'lar pointerEvents="none"
 * olduğundan dokunuş hep wrap'e gelir → locationX hep wrap'e göreli.
 */
export default function RangeSlider({ min, max, step = 1, value, onChange, onComplete }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const [dragVal, setDragVal] = useState<number | null>(null); // sürüklerken canlı değer

  const toValue = (x: number) => {
    const w = widthRef.current || 1;
    const pct = Math.min(1, Math.max(0, x / w));
    const raw = min + pct * (max - min);
    return Math.min(max, Math.max(min, Math.round(raw / step) * step));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const v = toValue(e.nativeEvent.locationX);
        setDragVal(v); onChange?.(v);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const v = toValue(e.nativeEvent.locationX);
        setDragVal(v); onChange?.(v);
      },
      onPanResponderRelease: (e: GestureResponderEvent) => {
        const v = toValue(e.nativeEvent.locationX);
        setDragVal(null); onComplete?.(v);
      },
    })
  ).current;

  // Sürüklerken canlı (dragVal), değilken dışarıdan gelen value → thumb anlık takip, bırakınca zıplamaz
  const shown = dragVal !== null ? dragVal : Math.min(max, Math.max(min, value));
  const pct = (shown - min) / (max - min);
  const thumbLeft = Math.max(0, Math.min(width - 26, pct * width - 13));

  return (
    <View
      {...pan.panHandlers}
      style={styles.wrap}
      onLayout={e => { const w = e.nativeEvent.layout.width; widthRef.current = w; setWidth(w); }}
    >
      <View style={styles.track} pointerEvents="none">
        <View style={[styles.fill, { width: pct * width }]} />
      </View>
      <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 44, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, backgroundColor: Colors.borderLight, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: Colors.secondary, borderRadius: 3 },
  thumb: {
    position: 'absolute', width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.secondary, borderWidth: 2, borderColor: '#fff',
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3,
  },
});
