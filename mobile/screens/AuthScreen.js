import { useState, useRef } from 'react';
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
  if (score <= 1) return { label: 'Faible', color: '#8b8b8b' };
  if (score === 2) return { label: 'Moyen', color: '#D9A066' };
  if (score === 3) return { label: 'Bon', color: '#e6b17e' };
  return { label: 'Fort', color: '#ffffff' };
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
    let cleaned = text.replace(/\D/g, '');
    if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
    if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
    setBirthday(cleaned);

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
      await sendPreVerificationEmail(email, firstName);

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

          {/* Back button – no icon */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>

          {/* Branding – matching SplashScreen style */}
          <View style={styles.logoWrap}>
            <Text style={styles.brandTitle}>LOVE</Text>
            <Text style={styles.brandSubtitle}>ALERT</Text>
            <Text style={styles.logoSub}>CRÉEZ VOTRE COMPTE</Text>
          </View>

          {/* Error message */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form fields */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>PRÉNOM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Sarah"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.label}>NOM</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ben Ali"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

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

            {calculatedAge !== null && (
              <View style={styles.ageZodiacRow}>
                {calculatedAge < 18 ? (
                  <View style={styles.ageError}>
                    <Text style={styles.ageErrorText}>
                      Vous devez avoir au moins 18 ans
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

            <Text style={styles.label}>SEXE</Text>
            <View style={styles.chipsRow}>
              {['Homme', 'Femme'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, sex === s && styles.chipActive]}
                  onPress={() => setSex(s)}>
                  <Text style={[styles.chipText, sex === s && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.label}>MOT DE PASSE</Text>
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Min. 8 caractères"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeBtnText}>
                  {showPassword ? 'Masquer' : 'Afficher'}
                </Text>
              </TouchableOpacity>
            </View>

            {password.length > 0 && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthTrack}>
                  <View style={[
                    styles.strengthFill,
                    {
                      width: `${pwdStrength.label === 'Faible' ? 25 :
                        pwdStrength.label === 'Moyen' ? 50 :
                        pwdStrength.label === 'Bon' ? 75 : 100}%`,
                      backgroundColor: pwdStrength.color,
                    }
                  ]} />
                </View>
                <Text style={[styles.strengthLabel, { color: pwdStrength.color }]}>
                  {pwdStrength.label}
                </Text>
              </View>
            )}

            <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
            <TextInput
              style={[
                styles.input,
                confirmPassword && password !== confirmPassword && styles.inputError,
              ]}
              placeholder="••••••••"
              placeholderTextColor="rgba(255,255,255,0.2)"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
            {confirmPassword && password !== confirmPassword && (
              <Text style={styles.matchError}>Les mots de passe ne correspondent pas</Text>
            )}

            <View style={styles.termsRow}>
              <Text style={styles.termsText}>En vous inscrivant, vous acceptez nos </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Terms')}>
                <Text style={styles.termsLink}>Conditions d'utilisation</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleRegister}
              disabled={loading}>
              <Text style={styles.btnText}>
                {loading ? 'Création...' : 'CRÉER MON COMPTE'}
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
  container: { flex: 1, backgroundColor: '#050505' },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },

  backBtn: { marginTop: 10, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 1 },

  logoWrap: { alignItems: 'center', marginBottom: 40, marginTop: 20 },
  brandTitle: {
    fontSize: 48,
    fontWeight: '200',
    color: '#FFFFFF',
    letterSpacing: 15,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#D9A066',
    letterSpacing: 8,
    marginTop: -5,
  },
  logoSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    letterSpacing: 2,
    marginTop: 20,
    fontWeight: '600',
  },

  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },

  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    padding: 14,
    color: '#fff',
    fontSize: 14,
  },
  inputError: { borderColor: '#ef4444' },

  ageZodiacRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  ageError: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ageErrorText: { color: '#ef4444', fontSize: 12 },
  ageBadge: {
    backgroundColor: 'rgba(217,160,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217,160,102,0.2)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  ageBadgeText: { color: '#D9A066', fontSize: 12, fontWeight: '600' },
  zodiacBadge: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  zodiacText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },

  chipsRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: '#D9A066', borderColor: '#D9A066' },
  chipText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  chipTextActive: { color: '#050505', fontWeight: '600' },

  passwordWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  passwordInput: { flex: 1, padding: 14, color: '#fff', fontSize: 14 },
  eyeBtn: { paddingHorizontal: 14, justifyContent: 'center' },
  eyeBtnText: { color: '#D9A066', fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },

  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  strengthTrack: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 1,
  },
  strengthFill: { height: '100%', borderRadius: 1 },
  strengthLabel: { fontSize: 11, fontWeight: '600', width: 45, textAlign: 'right' },

  matchError: { color: '#ef4444', fontSize: 11, marginTop: 4 },

  btn: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 28,
    backgroundColor: 'transparent',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', letterSpacing: 2 },

  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 20,
  },
  loginText: { color: 'rgba(255,255,255,0.3)', fontSize: 12 },
  loginLink: { color: '#D9A066', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  termsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
  },
  termsText: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  termsLink: { color: '#D9A066', fontSize: 11, fontWeight: '600' },
});