import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Easing, SafeAreaView,
} from 'react-native';
import { respondToMatch } from '../services/api';
import { onMatchAccepted, offMatchAccepted } from '../services/socket';

export default function MatchScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [decision, setDecision] = useState(null); // null | 'accepted' | 'refused'
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState(null);

  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(80)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(cardSlide, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse rings
    const pulseRing = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.8,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    pulseRing(pulse1, 0);
    pulseRing(pulse2, 600);
    pulseRing(pulse3, 1200);

    // Listen for match acceptance from the other user
    onMatchAccepted((data) => {
      if (data.matchId === matchId) {
        navigation.replace('Chat', { matchId });
      }
    });

    return () => {
      offMatchAccepted();
    };
  }, []);

  const handleAccept = async () => {
    setDecision('accepted');
    setWaiting(true);
    try {
      const res = await respondToMatch(matchId, true);
      if (res.chatOpen) {
        // If chat already open (other user already accepted)
        navigation.replace('Chat', { matchId });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur, réessayez');
      setDecision(null);
      setWaiting(false);
    }
  };

  const handleRefuse = async () => {
    setDecision('refused');
    try {
      await respondToMatch(matchId, false);
      setTimeout(() => {
        navigation.navigate('Home');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
      setDecision(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background rings */}
      <View style={styles.ringsContainer}>
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse1 }], opacity: 0.3 }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse2 }], opacity: 0.2 }]} />
        <Animated.View style={[styles.ring, { transform: [{ scale: pulse3 }], opacity: 0.1 }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        <Animated.View style={[styles.heartContainer, { transform: [{ scale: heartScale }] }]}>
          <Text style={styles.heartEmoji}>💘</Text>
        </Animated.View>

        <Text style={styles.title}>Love<Text style={styles.titleAccent}>Alert</Text> !</Text>
        <Text style={styles.subtitle}>
          Une personne compatible{'\n'}est proche de vous
        </Text>

        <Animated.View style={[styles.mysteryCard, { transform: [{ translateY: cardSlide }] }]}>
          <View style={styles.mysteryAvatar}>
            <Text style={styles.mysteryIcon}>❓</Text>
          </View>
          <View style={styles.mysteryInfo}>
            <Text style={styles.mysteryName}>Identité inconnue</Text>
            <Text style={styles.mysteryDesc}>
              Acceptez pour commencer à vous découvrir mutuellement
            </Text>
          </View>
          <View style={styles.lockBadge}>
            <Text style={styles.lockIcon}>🔒</Text>
          </View>
        </Animated.View>

        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>Comment ça marche ?</Text>
          <View style={styles.howSteps}>
            <View style={styles.howStep}>
              <Text style={styles.howStepNum}>1</Text>
              <Text style={styles.howStepText}>Les deux acceptent → Chat ouvert</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howStepNum}>2</Text>
              <Text style={styles.howStepText}>Identité révélée progressivement</Text>
            </View>
            <View style={styles.howStep}>
              <Text style={styles.howStepNum}>3</Text>
              <Text style={styles.howStepText}>90% confiance → Profil complet 🔓</Text>
            </View>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {!decision && (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.btnRefuse} onPress={handleRefuse}>
              <Text style={styles.btnRefuseText}>✕  Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnAccept} onPress={handleAccept}>
              <Text style={styles.btnAcceptText}>💬  Accepter</Text>
            </TouchableOpacity>
          </View>
        )}

        {decision === 'accepted' && waiting && (
          <View style={styles.waitingState}>
            <Text style={styles.waitingEmoji}>⏳</Text>
            <Text style={styles.waitingText}>En attente de l'autre personne...</Text>
            <Text style={styles.waitingHint}>Le chat s'ouvrira si elle accepte aussi</Text>
          </View>
        )}

        {decision === 'refused' && (
          <View style={styles.waitingState}>
            <Text style={styles.waitingEmoji}>👋</Text>
            <Text style={styles.waitingText}>Peut-être la prochaine fois !</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0a12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringsContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', height: '100%',
  },
  ring: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#FF3366',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: '100%',
  },
  heartContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 30,
    elevation: 20,
  },
  heartEmoji: { fontSize: 40 },
  title: {
    fontSize: 34, fontWeight: '800',
    color: '#fff', marginBottom: 8,
  },
  titleAccent: { color: '#FF3366' },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 28,
  },
  mysteryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.25)',
    borderRadius: 20, padding: 16,
    width: '100%', marginBottom: 20,
    gap: 12,
  },
  mysteryAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,51,102,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  mysteryIcon: { fontSize: 24 },
  mysteryInfo: { flex: 1 },
  mysteryName: {
    color: '#fff', fontWeight: '700',
    fontSize: 15, marginBottom: 4,
  },
  mysteryDesc: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11, lineHeight: 16,
  },
  lockBadge: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  lockIcon: { fontSize: 16 },
  howItWorks: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 28,
  },
  howTitle: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11, letterSpacing: 2,
    fontWeight: '600', marginBottom: 12,
    textTransform: 'uppercase',
  },
  howSteps: { gap: 10 },
  howStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howStepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.3)',
    color: '#FF3366', fontSize: 11,
    fontWeight: '700', textAlign: 'center',
    lineHeight: 22,
  },
  howStepText: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  actions: {
    flexDirection: 'row',
    gap: 12, width: '100%',
  },
  btnRefuse: {
    flex: 1, padding: 16,
    borderRadius: 14, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  btnRefuseText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15, fontWeight: '600',
  },
  btnAccept: {
    flex: 2, padding: 16,
    borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FF3366',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15,
    elevation: 10,
  },
  btnAcceptText: {
    color: '#fff', fontSize: 15, fontWeight: '700',
  },
  waitingState: {
    alignItems: 'center', gap: 8,
    padding: 20,
  },
  waitingEmoji: { fontSize: 36 },
  waitingText: {
    color: '#fff', fontSize: 16,
    fontWeight: '600', textAlign: 'center',
  },
  waitingHint: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12, textAlign: 'center',
  },
  errorText: {
    color: '#FF3366',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
});