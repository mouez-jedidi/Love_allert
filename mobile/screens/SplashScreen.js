import { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const heartScale = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in everything
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Heartbeat loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.2,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        
        {/* Heart */}
        <Animated.Text
          style={[styles.heart, { transform: [{ scale: heartScale }] }]}>
          💘
        </Animated.Text>

        {/* App name */}
        <Text style={styles.appName}>
          Love<Text style={styles.appNameAccent}>Alert</Text>
        </Text>

        <Text style={styles.tagline}>RENCONTRES RÉELLES · GPS</Text>

        {/* Button */}
<TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Auth')}>
  <Text style={styles.btnText}>Créer mon profil</Text>
</TouchableOpacity>

<TouchableOpacity onPress={() => navigation.navigate('Login')}>
  <Text style={styles.loginLink}>J'ai déjà un compte</Text>
</TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0a12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  heart: {
    fontSize: 72,
    marginBottom: 8,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -1,
  },
  appNameAccent: {
    color: '#FF3366',
  },
  tagline: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 3,
    marginBottom: 48,
  },
  btn: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  loginLink: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13,
    marginTop: 8,
    textDecorationLine: 'underline',
  },
});