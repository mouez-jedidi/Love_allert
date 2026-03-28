import { updateProfile } from '../services/api';
import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, SafeAreaView, Switch,
} from 'react-native';
import {
  REGIONS_TUNISIA, UNIVERSITIES_BY_REGION,
  STUDY_DOMAINS, WORK_DOMAINS, INTERESTS,
  LANGUAGES, RELIGIONS, EDUCATION_LEVELS, TRANSLATIONS,
} from '../data/tunisiaData';

export default function ProfileScreen({ navigation }) {
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
  const [status, setStatus] = useState(null); // student / working / both / neither
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

  const CIVIL_OPTIONS = ['Célibataire', 'En couple', 'Marié(e)', 'Divorcé(e)'];
  const OBJECTIVE_OPTIONS = ['Cherche une relation', 'Je veux me marier', 'Amitié'];
  const STATUS_OPTIONS = [
    { key: 'student', label: t.student },
    { key: 'working', label: t.working },
    { key: 'both', label: t.both },
    { key: 'neither', label: t.neither },
  ];
  const DISTANCE_OPTIONS = ['100m', '300m', '500m', '1km', '2km', '5km'];

  // ─── STEP 1 ───
  const renderStep1 = () => (
    <View>
      {/* Camera */}
      <TouchableOpacity style={styles.cameraZone}>
        <View style={styles.cameraCircle}>
          <Text style={styles.cameraIcon}>📷</Text>
        </View>
        <Text style={styles.cameraLabel}>{t.photo}</Text>
        <Text style={styles.cameraHint}>{t.photoHint}</Text>
      </TouchableOpacity>

      {/* Name row */}
      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>{t.firstName}</Text>
          <TextInput style={styles.input} placeholder="Sarah"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={firstName} onChangeText={setFirstName} />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>{t.lastName}</Text>
          <TextInput style={styles.input} placeholder="Ben Ali"
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={lastName} onChangeText={setLastName} />
        </View>
      </View>

      {/* Age & Height */}
      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>{t.age}</Text>
          <TextInput style={styles.input} placeholder="24"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric" value={age} onChangeText={setAge} />
        </View>
        <View style={styles.fieldHalf}>
          <Text style={styles.label}>{t.height}</Text>
          <TextInput style={styles.input} placeholder="170"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric" value={height} onChangeText={setHeight} />
        </View>
      </View>

      {/* Sex */}
      <Text style={styles.label}>{t.sex}</Text>
      <View style={styles.chipsRow}>
        {[t.male, t.female].map(s => (
          <TouchableOpacity key={s}
            style={[styles.chip, sex === s && styles.chipActive]}
            onPress={() => setSex(s)}>
            <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
              {s === t.male ? '👨 ' : '👩 '}{s}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── STEP 2 ───
  const renderStep2 = () => (
    <View>
      {/* Country (fixed Tunisia for now) */}
      <Text style={styles.label}>{t.country}</Text>
      <View style={styles.fixedField}>
        <Text style={styles.fixedFieldText}>🇹🇳 Tunisie</Text>
      </View>

      {/* Region */}
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

      {/* Civil status */}
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

      {/* Religion */}
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

      {/* Languages */}
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

  // ─── STEP 3 ───
  const renderStep3 = () => (
    <View>
      {/* Objective */}
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

      {/* Student / Working */}
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

      {/* STUDENT fields */}
      {(status === 'student' || status === 'both') && (
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>🎓 Études</Text>

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

      {/* WORK fields */}
      {(status === 'working' || status === 'both') && (
        <View style={styles.subSection}>
          <Text style={styles.subSectionTitle}>💼 Travail</Text>

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

  // ─── STEP 4 ───
  const renderStep4 = () => (
    <View>
      {/* Interests */}
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

      {/* Bio */}
      <Text style={styles.label}>{t.bio}</Text>
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder={t.bioPlaceholder}
        placeholderTextColor="rgba(255,255,255,0.2)"
        multiline numberOfLines={4}
        value={bio} onChangeText={setBio}
      />

      {/* Age range */}
      <Text style={styles.label}>{t.ageRange}</Text>
      <View style={styles.row}>
        <View style={styles.fieldHalf}>
          <TextInput style={styles.input} placeholder="Min: 18"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric" value={minAge} onChangeText={setMinAge} />
        </View>
        <View style={styles.fieldHalf}>
          <TextInput style={styles.input} placeholder="Max: 35"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="numeric" value={maxAge} onChangeText={setMaxAge} />
        </View>
      </View>

      {/* Distance */}
      <Text style={styles.label}>{t.distance}</Text>
      <View style={styles.chipsRow}>
        {DISTANCE_OPTIONS.map(d => (
          <TouchableOpacity key={d}
            style={[styles.chip, distance === d && styles.chipActive]}
            onPress={() => setDistance(d)}>
            <Text style={[styles.chipText, distance === d && styles.chipTextActive]}>📍 {d}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
  const handleFinish = async () => {
  try {
    await updateProfile({
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
      minAge: parseInt(minAge),
      maxAge: parseInt(maxAge),
      maxDistance: parseInt(distance),
    });
    navigation.navigate('Home');
  } catch (err) {
    console.log('Profile update error:', err.message);
    navigation.navigate('Home');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      {/* Lang switcher */}
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

        {/* Header */}
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

        {/* Step content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.btnBack} onPress={() => setStep(step - 1)}>
              <Text style={styles.btnBackText}>{t.back}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.btn, step === 1 && { flex: 1 }]}
            onPress={() => step < 4 ? setStep(step + 1) : handleFinish()}>
            <Text style={styles.btnText}>{step === 4 ? t.finish : t.next}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  langBtnActive: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366',
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
  dotActive: { width: 18, backgroundColor: '#FF3366', borderRadius: 3 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  cameraZone: { alignItems: 'center', marginBottom: 28, gap: 8 },
  cameraCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  cameraIcon: { fontSize: 32 },
  cameraLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: '500' },
  cameraHint: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  fieldHalf: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10,
    letterSpacing: 2, fontWeight: '600', marginBottom: 8, marginTop: 4,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12,
    color: '#fff', fontSize: 14,
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  horizontalScroll: { marginBottom: 16 },
  chipMargin: { marginRight: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#FF3366', borderColor: '#FF3366' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  fixedField: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  fixedFieldText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  subSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  subSectionTitle: {
    color: '#FF3366', fontSize: 14,
    fontWeight: '700', marginBottom: 16,
  },
  categoryTitle: {
    color: 'rgba(255,255,255,0.4)', fontSize: 11,
    letterSpacing: 2, fontWeight: '600',
    marginBottom: 10, marginTop: 8,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  btn: {
    flex: 2, backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnBack: {
    flex: 1, padding: 16, borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  btnBackText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: '500' },
});