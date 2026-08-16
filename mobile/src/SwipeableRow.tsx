import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DELETE_WIDTH = 76;

interface Props {
  onDelete: () => void;
  children: React.ReactNode;
}

export default function SwipeableRow({ onDelete, children }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const next = base + g.dx;
        translateX.setValue(Math.min(0, Math.max(-DELETE_WIDTH, next)));
      },
      onPanResponderRelease: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const shouldOpen = base + g.dx < -DELETE_WIDTH / 2;
        openRef.current = shouldOpen;
        Animated.spring(translateX, {
          toValue: shouldOpen ? -DELETE_WIDTH : 0,
          useNativeDriver: true,
          bounciness: 0,
        }).start();
      },
    })
  ).current;

  function handleDelete() {
    openRef.current = false;
    Animated.timing(translateX, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    onDelete();
  }

  return (
    <View style={styles.container}>
      <View style={styles.deleteBackdrop}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.75}>
          <Text style={styles.deleteEmoji}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  deleteBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: DELETE_WIDTH - 12,
    height: '100%',
    backgroundColor: '#dc2626',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteEmoji: { fontSize: 20 },
});
