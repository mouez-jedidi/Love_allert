import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Alert, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function CameraScreen({ navigation, route }) {
  const { onPhotoTaken } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [facing, setFacing] = useState('front');
  const cameraRef = useRef(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission().then(result => {
        if (!result.granted) {
          Alert.alert(
            '📷 Caméra requise',
            'Love Alert nécessite votre caméra pour vérifier l\'authenticité de votre profil.',
            [{ text: 'Retour', onPress: () => navigation.goBack() }]
          );
        }
      });
    }
  }, [permission]);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const result = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setPhoto(result.uri);
      } catch (err) {
        console.log('Camera error:', err.message);
      }
    }
  };

  const confirmPhoto = () => {
    if (onPhotoTaken) onPhotoTaken(photo);
    navigation.goBack();
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionWrap}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Accès caméra requis</Text>
          <Text style={styles.permissionSub}>
            Love Alert nécessite votre caméra pour garantir l'authenticité des profils.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Autoriser la caméra</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Preview taken photo
  if (photo) {
    return (
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: photo }} style={styles.preview} />
        <View style={styles.previewActions}>
          <Text style={styles.previewTitle}>Cette photo vous ressemble ?</Text>
          <Text style={styles.previewSub}>
            Elle sera utilisée pour vérifier votre identité
          </Text>
          <View style={styles.previewBtns}>
            <TouchableOpacity
              style={styles.retakeBtn}
              onPress={() => setPhoto(null)}>
              <Text style={styles.retakeBtnText}>🔄 Reprendre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={confirmPhoto}>
              <Text style={styles.confirmBtnText}>✓ Utiliser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}>

        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.topBarBtn}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Photo de profil</Text>
          <TouchableOpacity onPress={() =>
            setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Text style={styles.topBarBtn}>🔄</Text>
          </TouchableOpacity>
        </View>

        {/* Face guide */}
        <View style={styles.faceGuide}>
          <View style={styles.faceOval} />
          <Text style={styles.faceHint}>
            Placez votre visage dans le cercle
          </Text>
        </View>

        {/* Bottom */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomHint}>
            <Text style={styles.bottomHintIcon}>🔒</Text>
            <Text style={styles.bottomHintText}>
              Galerie désactivée
            </Text>
          </View>
          <TouchableOpacity style={styles.captureBtn} onPress={takePhoto}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <View style={{ width: 60 }} />
        </View>

      </CameraView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },

  permissionWrap: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 32, gap: 16,
    backgroundColor: '#0d0a12',
  },
  permissionIcon: { fontSize: 60 },
  permissionTitle: {
    color: '#fff', fontSize: 22,
    fontWeight: '800', textAlign: 'center',
  },
  permissionSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14, textAlign: 'center', lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: '#FF3366',
    paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 14, marginTop: 8,
  },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 8 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  camera: { flex: 1 },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20, paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  topBarBtn: { color: '#fff', fontSize: 22 },
  topBarTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  faceGuide: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 16,
  },
  faceOval: {
    width: 220, height: 280, borderRadius: 110,
    borderWidth: 2, borderColor: '#FF3366',
    borderStyle: 'dashed',
  },
  faceHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14, textAlign: 'center',
  },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  bottomHint: { width: 60, alignItems: 'center', gap: 4 },
  bottomHintIcon: { fontSize: 20 },
  bottomHintText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9, textAlign: 'center',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
  },
  captureBtnInner: {
    width: 56, height: 56,
    borderRadius: 28, backgroundColor: '#fff',
  },

  preview: { flex: 1 },
  previewActions: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24, gap: 8, alignItems: 'center',
  },
  previewTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  previewSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13, textAlign: 'center', marginBottom: 8,
  },
  previewBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  retakeBtn: {
    flex: 1, padding: 14, borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  retakeBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  confirmBtn: {
    flex: 2, padding: 14, borderRadius: 12,
    alignItems: 'center', backgroundColor: '#FF3366',
  },
  confirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});