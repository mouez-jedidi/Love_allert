import {
  registerForNotifications,
  onNotificationResponse,
} from '../services/notifications';
import { useEffect, useRef, useState } from 'react';
import { startGPS, stopGPS } from '../services/gps';
import { connectSocket, disconnectSocket, onNewMatch, offNewMatch } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BottomNav from '../components/BottomNav';
import { API_URL } from '../config';
import {
  View, Text, StyleSheet, Animated,
  Easing, SafeAreaView, TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';

export default function HomeScreen({ navigation }) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;
  const opacity3 = useRef(new Animated.Value(0.2)).current;
  const [currentLocation, setCurrentLocation] = useState('Détection...');

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
  offNewMatch();
};
  }, []);

  const initApp = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        navigation.navigate('Splash');
        return;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await AsyncStorage.clear();
        navigation.navigate('Splash');
        return;
      }

      const me = await res.json();

      if (!me.photo) {
        navigation.replace('Profile');
        return;
      }

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          const REGION_COORDS = [
            { name: 'Tunis', lat: 36.8, lon: 10.18 },
            { name: 'Sfax', lat: 34.74, lon: 10.76 },
            { name: 'Sousse', lat: 35.83, lon: 10.64 },
            { name: 'Monastir', lat: 35.78, lon: 10.83 },
            { name: 'Bizerte', lat: 37.27, lon: 9.87 },
            { name: 'Gabès', lat: 33.88, lon: 10.1 },
            { name: 'Ariana', lat: 36.86, lon: 10.19 },
            { name: 'Nabeul', lat: 36.45, lon: 10.73 },
            { name: 'Béja', lat: 36.73, lon: 9.18 },
            { name: 'Kairouan', lat: 35.68, lon: 10.1 },
            { name: 'Mahdia', lat: 35.5, lon: 11.06 },
            { name: 'Gafsa', lat: 34.42, lon: 8.78 },
            { name: 'Kébili', lat: 33.7, lon: 8.97 },
            { name: 'Medenine', lat: 33.35, lon: 10.5 },
            { name: 'Tozeur', lat: 33.92, lon: 8.13 },
            { name: 'Tataouine', lat: 32.93, lon: 10.45 },
            { name: 'Jendouba', lat: 36.5, lon: 8.78 },
            { name: 'Kef', lat: 36.18, lon: 8.71 },
            { name: 'Siliana', lat: 36.08, lon: 9.37 },
            { name: 'Kasserine', lat: 35.17, lon: 8.83 },
            { name: 'Sidi Bouzid', lat: 35.03, lon: 9.48 },
            { name: 'Zaghouan', lat: 36.4, lon: 10.14 },
            { name: 'Manouba', lat: 36.81, lon: 10.1 },
            { name: 'Ben Arous', lat: 36.75, lon: 10.22 },
          ];

          const { latitude, longitude } = loc.coords;
          let closest = 'Tunisie';
          let minDist = Infinity;

          REGION_COORDS.forEach(r => {
            const dist = Math.sqrt(
              Math.pow(r.lat - latitude, 2) +
              Math.pow(r.lon - longitude, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              closest = r.name;
            }
          });

          setCurrentLocation(closest);
        }
      } catch {
        setCurrentLocation('Tunisie');
      }

      await connectSocket();
      // Listen for matches from server (for BOTH users)
const userStr = await AsyncStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;
if (user) {
  onNewMatch(user.id, (data) => {
    console.log('💘 New match received via socket!', data);
    navigation.navigate('Match', { matchId: data.matchId });
  });
}
      await registerForNotifications();

      onNotificationResponse((response) => {
        const matchId = response?.notification?.request?.content?.data?.matchId;
        if (matchId) navigation.navigate('Match', { matchId });
      });

      await startGPS((match) => {
        navigation.navigate('Match', { matchId: match.matchId });
      });

      console.log('App initialized');
    } catch (err) {
      console.log('Init error:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoStack}>
          <Text style={styles.logoTitle}>LOVE</Text>
          <Text style={styles.logoSubtitle}>ALERT</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.profileBtnText}>PROFIL</Text>
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

        {/* Heart symbol (text, no emoji) */}
        <Animated.View style={[
          styles.heartContainer,
          { transform: [{ scale: heartScale }] }
        ]}>
          <Text style={styles.heartSymbol}>♥</Text>
        </Animated.View>

      </View>

      {/* Status text */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>EN RECHERCHE</Text>
        <Text style={styles.statusSub}>
          L'application détecte automatiquement{'\n'}
          les personnes compatibles près de vous
        </Text>

        {/* GPS indicator */}
        <View style={styles.gpsRow}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>GPS actif · {currentLocation}</Text>
        </View>
      </View>

      {/* Info cards - no icons, only text */}
      <View style={styles.cardsRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Anonyme</Text>
          <Text style={styles.infoDesc}>Identité révélée progressivement</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Consentement</Text>
          <Text style={styles.infoDesc}>Chat uniquement si les deux acceptent</Text>
        </View>
        <View style={styles.infoCard}>
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
  container: { flex: 1, backgroundColor: '#050505' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  logoStack: {
    alignItems: 'flex-start',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 8,
  },
  logoSubtitle: {
    fontSize: 8,
    fontWeight: '800',
    color: '#D9A066',
    letterSpacing: 4,
    marginTop: -2,
  },
  profileBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'transparent',
  },
  profileBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },

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
    borderColor: '#D9A066',
  },
  heartContainer: {
    width: 100, height: 100,
    borderRadius: 50,
    backgroundColor: '#D9A066',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D9A066',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 25,
    elevation: 15,
  },
  heartSymbol: {
    fontSize: 44,
    color: '#050505',
    fontWeight: '300',
  },

  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginBottom: 28,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 3,
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
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  gpsDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  gpsText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 0.5 },

  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 80,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
  },
  infoTitle: {
    color: '#D9A066', fontSize: 11,
    fontWeight: '700', letterSpacing: 1, textAlign: 'center',
  },
  infoDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9, textAlign: 'center', lineHeight: 12,
  },
});