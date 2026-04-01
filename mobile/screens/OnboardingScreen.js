import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, Dimensions, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: '💘',
    title: 'Bienvenue sur\nLoveAlert',
    subtitle: 'L\'application de rencontres basée sur la proximité réelle. Rencontrez des personnes compatibles près de vous.',
    color: '#FF3366',
  },
  {
    id: '2',
    icon: '📡',
    title: 'Détection\nautomatique',
    subtitle: 'Notre algorithme GPS détecte automatiquement les personnes compatibles dans votre entourage.',
    color: '#e91e8c',
  },
  {
    id: '3',
    icon: '🔒',
    title: 'Anonymat\ntotal',
    subtitle: 'Votre identité reste cachée. Elle se révèle progressivement au fil de vos échanges.',
    color: '#9b59b6',
  },
  {
    id: '4',
    icon: '❤️',
    title: 'Jauge de\nconfiance',
    subtitle: 'Construisez la confiance jour après jour. À 90%, le profil complet se débloque.',
    color: '#FF3366',
  },
  {
    id: '5',
    icon: '✅',
    title: 'Consentement\nmutuel',
    subtitle: 'Le chat s\'ouvre uniquement si les deux personnes acceptent. Votre sécurité est notre priorité.',
    color: '#22c55e',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

const handleNext = () => {
  if (currentIndex < SLIDES.length - 1) {
    const nextIndex = currentIndex + 1;
    flatListRef.current?.scrollToOffset({
      offset: nextIndex * width,
      animated: true,
    });
    setCurrentIndex(nextIndex);
  } else {
    handleFinish();
  }
};

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    navigation.navigate('Splash');
  };

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    navigation.navigate('Splash');
  };

  const renderSlide = ({ item }) => (
    <View style={styles.slide}>
      <View style={[styles.iconCircle, { backgroundColor: item.color }]}>
        <Text style={styles.icon}>{item.icon}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>

      {/* Skip button */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Passer</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />

      {/* Bottom section */}
      <View style={styles.bottom}>

        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [
              (i - 1) * width,
              i * width,
              (i + 1) * width,
            ];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* Next / Get started button */}
        <TouchableOpacity
          style={[
            styles.btn,
            currentIndex === SLIDES.length - 1 && styles.btnGreen,
          ]}
          onPress={handleNext}>
          <Text style={styles.btnText}>
            {currentIndex === SLIDES.length - 1
              ? '🚀 Commencer'
              : 'Suivant →'}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0d0a12',
  },

  skipBtn: {
    position: 'absolute', top: 50, right: 24,
    zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  skipText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 24,
  },

  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 40,
    elevation: 20,
    marginBottom: 10,
  },
  icon: { fontSize: 64 },

  title: {
    color: '#fff', fontSize: 34,
    fontWeight: '800', textAlign: 'center',
    lineHeight: 42,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 15, textAlign: 'center',
    lineHeight: 24,
  },

  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 50,
    gap: 24,
    alignItems: 'center',
  },

  dotsRow: {
    flexDirection: 'row',
    gap: 6, alignItems: 'center',
  },
  dot: {
    height: 8, borderRadius: 4,
    backgroundColor: '#FF3366',
  },

  btn: {
    width: '100%', backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnGreen: { backgroundColor: '#22c55e' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});