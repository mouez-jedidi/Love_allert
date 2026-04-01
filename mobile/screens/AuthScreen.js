import { useState , useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { register } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendPreVerificationEmail } from '../services/api';
const ZODIAC_SIGNS = [
  { sign: '♈ Bélier', start: [3, 21], end: [4, 19] },
  { sign: '♉ Taureau', start: [4, 20], end: [5, 20] },
  { sign: '♊ Gémeaux', start: [5, 21], end: [6, 20] },
  { sign: '♋ Cancer', start: [6, 21], end: [7, 22] },
  { sign: '♌ Lion', start: [7, 23], end: [8, 22] },
  { sign: '♍ Vierge', start: [8, 23], end: [9, 22] },
  { sign: '♎ Balance', start: [9, 23], end: [10, 22] },
  { sign: '♏ Scorpion', start: [10, 23], end: [11, 21] },
  { sign: '♐ Sagittaire', start: [11, 22], end: [12, 21] },
  { sign: '♑ Capricorne', start: [12, 22], end: [1, 19] },
  { sign: '♒ Verseau', start: [1, 20], end: [2, 18] },
  { sign: '♓ Poissons', start: [2, 19], end: [3, 20] },
];

const getZodiac = (day, month) => {
  for (const z of ZODIAC_SIGNS) {
    const [sm, sd] = z.start;
    const [em, ed] = z.end;
    if (
      (month === sm && day >= sd) ||
      (month === em && day <= ed)
    ) return z.sign;
  }
  return '♑ Capricorne';
};

const getPasswordStrength = (pwd) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: 'Faible', color: '#ef4444' };
  if (score === 2) return { label: 'Moyen', color: '#f97316' };
  if (score === 3) return { label: 'Bon', color: '#eab308' };
  return { label: 'Fort', color: '#22c55e' };
};

export default function AuthScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [sex, setSex] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [zodiac, setZodiac] = useState('');
  const [calculatedAge, setCalculatedAge] = useState(null);
const isSubmitting = useRef(false);
  const handleBirthdayChange = (text) => {
    // Format: DD/MM/YYYY
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    setBirthday(cleaned);

    // Calculate age and zodiac
    if (cleaned.length === 10) {
      const [day, month, year] = cleaned.split('/').map(Number);
      const today = new Date();
      let age = today.getFullYear() - year;
      if (
        today.getMonth() + 1 < month ||
        (today.getMonth() + 1 === month && today.getDate() < day)
      ) age--;
      setCalculatedAge(age);
      setZodiac(getZodiac(day, month));
    }
  };

  const pwdStrength = getPasswordStrength(password);

const handleRegister = async () => {
  if (isSubmitting.current) return;
  isSubmitting.current = true;
  setError('');

  if (!firstName || !lastName || !birthday || !sex || !email || !password || !confirmPassword) {
    setError('Veuillez remplir tous les champs');
    isSubmitting.current = false;
    return;
  }

  if (calculatedAge === null || calculatedAge < 18) {
    setError('Vous devez avoir au moins 18 ans');
    isSubmitting.current = false;
    return;
  }

  if (password !== confirmPassword) {
    setError('Les mots de passe ne correspondent pas');
    isSubmitting.current = false;
    return;
  }

  if (password.length < 8) {
    setError('Minimum 8 caractères');
    isSubmitting.current = false;
    return;
  }

  try {
    setLoading(true);

    // Check if email already exists
    await sendPreVerificationEmail(email, firstName);

    // Save registration data temporarily
    const [day, month, year] = birthday.split('/').map(Number);
    await AsyncStorage.setItem('pendingRegistration', JSON.stringify({
      firstName, lastName,
      age: calculatedAge,
      birthday: new Date(year, month - 1, day),
      zodiac, sex, email, password,
    }));

    navigation.navigate('VerifyEmail', { email, isPending: true });
  } catch (err) {
    setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
  } finally {
    setLoading(false);
    isSubmitting.current = false;
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>

          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoHeart}>💘</Text>
            <Text style={styles.logo}>
              Love<Text style={styles.logoAccent}>Alert</Text>
            </Text>
            <Text style={styles.logoSub}>Créez votre compte</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>

            {/* Name */}
            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>PRÉNOM</Text>
                <TextInput style={styles.input}
                  placeholder="Sarah"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={firstName} onChangeText={setFirstName} />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>NOM</Text>
                <TextInput style={styles.input}
                  placeholder="Ben Ali"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={lastName} onChangeText={setLastName} />
              </View>
            </View>

            {/* Birthday */}
            <Text style={styles.label}>DATE DE NAISSANCE</Text>
            <TextInput
              style={styles.input}
              placeholder="JJ/MM/AAAA"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={birthday}
              onChangeText={handleBirthdayChange}
              keyboardType="numeric"
              maxLength={10}
            />

            {/* Age + Zodiac display */}
            {calculatedAge !== null && (
              <View style={styles.ageZodiacRow}>
                {calculatedAge < 18 ? (
                  <View style={styles.ageError}>
                    <Text style={styles.ageErrorText}>
                      ⚠️ Vous devez avoir au moins 18 ans
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageBadgeText}>{calculatedAge} ans</Text>
                    </View>
                    {zodiac && (
                      <View style={styles.zodiacBadge}>
                        <Text style={styles.zodiacText}>{zodiac}</Text>
                      </View>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Sex */}
            <Text style={styles.label}>SEXE</Text>
            <View style={styles.chipsRow}>
              {['Homme', 'Femme'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, sex === s && styles.chipActive]}
                  onPress={() => setSex(s)}>
                  <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                    {s === 'Homme' ? '👨 Homme' : '👩 Femme'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email */}
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={email} onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Text style={styles.label}>MOT DE PASSE</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 8 caractères"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={password} onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <Text>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[
                    styles.strengthFill,
                    {
                      width: `${(pwdStrength.label === 'Faible' ? 25 :
                        pwdStrength.label === 'Moyen' ? 50 :
                        pwdStrength.label === 'Bon' ? 75 : 100)}%`,
                      backgroundColor: pwdStrength.color,
                    }
                  ]} />
                </View>
                <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>
                  {pwdStrength.label}
                </Text>
              </View>
            )}

            {/* Confirm password */}
            <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword && password !== confirmPassword &&
                  styles.inputError,
              ]}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.matchError}>
                ⚠️ Les mots de passe ne correspondent pas
              </Text>
            )}
{/* Terms */}
<View style={styles.termsRow}>
  <Text style={styles.termsText}>En vous inscrivant, vous acceptez nos </Text>
  <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
    <Text style={styles.termsLink}>Conditions d'utilisation</Text>
  </TouchableOpacity>
</View>
            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              <Text style={styles.btnText}>
                {loading ? 'Création...' : 'Créer mon compte →'}
              </Text>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Déjà un compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },

  backBtn: { marginTop: 10, marginBottom: 20 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  logoWrap: { alignItems: 'center', marginBottom: 32, gap: 8 },
  logoHeart: { fontSize: 48 },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff' },
  logoAccent: { color: '#FF3366' },
  logoSub: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },

  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ff6b6b', fontSize: 13 },

  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.35)', fontSize: 10,
    letterSpacing: 2, fontWeight: '600',
    marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 14,
  },
  inputError: { borderColor: '#ef4444' },

  ageZodiacRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ageError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10, padding: 8,
  },
  ageErrorText: { color: '#ef4444', fontSize: 12 },
  ageBadge: {
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)',
    borderRadius: 10, padding: 8,
  },
  ageBadgeText: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  zodiacBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, padding: 8,
  },
  zodiacText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#FF3366', borderColor: '#FF3366' },
  chipText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },

  passwordWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, overflow: 'hidden',
  },
  passwordInput: { flex: 1, padding: 14, color: '#fff', fontSize: 14 },
  eyeBtn: { padding: 14, alignItems: 'center', justifyContent: 'center' },

  strengthWrap: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, marginTop: 6,
  },
  strengthTrack: {
    flex: 1, height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2,
  },
  strengthFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', width: 40 },

  matchError: { color: '#ef4444', fontSize: 11, marginTop: 4 },

  btn: {
    backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14,
    alignItems: 'center', marginTop: 24,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  loginRow: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 20,
  },
  loginText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  loginLink: { color: '#FF3366', fontSize: 13, fontWeight: '700' },
  termsRow: {
  flexDirection: 'row', flexWrap: 'wrap',
  justifyContent: 'center', marginTop: 16,
},
termsText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
termsLink: { color: '#FF3366', fontSize: 12, fontWeight: '600' },
});