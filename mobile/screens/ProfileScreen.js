import { uploadPhoto } from '../services/upload';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { getMe, updateProfile, updateLocation } from '../services/api';
import * as Location from 'expo-location';
import {
  REGIONS_TUNISIA, UNIVERSITIES_BY_REGION,
  STUDY_DOMAINS, WORK_DOMAINS, INTERESTS,
  LANGUAGES, RELIGIONS, EDUCATION_LEVELS, TRANSLATIONS,
} from '../data/tunisiaData';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, Switch, Image, Alert, Platform,
} from 'react-native';

export default function ProfileScreen({ navigation }) {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [lang, setLang] = useState('fr');
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState(1);

  // Step 1
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [sex, setSex] = useState(null);

  // Step 2
  const [region, setRegion] = useState(null);
  const [civil, setCivil] = useState(null);
  const [religion, setReligion] = useState(null);
  const [selectedLangs, setSelectedLangs] = useState([]);

  // Step 3
  const [objective, setObjective] = useState(null);
  const [status, setStatus] = useState(null);
  const [studyDomain, setStudyDomain] = useState(null);
  const [studySpecialty, setStudySpecialty] = useState(null);
  const [university, setUniversity] = useState(null);
  const [educationLevel, setEducationLevel] = useState(null);
  const [workDomain, setWorkDomain] = useState(null);
  const [workPost, setWorkPost] = useState(null);

  // Step 4
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [bio, setBio] = useState('');
  const [minAge, setMinAge] = useState('18');
  const [maxAge, setMaxAge] = useState('35');
  const [distance, setDistance] = useState('500');

  const toggleItem = (list, setList, item) => {
    setList(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        const pendingStr = await AsyncStorage.getItem('pendingRegistration');
        if (pendingStr) {
          const pending = JSON.parse(pendingStr);
          setFirstName(pending.firstName || '');
          setLastName(pending.lastName || '');
          setAge(pending.age?.toString() || '');
          setSex(pending.sex || null);
        }
        return;
      }

      let me = null;
      try {
        me = await getMe();
      } catch {
        const cached = await AsyncStorage.getItem('user');
        me = cached ? JSON.parse(cached) : null;
      }

      if (!me) return;

      setFirstName(me.firstName || '');
      setLastName(me.lastName || '');
      setAge(me.age?.toString() || '');
      setHeight(me.height?.toString() || '');
      setSex(me.sex || null);
      setRegion(me.region || null);
      setCivil(me.civilStatus || null);
      setReligion(me.religion || null);
      setSelectedLangs(me.languages || []);
      setObjective(me.objective || null);
      setStatus(
        me.isStudent && me.isWorking ? 'both' :
        me.isStudent ? 'student' :
        me.isWorking ? 'working' : 'neither'
      );
      setStudyDomain(me.studyDomain || null);
      setStudySpecialty(me.studySpecialty || null);
      setUniversity(me.university || null);
      setEducationLevel(me.educationLevel || null);
      setWorkDomain(me.workDomain || null);
      setWorkPost(me.workPost || null);
      setSelectedInterests(me.interests || []);
      setBio(me.bio || '');
      setMinAge(me.minAge?.toString() || '18');
      setMaxAge(me.maxAge?.toString() || '35');
      setDistance(me.maxDistance?.toString() || '500');
      if (me.photo) setProfilePhoto(me.photo);
    } catch (err) {
      console.log('Load profile error:', err.message);
    }
  };

  const detectLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      console.log('Coords:', latitude, longitude);

      const REGION_COORDS = [
        { name: 'Tunis', lat: 36.8, lon: 10.18 },
        { name: 'Ariana', lat: 36.86, lon: 10.19 },
        { name: 'Ben Arous', lat: 36.75, lon: 10.22 },
        { name: 'Manouba', lat: 36.81, lon: 10.1 },
        { name: 'Nabeul', lat: 36.45, lon: 10.73 },
        { name: 'Zaghouan', lat: 36.4, lon: 10.14 },
        { name: 'Bizerte', lat: 37.27, lon: 9.87 },
        { name: 'Béja', lat: 36.73, lon: 9.18 },
        { name: 'Jendouba', lat: 36.5, lon: 8.78 },
        { name: 'Kef', lat: 36.18, lon: 8.71 },
        { name: 'Siliana', lat: 36.08, lon: 9.37 },
        { name: 'Sousse', lat: 35.83, lon: 10.64 },
        { name: 'Monastir', lat: 35.78, lon: 10.83 },
        { name: 'Mahdia', lat: 35.5, lon: 11.06 },
        { name: 'Sfax', lat: 34.74, lon: 10.76 },
        { name: 'Kairouan', lat: 35.68, lon: 10.1 },
        { name: 'Kasserine', lat: 35.17, lon: 8.83 },
        { name: 'Sidi Bouzid', lat: 35.03, lon: 9.48 },
        { name: 'Gabès', lat: 33.88, lon: 10.1 },
        { name: 'Medenine', lat: 33.35, lon: 10.5 },
        { name: 'Tataouine', lat: 32.93, lon: 10.45 },
        { name: 'Gafsa', lat: 34.42, lon: 8.78 },
        { name: 'Tozeur', lat: 33.92, lon: 8.13 },
        { name: 'Kébili', lat: 33.7, lon: 8.97 },
      ];

      let closest = null;
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

      console.log('Closest region:', closest, 'distance:', minDist);

      if (closest) {
        setRegion(closest);
        Platform.OS === 'web'
          ? window.alert(`Position détectée : ${closest}`)
          : Alert.alert('Position détectée', closest);
      }

      const token = await AsyncStorage.getItem('token');
      if (token) {
        await updateLocation(latitude, longitude);
      }
    } catch (err) {
      console.log('Location error:', err.message);
    }
  };

  const CIVIL_OPTIONS = ['Célibataire', 'En couple', 'Marié(e)', 'Divorcé(e)'];
  const OBJECTIVE_OPTIONS = ['Cherche une relation', 'Je veux me marier', 'Amitié'];
  const STATUS_OPTIONS = [
    { key: 'student', label: t.student },
    { key: 'working', label: t.working },
    { key: 'both', label: t.both },
    { key: 'neither', label: t.neither },
  ];
  const DISTANCE_OPTIONS = [
    { label: '100m', value: '100' },
    { label: '300m', value: '300' },
    { label: '500m', value: '500' },
    { label: '1km', value: '1000' },
    { label: '2km', value: '2000' },
    { label: '5km', value: '5000' },
  ];

  const renderStep1 = () => (
    <View>
      <TouchableOpacity
        style={styles.cameraZone}
        onPress={() => navigation.navigate('Camera', {
          onPhotoTaken: (photoPath) => setProfilePhoto(photoPath),
        })}>
        <View style={styles.cameraCircle}>
          {profilePhoto ? (
            <Image source={{ uri: profilePhoto }} style={styles.profilePhotoPreview} />
          ) : (
            <Text style={styles.cameraIconText}>+</Text>
          )}
        </View>
        <Text style={styles.cameraLabel}>
          {profilePhoto ? 'Photo prise' : t.photo}
        </Text>
        <Text style={styles.cameraHint}>
          {profilePhoto ? 'Appuyez pour changer' : t.photoHint}
        </Text>
      </TouchableOpacity>

      <View style={styles.lockedSection}>
        <Text style={styles.lockedTitle}>Informations non modifiables</Text>
        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t.firstName}</Text>
            <View style={styles.lockedField}>
              <Text style={styles.lockedFieldText}>{firstName}</Text>
            </View>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t.lastName}</Text>
            <View style={styles.lockedField}>
              <Text style={styles.lockedFieldText}>{lastName}</Text>
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t.age}</Text>
            <View style={styles.lockedField}>
              <Text style={styles.lockedFieldText}>{age} ans</Text>
            </View>
          </View>
          <View style={styles.fieldHalf}>
            <Text style={styles.label}>{t.sex}</Text>
            <View style={styles.lockedField}>
              <Text style={styles.lockedFieldText}>{sex}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.label}>{t.height}</Text>
      <TextInput
        style={styles.input}
        placeholder="170"
        placeholderTextColor="rgba(255,255,255,0.2)"
        keyboardType="numeric"
        value={height}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9]/g, '');
          setHeight(cleaned);
        }}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text style={styles.label}>{t.country}</Text>
      <View style={styles.fixedField}>
        <Text style={styles.fixedFieldText}>Tunisie</Text>
      </View>

      <TouchableOpacity
        style={styles.detectBtn}
        onPress={detectLocation}>
        <Text style={styles.detectBtnText}>Détecter ma position</Text>
      </TouchableOpacity>

      <Text style={styles.label}>{t.region}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.horizontalScroll}>
        {REGIONS_TUNISIA.map(r => (
          <TouchableOpacity key={r}
            style={[styles.chip, styles.chipMargin, region === r && styles.chipActive]}
            onPress={() => { setRegion(r); setUniversity(null); }}>
            <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.label}>{t.civil}</Text>
      <View style={styles.chipsRow}>
        {CIVIL_OPTIONS.map(c => (
          <TouchableOpacity key={c}
            style={[styles.chip, civil === c && styles.chipActive]}
            onPress={() => setCivil(c)}>
            <Text style={[styles.chipText, civil === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.religion}</Text>
      <View style={styles.chipsRow}>
        {RELIGIONS.map(r => (
          <TouchableOpacity key={r}
            style={[styles.chip, religion === r && styles.chipActive]}
            onPress={() => setReligion(r)}>
            <Text style={[styles.chipText, religion === r && styles.chipTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>{t.languages}</Text>
      <View style={styles.chipsRow}>
        {LANGUAGES.map(l => (
          <TouchableOpacity key={l}
            style={[styles.chip, selectedLangs.includes(l) && styles.chipActive]}
            onPress={() => toggleItem(selectedLangs, setSelectedLangs, l)}>
            <Text style={[styles.chipText, selectedLangs.includes(l) && styles.chipTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <Text style={styles.label}>{t.objective}</Text>
      <View style={styles.chipsRow}>
        {OBJECTIVE_OPTIONS.map(o => (
          <TouchableOpacity key={o}
            style={[styles.chip, objective === o && styles.chipActive]}
            onPress={() => setObjective(o)}>
            <Text style={[styles.chipText, objective === o && styles.chipTextActive]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>SITUATION PROFESSIONNELLE</Text>
      <View style={styles.chipsRow}>
        {STATUS_OPTIONS.map(s => (
          <TouchableOpacity key={s.key}
            style={[styles.chip, status === s.key && styles.chipActive]}
            onPress={() => setStatus(s.key)}>
            <Text style={[styles.chipText, status === s.key && styles.chipTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {(status === 'student' || status === 'both') && (
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>Études</Text>

          <Text style={styles.label}>{t.educationLevel}</Text>
          <View style={styles.chipsRow}>
            {EDUCATION_LEVELS.map(e => (
              <TouchableOpacity key={e}
                style={[styles.chip, educationLevel === e && styles.chipActive]}
                onPress={() => setEducationLevel(e)}>
                <Text style={[styles.chipText, educationLevel === e && styles.chipTextActive]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t.domain}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}>
            {Object.keys(STUDY_DOMAINS).map(d => (
              <TouchableOpacity key={d}
                style={[styles.chip, styles.chipMargin, studyDomain === d && styles.chipActive]}
                onPress={() => { setStudyDomain(d); setStudySpecialty(null); }}>
                <Text style={[styles.chipText, studyDomain === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {studyDomain && (
            <>
              <Text style={styles.label}>{t.specialty}</Text>
              <View style={styles.chipsRow}>
                {STUDY_DOMAINS[studyDomain].map(s => (
                  <TouchableOpacity key={s}
                    style={[styles.chip, studySpecialty === s && styles.chipActive]}
                    onPress={() => setStudySpecialty(s)}>
                    <Text style={[styles.chipText, studySpecialty === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {region && (
            <>
              <Text style={styles.label}>{t.university}</Text>
              <View style={styles.chipsRow}>
                {(UNIVERSITIES_BY_REGION[region] || []).map(u => (
                  <TouchableOpacity key={u}
                    style={[styles.chip, university === u && styles.chipActive]}
                    onPress={() => setUniversity(u)}>
                    <Text style={[styles.chipText, university === u && styles.chipTextActive]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}

      {(status === 'working' || status === 'both') && (
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>Travail</Text>

          <Text style={styles.label}>{t.workDomain}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}>
            {Object.keys(WORK_DOMAINS).map(d => (
              <TouchableOpacity key={d}
                style={[styles.chip, styles.chipMargin, workDomain === d && styles.chipActive]}
                onPress={() => { setWorkDomain(d); setWorkPost(null); }}>
                <Text style={[styles.chipText, workDomain === d && styles.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {workDomain && (
            <>
              <Text style={styles.label}>{t.workPost}</Text>
              <View style={styles.chipsRow}>
                {WORK_DOMAINS[workDomain].map(p => (
                  <TouchableOpacity key={p}
                    style={[styles.chip, workPost === p && styles.chipActive]}
                    onPress={() => setWorkPost(p)}>
                    <Text style={[styles.chipText, workPost === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View>
      {Object.entries(INTERESTS).map(([category, items]) => (
        <View key={category}>
          <Text style={styles.categoryTitle}>— {category}</Text>
          <View style={styles.chipsRow}>
            {items.map(item => (
              <TouchableOpacity key={item}
                style={[styles.chip, selectedInterests.includes(item) && styles.chipActive]}
                onPress={() => toggleItem(selectedInterests, setSelectedInterests, item)}>
                <Text style={[styles.chipText, selectedInterests.includes(item) && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.label}>{t.bio}</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder={t.bioPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        multiline numberOfLines={4}
        value={bio} onChangeText={setBio}
      />

      <Text style={styles.label}>{t.ageRange}</Text>
      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <TextInput style={styles.input} placeholder="Min: 18"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric"
            value={minAge}
            onChangeText={(text) => setMinAge(text.replace(/[^0-9]/g, ''))}
          />
        </View>
        <View style={styles.fieldHalf}>
          <TextInput style={styles.input} placeholder="Max: 35"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric"
            value={maxAge}
            onChangeText={(text) => setMaxAge(text.replace(/[^0-9]/g, ''))}
          />
        </View>
      </View>

      <Text style={styles.label}>{t.distance}</Text>
      <View style={styles.chipsRow}>
        {DISTANCE_OPTIONS.map(d => (
          <TouchableOpacity key={d.value}
            style={[styles.chip, distance === d.value && styles.chipActive]}
            onPress={() => setDistance(d.value)}>
            <Text style={[styles.chipText, distance === d.value && styles.chipTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

const handleFinish = async () => {
  console.log('handleFinish called');
  console.log('photo URI locale:', profilePhoto);
  console.log('region:', region);
  console.log('objective:', objective);
  console.log('minAge:', minAge, 'maxAge:', maxAge);
  console.log('distance:', distance);
  console.log('interests:', selectedInterests.length);

  try {
    if (!profilePhoto) {
      Alert.alert('Photo requise', 'Veuillez prendre une photo avant de continuer');
      setStep(1);
      return;
    }

    let photoUrl = null;
    console.log('Upload de la photo...');
    photoUrl = await uploadPhoto(profilePhoto);
    console.log('URL retournée par uploadPhoto:', photoUrl);

    if (!photoUrl) {
      Alert.alert('Erreur', 'Impossible de télécharger la photo. Vérifiez votre connexion ou réessayez.');
      return;
    }

    const profileData = {
      photo: photoUrl,
      height: parseInt(height) || null,
      region,
      civilStatus: civil,
      religion,
      languages: selectedLangs,
      objective,
      isStudent: status === 'student' || status === 'both',
      isWorking: status === 'working' || status === 'both',
      studyDomain,
      studySpecialty,
      university,
      educationLevel,
      workDomain,
      workPost,
      interests: selectedInterests,
      bio,
      minAge: parseInt(minAge) || 18,
      maxAge: parseInt(maxAge) || 35,
      maxDistance: parseInt(distance) || 500,
    };

    const pendingStr = await AsyncStorage.getItem('pendingRegistration');

    if (pendingStr) {
      const pending = JSON.parse(pendingStr);
      const { register } = await import('../services/api');

      const result = await register({
        firstName: pending.firstName,
        lastName: pending.lastName,
        age: pending.age,
        birthday: pending.birthday,
        zodiac: pending.zodiac,
        sex: pending.sex,
        email: pending.email,
        password: pending.password,
        isEmailVerified: true,
        ...profileData,
      });

      console.log('Account created:', result);
      await AsyncStorage.removeItem('pendingRegistration');
      navigation.navigate('Home');
    } else {
      await updateProfile({
        firstName,
        lastName,
        ...profileData,
      });
      console.log('Profile updated');
      navigation.navigate('MyProfile');
    }
  } catch (err) {
    console.log('Profile finish error:', err.message);
    Alert.alert('Erreur', err.message);
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.langBar}>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'fr' && styles.langBtnActive]}
          onPress={() => setLang('fr')}>
          <Text style={styles.langText}>FR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langBtn, lang === 'ar' && styles.langBtnActive]}
          onPress={() => setLang('ar')}>
          <Text style={styles.langText}>AR</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.stepLabel}>ÉTAPE {step} / 4</Text>
          <View style={styles.stepDots}>
            {[1, 2, 3, 4].map(i => (
              <View key={i} style={[styles.dot, step === i && styles.dotActive]} />
            ))}
          </View>
        </View>

        <Text style={styles.title}>
          {step === 1 ? t.step1 : step === 2 ? t.step2 : step === 3 ? t.step3 : t.step4}
        </Text>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(step - 1)}>
              <Text style={styles.btnBackText}>{t.back}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, step === 1 && { flex: 1 }]}
            onPress={() => {
              if (step === 1 && !profilePhoto) {
                Platform.OS === 'web'
                  ? window.alert('Veuillez prendre une photo avant de continuer')
                  : Alert.alert('Photo requise', 'Veuillez prendre une photo');
                return;
              }
              if (step === 1) {
                detectLocation();
              }
              if (step < 4) {
                setStep(step + 1);
              } else {
                handleFinish();
              }
            }}>
            <Text style={styles.btnText}>{step === 4 ? t.finish : t.next}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  scroll: { padding: 24, paddingBottom: 40 },
  langBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 12,
    gap: 8,
  },
  langBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  langBtnActive: {
    backgroundColor: '#D9A066',
    borderColor: '#D9A066',
  },
  langText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 2 },
  stepDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)' },
  dotActive: { width: 18, backgroundColor: '#D9A066', borderRadius: 3 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  cameraZone: { alignItems: 'center', marginBottom: 28, gap: 8 },
  cameraCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#D9A066',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#D9A066',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  cameraIconText: { fontSize: 32, color: '#fff', fontWeight: '300' },
  cameraLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  cameraHint: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  fieldHalf: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  horizontalScroll: { marginBottom: 16 },
  chipMargin: { marginRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: '#D9A066', borderColor: '#D9A066' },
  chipText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  chipTextActive: { color: '#050505', fontWeight: '600' },
  fixedField: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  fixedFieldText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  subSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  subSectionTitle: {
    color: '#D9A066',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoryTitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 8,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  lockedSection: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  lockedTitle: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  lockedField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8,
    padding: 12,
  },
  lockedFieldText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  btn: {
    flex: 2,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  btnBack: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  btnBackText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '600' },
  profilePhotoPreview: {
    width: 90, height: 90, borderRadius: 45,
  },
  detectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(217,160,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217,160,102,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  detectBtnText: {
    color: '#D9A066',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});