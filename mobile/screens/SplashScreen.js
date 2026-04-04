import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
// Note: Svg and Path require react-native-svg to be installed
import { Svg, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// 1. Defining the Abstract Heart Path
// This is a professional, slightly elongated path for an editorial look.
const HEART_PATH = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

// Constants for the glow color
const GLOW_COLOR = 'rgba(217, 160, 102, 0.4)'; // Matching copper/gold

export default function SplashScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(30)).current;
  
  // 2. Pulse Animation Node
  const pulseScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Standard entry fade/slide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Gradual Pulse Loop
    // This defines a gentle, gradual expand/contract
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, {
          toValue: 1.15, // Expand slightly
          duration: 3500, // Very gradual
          useNativeDriver: true,
        }),
        Animated.timing(pulseScale, {
          toValue: 1.0, // Return to normal
          duration: 3500, // Very gradual
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 4. Background Glowing Heart System */}
      <Animated.View style={[
        styles.heartContainer,
        {
          transform: [{ scale: pulseScale }], // Applied pulse
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1], // Fade-in with text
          })
        }
      ]}>
        {/* Layer 1: The Blur/Glow */}
        <Svg height="100%" width="100%" viewBox="0 0 24 24" style={styles.heartGlow}>
          <Path
            d={HEART_PATH}
            fill={GLOW_COLOR} // Transparent copper
          />
        </Svg>
        {/* Layer 2: The Sharp Outline */}
        <Svg height="100%" width="100%" viewBox="0 0 24 24" style={styles.heartOutline}>
          <Path
            d={HEART_PATH}
            fill="none"
            stroke={GLOW_COLOR} // Wireframe look
            strokeWidth={0.3} // Minimalist thickness
          />
        </Svg>
      </Animated.View>

      {/* Foreground Content (Remains same as previous design) */}
      <Animated.View 
        style={[
          styles.footer, 
          { opacity: fadeAnim, transform: [{ translateY: slideUp }] }
        ]}
      >
        <View style={styles.textStack}>
          <Text style={styles.brandTitle}>LOVE</Text>
          <Text style={styles.brandSubtitle}>ALERT</Text>
        </View>

        <View style={styles.separator} />
        
        <Text style={styles.description}>
          PREMIUM PROXIMITY NETWORKING
        </Text>

        <TouchableOpacity 
          activeOpacity={0.8}
          style={styles.primaryBtn} 
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={styles.primaryBtnText}>BEGIN EXPERIENCE</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn} 
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.secondaryBtnText}>EXISTING MEMBER</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 5. Layout for Background Elements
  heartContainer: {
    position: 'absolute',
    top: height * 0.1, // Positions it roughly under "LOVE ALERT"
    width: width * 0.8, // Large background element
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1, // Ensures it stays underneath text
  },
  heartGlow: {
    position: 'absolute',
    // To simulate glow without complex blur libraries, we use 
    // slight opacity on a filled path, looping scale
  },
  heartOutline: {
    position: 'absolute',
    opacity: 0.2, // Minimalist presence
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  textStack: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 50,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 15,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D9A066', // Copper
    letterSpacing: 8,
    marginTop: -5,
  },
  separator: {
    width: 20,
    height: 1,
    backgroundColor: '#333',
    marginVertical: 20,
  },
  description: {
    fontSize: 10,
    color: '#666',
    letterSpacing: 2,
    marginBottom: 50,
    fontWeight: '600',
  },
  primaryBtn: {
    width: '100%',
    height: 58,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
  },
  secondaryBtn: {
    marginTop: 25,
  },
  secondaryBtnText: {
    color: '#444',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});