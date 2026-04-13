import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing,
  SafeAreaView, TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { registerForNotifications, onNotificationResponse } from '../services/notifications';
import { startGPS, stopGPS } from '../services/gps';
import { connectSocket, disconnectSocket, onNewMatch, offNewMatch } from '../services/socket';
import BottomNav from '../components/BottomNav';
import { API_URL } from '../config';

// Nom de la tâche de fond
const LOCATION_TASK_NAME = 'background-location-task';

// --- DÉFINITION DE LA TÂCHE DE FOND (En dehors du composant) ---
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Erreur TaskManager:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // 1. Mettre à jour la position sur le serveur
      await fetch(`${API_URL}/users/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      // 2. Lancer la vérification de proximité (le serveur enverra un Push si Match)
      await fetch(`${API_URL}/matches/check-nearby`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

    } catch (err) {
      console.log("Erreur background task:", err.message);
    }
  }
});

export default function HomeScreen({ navigation }) {
  // --- REFS POUR LES ANIMATIONS ---
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.6)).current;
  const opacity2 = useRef(new Animated.Value(0.4)).current;
  const opacity3 = useRef(new Animated.Value(0.2)).current;
  
  const [currentLocation, setCurrentLocation] = useState('Détection...');

  useEffect(() => {
    // --- DÉMARRAGE DES ANIMATIONS ---
    const pulseRing = (scale, opacity, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1.8, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };

    pulseRing(pulse1, opacity1, 0);
    pulseRing(pulse2, opacity2, 600);
    pulseRing(pulse3, opacity3, 1200);

    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
        Animated.timing(heartScale, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(800),
      ])
    ).start();

    initApp();

    return () => {
      stopGPS();
      offNewMatch();
    };
  }, []);

  const initApp = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return navigation.navigate('Login');

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await AsyncStorage.clear();
        return navigation.navigate('Login');
      }

      const me = await res.json();
      if (!me.photo) return navigation.replace('Profile');

      // --- CONFIGURATION GPS (PREMIER PLAN + ARRIÈRE-PLAN) ---
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (fgStatus === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation("Scanner actif");

        // Demander la permission arrière-plan pour le mode "WhatsApp"
        const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (bgStatus === 'granted') {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 60000, // Toutes les 60 secondes
            distanceInterval: 30, // Ou tous les 30 mètres
            foregroundService: {
              notificationTitle: "Love Alert est en recherche",
              notificationBody: "Nous surveillons les profils à proximité...",
              notificationColor: "#D9A066",
            },
          });
        }
      }

      // --- SOCKET ET MATCHING (TEMPS RÉEL) ---
      await connectSocket();
      
      onNewMatch((data) => {
        console.log('💘 Nouveau Match Détecté !', data.matchId);
        navigation.navigate('Match', { matchId: data.matchId });
      });

      // --- NOTIFICATIONS PUSH ---
      await registerForNotifications();
      onNotificationResponse((response) => {
        const matchId = response?.notification?.request?.content?.data?.matchId;
        if (matchId) navigation.navigate('Match', { matchId });
      });

    } catch (err) {
      console.log('Init error:', err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoStack}>
          <Text style={styles.logoTitle}>LOVE</Text>
          <Text style={styles.logoSubtitle}>ALERT</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate('MyProfile')}>
          <Text style={styles.profileBtnText}>PROFIL</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse1 }], opacity: opacity1 }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse2 }], opacity: opacity2 }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse3 }], opacity: opacity3 }]} />

        <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
          <Text style={styles.heartSymbol}>♥</Text>
        </Animated.View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>EN RECHERCHE</Text>
        <Text style={styles.statusSub}>Détection automatique à proximité</Text>
        <View style={styles.gpsRow}>
          <View style={styles.gpsDot} />
          <Text style={styles.gpsText}>GPS actif · {currentLocation}</Text>
        </View>
      </View>

      <BottomNav navigation={navigation} active="Home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16 },
    logoStack: { alignItems: 'flex-start' },
    logoTitle: { fontSize: 20, fontWeight: '200', color: '#FFFFFF', letterSpacing: 8 },
    logoSubtitle: { fontSize: 8, fontWeight: '800', color: '#D9A066', letterSpacing: 4, marginTop: -2 },
    profileBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    profileBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 1.5, borderColor: '#D9A066' },
    heartContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D9A066', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
    heartSymbol: { fontSize: 44, color: '#050505' },
    statusContainer: { alignItems: 'center', paddingHorizontal: 32, marginBottom: 80 },
    statusTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', letterSpacing: 3, marginBottom: 10 },
    statusSub: { color: 'rgba(255,255,255,0.35)', fontSize: 13, textAlign: 'center', marginBottom: 16 },
    gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    gpsDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
    gpsText: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
});