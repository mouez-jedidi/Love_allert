import {
  registerForNotifications,
  onNotificationResponse,
} from '../services/notifications';
import { useEffect, useRef } from 'react';
import { startGPS, stopGPS } from '../services/gps';
import { connectSocket, disconnectSocket } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  Easing, SafeAreaView, TouchableOpacity,
} from 'react-native';

export default function HomeScreen({ navigation }) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;
  const opacity3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const pulseRing = (scale, opacity, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1.8,
              duration: 2000,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 1,
              duration: 0,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.5,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    pulseRing(pulse1, opacity1, 0);
    pulseRing(pulse2, opacity2, 600);
    pulseRing(pulse3, opacity3, 1200);

    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ])
    ).start();
  }, []);
useEffect(() => {
  initApp();
  return () => {
    stopGPS();
    disconnectSocket();
  };
}, []);

const initApp = async () => {
  // Connect socket
  await connectSocket();

  // Register for notifications
  await registerForNotifications();

  // Handle notification tap → navigate to Match screen
  onNotificationResponse((response) => {
    const matchId = response.notification.request.content.data?.matchId;
    if (matchId) {
      navigation.navigate('Match', { matchId });
    }
  });

  // Start GPS
  await startGPS((match) => {
    navigation.navigate('Match', { matchId: match.matchId });
  });
};
  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>
          Love<Text style={styles.logoAccent}>Alert</Text>
        </Text>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Main animation */}
      <View style={styles.center}>

        {/* Pulse rings */}
        <Animated.View style={[
          styles.ring,
          { transform: [{ scale: pulse1 }], opacity: opacity1 }
        ]} />
        <Animated.View style={[
          styles.ring,
          { transform: [{ scale: pulse2 }], opacity: opacity2 }
        ]} />
        <Animated.View style={[
          styles.ring,
          { transform: [{ scale: pulse3 }], opacity: opacity3 }
        ]} />

        {/* Heart */}
        <Animated.View style={[
          styles.heartContainer,
          { transform: [{ scale: heartScale }] }
        ]}>
          <Text style={styles.heartEmoji}>💘</Text>
        </Animated.View>

      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>En recherche...</Text>
        <Text style={styles.statusSub}>
          L'application détecte automatiquement{'\n'}
          les personnes compatibles près de vous
        </Text>

        {/* GPS indicator */}
        <View style={styles.gpsRow}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>GPS actif · Tunis</Text>
        </View>
      </View>

      {/* Info cards */}
      <View style={styles.cardsRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoTitle}>Anonyme</Text>
          <Text style={styles.infoDesc}>Identité révélée progressivement</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💬</Text>
          <Text style={styles.infoTitle}>Consentement</Text>
          <Text style={styles.infoDesc}>Chat uniquement si les deux acceptent</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>❤️</Text>
          <Text style={styles.infoTitle}>Confiance</Text>
          <Text style={styles.infoDesc}>Jauge de confiance mutuelle</Text>
        </View>
      </View>

      {/* Bottom nav */}
      <BottomNav navigation={navigation} active="Home" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logo: { fontSize: 22, fontWeight: '800', color: '#fff' },
  logoAccent: { color: '#FF3366' },
  profileBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  profileIcon: { fontSize: 18 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    borderColor: '#FF3366',
  },
  heartContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 30,
    elevation: 20,
  },
  heartEmoji: { fontSize: 44 },

  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  statusTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  statusSub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  gpsDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  gpsText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },

  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 80,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 4,
  },
  infoIcon: { fontSize: 20 },
  infoTitle: {
    color: '#fff', fontSize: 11,
    fontWeight: '700', textAlign: 'center',
  },
  infoDesc: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9, textAlign: 'center', lineHeight: 13,
  },


});