import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BD6', '#845EC2', '#FF9671', '#008F7A'];
const PIECE_SIZE = 10;

interface Piece {
  x: number;
  y: Animated.Value;
  color: string;
  size: number;
  rotation: Animated.Value;
  duration: number;
  delay: number;
}

function createPieces(count: number): Piece[] {
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: new Animated.Value(-20),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 8,
    rotation: new Animated.Value(0),
    duration: 2000 + Math.random() * 3000,
    delay: Math.random() * 1000,
  }));
}

export default function Confetti({ count = 40, duration = 4000 }: { count?: number; duration?: number }) {
  const pieces = useRef(createPieces(count)).current;

  useEffect(() => {
    const animations = pieces.map(p =>
      Animated.parallel([
        Animated.timing(p.y, {
          toValue: height + 20,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.rotation, {
          toValue: 3,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        }),
      ])
    );
    Animated.stagger(40, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.piece,
            {
              left: p.x,
              width: p.size,
              height: p.size * 0.6,
              backgroundColor: p.color,
              transform: [
                { translateY: p.y },
                { rotate: p.rotation.interpolate({ inputRange: [0, 3], outputRange: ['0deg', '1080deg'] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    borderRadius: 2,
  },
});
