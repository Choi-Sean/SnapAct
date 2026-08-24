import { useRef } from 'react';
import { Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DELETE_WIDTH = 88;
const RUBBER_BAND = 0.25;
const SPRING_CONFIG = { useNativeDriver: true, tension: 260, friction: 24 };

export default function SwipeableRow({ onDelete, children }: { onDelete: () => void; children: React.ReactNode }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 8 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderMove: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        let next = base + g.dx;
        if (next < -DELETE_WIDTH) {
          // Rubber-band past the fully-open position instead of hard-stopping.
          const overshoot = -DELETE_WIDTH - next;
          next = -DELETE_WIDTH - overshoot * RUBBER_BAND;
        }
        translateX.setValue(Math.min(24, next));
      },
      onPanResponderRelease: (_, g) => {
        const base = openRef.current ? -DELETE_WIDTH : 0;
        const shouldOpen = base + g.dx < -DELETE_WIDTH / 2;
        openRef.current = shouldOpen;
        Animated.spring(translateX, { toValue: shouldOpen ? -DELETE_WIDTH : 0, ...SPRING_CONFIG }).start();
      },
    })
  ).current;

  function handleDelete() {
    openRef.current = false;
    Animated.timing(translateX, { toValue: -420, duration: 220, useNativeDriver: true }).start(() => {
      translateX.setValue(0);
      onDelete();
    });
  }

  const reveal = translateX.interpolate({
    inputRange: [-DELETE_WIDTH, -DELETE_WIDTH * 0.35, 0],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <View style={styles.deleteBackdrop}>
        <Animated.View
          style={[
            styles.deleteButtonWrap,
            {
              opacity: reveal,
              transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
            },
          ]}
        >
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} activeOpacity={0.8}>
            <Text style={styles.deleteEmoji}>🗑️</Text>
          </TouchableOpacity>
        </Animated.View>
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
  deleteButtonWrap: {
    width: DELETE_WIDTH - 18,
    height: '82%',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ef4444',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deleteEmoji: { fontSize: 22 },
});
