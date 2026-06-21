import React, { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
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
 * @react-native-community/slider bazı Android sürümlerinde (eski mimari)
 * sürüklenmediği için bununla değiştirildi. Her cihazda çalışır.
 */
export default function RangeSlider({ min, max, step = 1, value, onChange, onComplete }: Props) {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const leftRef = useRef(0); // track'in ekrandaki x'i
  const viewRef = useRef<View>(null);
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
      onPanResponderGrant: (_e, g) => { const v = toValue(g.x0 - leftRef.current); setDragVal(v); onChange?.(v); },
      onPanResponderMove: (_e, g) => { const v = toValue(g.moveX - leftRef.current); setDragVal(v); onChange?.(v); },
      onPanResponderRelease: (_e, g) => { const v = toValue((g.moveX || g.x0) - leftRef.current); setDragVal(null); onComplete?.(v); },
    })
  ).current;

  // Sürüklerken canlı değeri (dragVal), değilken dışarıdan gelen value'yu göster → thumb parmağı anında takip eder, bırakınca zıplamaz
  const shown = dragVal !== null ? dragVal : Math.min(max, Math.max(min, value));
  const pct = (shown - min) / (max - min);
  const thumbLeft = Math.max(0, Math.min(width - 26, pct * width - 13));

  return (
    <View
      ref={viewRef}
      {...pan.panHandlers}
      style={styles.wrap}
      onLayout={() =>
        viewRef.current?.measure((_x, _y, w, _h, px) => {
          widthRef.current = w;
          leftRef.current = px;
          setWidth(w);
        })
      }
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: pct * width }]} />
      </View>
      <View style={[styles.thumb, { left: thumbLeft }]} />
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
