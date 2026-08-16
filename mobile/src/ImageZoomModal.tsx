import { useRef, useState } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const ZOOM_SCALE = 2.5;

interface Props {
  uri: string | null;
  onClose: () => void;
}

export default function ImageZoomModal({ uri, onClose }: Props) {
  const [zoomed, setZoomed] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const lastTap = useRef(0);

  function reset() {
    setZoomed(false);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translate, { toValue: { x: 0, y: 0 }, useNativeDriver: true }),
    ]).start();
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (zoomed) {
        reset();
      } else {
        setZoomed(true);
        Animated.spring(scale, { toValue: ZOOM_SCALE, useNativeDriver: true }).start();
      }
    }
    lastTap.current = now;
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => zoomed,
      onPanResponderMove: Animated.event([null, { dx: translate.x, dy: translate.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        translate.extractOffset();
      },
    })
  ).current;

  return (
    <Modal visible={!!uri} animationType="fade" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        {uri && (
          <TouchableOpacity activeOpacity={1} style={styles.imageWrap} onPress={handleTap} {...panResponder.panHandlers}>
            <Animated.Image
              source={{ uri }}
              style={[
                styles.image,
                { transform: [{ scale }, { translateX: translate.x }, { translateY: translate.y }] },
              ]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  closeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  imageWrap: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
});
