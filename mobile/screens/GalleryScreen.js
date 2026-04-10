import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Image, Platform,
  Alert, Modal, Animated, Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { addToGallery, removeFromGallery, getMe } from '../services/api';
import { uploadPhoto } from '../services/upload';

const { width, height } = Dimensions.get('window');

export default function GalleryScreen({ navigation, route }) {
  const { trustPercent = 0, isOwnProfile = true } = route.params || {};
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFab, setShowFab] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [likes, setLikes] = useState({});
  const isUnlocked = trustPercent >= 90;

  const heartAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(null);

  useEffect(() => { loadGallery(); }, []);

  const loadGallery = async () => {
    try {
      const me = await getMe();
      setGallery(me.gallery || []);
    } catch (err) {
      console.log('Gallery error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPhoto = async () => {
    setShowFab(false);
    if (Platform.OS === 'web') {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        try {
          const url = await uploadPhoto(result.assets[0].uri);
          if (url) {
            await addToGallery(url);
            setGallery(prev => [...prev, url]);
          }
        } catch (err) {
          console.log('Add photo error:', err.message);
        }
      }
    } else {
      navigation.navigate('Camera', {
        onPhotoTaken: async (photoPath) => {
          try {
            const url = await uploadPhoto(photoPath);
            if (url) {
              await addToGallery(url);
              setGallery(prev => [...prev, url]);
            }
          } catch (err) {
            console.log('Add photo error:', err.message);
          }
        },
      });
    }
  };

  const handlePickFromGallery = async () => {
    setShowFab(false);
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Platform.OS === 'web'
          ? window.alert('Permission refusée')
          : Alert.alert('Permission refusée');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        const url = await uploadPhoto(result.assets[0].uri);
        if (url) {
          await addToGallery(url);
          setGallery(prev => [...prev, url]);
        }
      }
    } catch (err) {
      console.log('Pick gallery error:', err.message);
    }
  };

  const handleRemovePhoto = async (photoUrl) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Supprimer cette photo ?')
      : true;
    if (!confirm) return;
    try {
      await removeFromGallery(photoUrl);
      setGallery(prev => prev.filter(p => p !== photoUrl));
      setSelectedPhoto(null);
    } catch (err) {
      console.log('Remove error:', err.message);
    }
  };

  const handleDoubleTap = (photoUrl) => {
    const now = Date.now();
    if (lastTap.current && now - lastTap.current < 300) {
      setLikes(prev => ({
        ...prev,
        [photoUrl]: (prev[photoUrl] || 0) + 1,
      }));
      heartAnim.setValue(0);
      Animated.sequence([
        Animated.spring(heartAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(heartAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
    lastTap.current = now;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Galerie</Text>
        <View style={{ width: 70 }} />
      </View>

      {!isOwnProfile && !isUnlocked && (
        <View style={styles.lockBanner}>
          <Text style={styles.lockBannerIcon}>⌘</Text>
          <View>
            <Text style={styles.lockBannerTitle}>Galerie verrouillée</Text>
            <Text style={styles.lockBannerSub}>
              90% de confiance requis ({trustPercent}% actuellement)
            </Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content}>
        {gallery.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>
              {isOwnProfile ? 'Aucune photo' : 'Galerie vide'}
            </Text>
            {isOwnProfile && (
              <Text style={styles.emptySub}>
                Appuyez sur + pour ajouter vos premières photos.{'\n'}
                Visibles uniquement avec 90%+ de confiance.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.grid}>
            {gallery.map((photoUrl, index) => (
              <TouchableOpacity
                key={index}
                style={styles.photoWrap}
                onPress={() => {
                  handleDoubleTap(photoUrl);
                  setSelectedPhoto(photoUrl);
                }}
                activeOpacity={0.9}>
                {!isOwnProfile && !isUnlocked ? (
                  <View style={styles.lockedPhoto}>
                    <Text style={styles.lockedPhotoIcon}>X</Text>
                  </View>
                ) : (
                  <Image source={{ uri: photoUrl }} style={styles.photo} />
                )}
                {likes[photoUrl] > 0 && (
                  <View style={styles.likeBadge}>
                    <Text style={styles.likeBadgeText}>♥ {likes[photoUrl]}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {isOwnProfile && (
        <View style={styles.fabContainer}>
          {showFab && (
            <View style={styles.fabSubContainer}>
              <TouchableOpacity
                style={styles.fabSubBtn}
                onPress={handlePickFromGallery}>
                <Text style={styles.fabSubText}>Galerie</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.fabSubBtn}
                onPress={handleAddPhoto}>
                <Text style={styles.fabSubText}>Caméra</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => setShowFab(!showFab)}>
            <Text style={styles.fabIcon}>{showFab ? '×' : '+'}</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}>
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}>
            <Text style={styles.modalCloseText}>X</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalPhotoWrap}
            onPress={() => handleDoubleTap(selectedPhoto)}>
            <Image
              source={{ uri: selectedPhoto }}
              style={styles.modalPhoto}
              resizeMode="contain"
            />
            <Animated.Text style={[
              styles.heartAnim,
              {
                opacity: heartAnim,
                transform: [{ scale: heartAnim }],
              }
            ]}>
              ♥
            </Animated.Text>
          </TouchableOpacity>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={() => handleDoubleTap(selectedPhoto)}>
              <Text style={styles.likeBtnIcon}>♥</Text>
              <Text style={styles.likeBtnText}>
                {likes[selectedPhoto] || 0}
              </Text>
            </TouchableOpacity>

            {isOwnProfile && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleRemovePhoto(selectedPhoto)}>
                <Text style={styles.deleteBtnText}>Supprimer</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {showFab && (
        <TouchableOpacity
          style={styles.fabBackdrop}
          onPress={() => setShowFab(false)}
          activeOpacity={1}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 0.5, width: 70 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },

  lockBanner: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, margin: 16,
    backgroundColor: 'rgba(217,160,102,0.08)',
    borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(217,160,102,0.2)',
  },
  lockBannerIcon: { fontSize: 24, color: '#D9A066' },
  lockBannerTitle: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  lockBannerSub: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },

  content: { padding: 2, paddingBottom: 100 },
  emptyState: {
    alignItems: 'center', paddingTop: 80, gap: 12, padding: 32,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', letterSpacing: 1, textAlign: 'center' },
  emptySub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12, textAlign: 'center', lineHeight: 20,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  photoWrap: {
    width: '32.5%',
    aspectRatio: 1,
    position: 'relative',
  },
  photo: { width: '100%', height: '100%' },
  lockedPhoto: {
    width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  lockedPhotoIcon: { fontSize: 24, color: '#D9A066' },
  likeBadge: {
    position: 'absolute', bottom: 6, left: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2,
  },
  likeBadgeText: { color: '#D9A066', fontSize: 10, fontWeight: '600' },

  fabContainer: {
    position: 'absolute', bottom: 30, right: 20,
    alignItems: 'flex-end', gap: 10, zIndex: 100,
  },
  fabSubContainer: {
    alignItems: 'flex-end', gap: 8, marginBottom: 8,
  },
  fabSubBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10,
  },
  fabSubText: {
    color: '#fff', fontSize: 12, fontWeight: '500', letterSpacing: 0.5,
  },
  fab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#D9A066',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D9A066',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  fabIcon: { color: '#050505', fontSize: 28, fontWeight: '300' },
  fabBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalClose: {
    position: 'absolute', top: 50, right: 20,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  modalCloseText: { color: '#fff', fontSize: 16 },
  modalPhotoWrap: {
    width: width, height: width,
    alignItems: 'center', justifyContent: 'center',
  },
  modalPhoto: { width: width, height: width },
  heartAnim: {
    position: 'absolute',
    fontSize: 80,
    color: '#D9A066',
  },
  modalActions: {
    position: 'absolute', bottom: 60,
    flexDirection: 'row', gap: 16,
    alignItems: 'center',
  },
  likeBtn: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  likeBtnIcon: { color: '#D9A066', fontSize: 18 },
  likeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 30,
    borderWidth: 1, borderColor: 'rgba(217,160,102,0.4)',
  },
  deleteBtnText: { color: '#D9A066', fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
});