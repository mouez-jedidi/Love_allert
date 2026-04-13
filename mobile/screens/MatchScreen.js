import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, SafeAreaView,
} from 'react-native';
import { respondToMatch } from '../services/api';
import { onMatchAccepted, offMatchAccepted } from '../services/socket';

export default function MatchScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [decision, setDecision] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(null);

  const heartScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animation d'entrée
    Animated.parallel([
      Animated.spring(heartScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
      Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // ÉCOUTER SI LE MATCH DEVIENT ACTIF (L'autre a accepté)
    onMatchAccepted((data) => {
      if (data.matchId === matchId) {
        console.log("🚀 Match validé par les deux ! Ouverture du chat.");
        navigation.replace('Chat', { matchId });
      }
    });

    return () => {
      offMatchAccepted();
    };
  }, [matchId]);

  const handleAccept = async () => {
    setDecision('accepted');
    setWaiting(true);
    try {
      const res = await respondToMatch(matchId, true);
      // Si res.chatOpen est vrai, ça veut dire que l'autre avait déjà accepté
      if (res.chatOpen) {
        navigation.replace('Chat', { matchId });
      }
    } catch (err) {
      setError('Erreur de connexion');
      setDecision(null);
      setWaiting(false);
    }
  };

  const handleRefuse = async () => {
    setDecision('refused');
    try {
      await respondToMatch(matchId, false);
      setTimeout(() => navigation.navigate('Home'), 1500);
    } catch (err) {
      setDecision(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
          <Text style={styles.heartEmoji}>💘</Text>
        </Animated.View>

        <Text style={styles.title}>Love<Text style={styles.titleAccent}>Alert</Text> !</Text>
        <Text style={styles.subtitle}>Une personne compatible est proche !</Text>

        {!decision ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnRefuse} onPress={handleRefuse}>
              <Text style={styles.btnRefuseText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
              <Text style={styles.btnAcceptText}>Accepter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.waitingState}>
            <Text style={styles.waitingEmoji}>{decision === 'accepted' ? '⏳' : '👋'}</Text>
            <Text style={styles.waitingText}>
              {decision === 'accepted' ? "En attente de l'autre..." : "Match refusé"}
            </Text>
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
      </Animated.View>
    </SafeAreaView>
  );
}

// Les styles de ton fichier original MatchScreen.js s'appliquent ici.
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0d0a12', alignItems: 'center', justifyContent: 'center' },
    content: { alignItems: 'center', paddingHorizontal: 24, width: '100%' },
    heartContainer: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#FF3366', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    heartEmoji: { fontSize: 40 },
    title: { fontSize: 34, fontWeight: '800', color: '#fff' },
    titleAccent: { color: '#FF3366' },
    subtitle: { color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 40 },
    actions: { flexDirection: 'row', gap: 12, width: '100%' },
    btnRefuse: { flex: 1, padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center' },
    btnRefuseText: { color: '#fff' },
    btnAccept: { flex: 2, padding: 16, borderRadius: 14, backgroundColor: '#FF3366', alignItems: 'center' },
    btnAcceptText: { color: '#fff', fontWeight: 'bold' },
    waitingState: { alignItems: 'center', marginTop: 20 },
    waitingEmoji: { fontSize: 40 },
    waitingText: { color: '#fff', fontSize: 16, marginTop: 10 },
    errorText: { color: '#FF3366', marginTop: 20 }
});