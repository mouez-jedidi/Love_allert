import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function LoadingScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 500, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.2, duration: 600, useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1, duration: 600, useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Animated.Text style={[styles.heart, { transform: [{ scale: pulse }] }]}>
        💘
      </Animated.Text>
      <Text style={styles.title}>
        Love<Text style={styles.accent}>Alert</Text>
      </Text>
      <Text style={styles.loading}>Chargement...</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0d0a12',
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  heart: { fontSize: 64 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  accent: { color: '#FF3366' },
  loading: { color: 'rgba(255,255,255,0.3)', fontSize: 14, letterSpacing: 2 },
});