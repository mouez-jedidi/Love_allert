import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, Animated, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { login, register } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState(null);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await login(email, password);
      navigation.navigate('Home');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
  if (!firstName || !lastName || !age || !sex || !regEmail || !regPassword) {
    setError('Veuillez remplir tous les champs');
    return;
  }
  try {
    setLoading(true);
    setError('');
    const result = await register({
      firstName, lastName,
      age: parseInt(age),
      sex, email: regEmail,
      password: regPassword,
    });
    console.log('Register success:', result);
    navigation.navigate('Profile');
  } catch (err) {
    console.log('Register error:', err);
    setError(err.response?.data?.message || err.message || 'Erreur lors de l\'inscription');
  } finally {
    setLoading(false);
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

          {/* Logo */}
          <View style={styles.logoWrap}>
            <Text style={styles.logoHeart}>💘</Text>
            <Text style={styles.logo}>
              Love<Text style={styles.logoAccent}>Alert</Text>
            </Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(true); setError(''); }}>
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => { setIsLogin(false); setError(''); }}>
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* LOGIN FORM */}
          {isLogin && (
            <View style={styles.form}>
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
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleLogin}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Connexion...' : 'Se connecter'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* REGISTER FORM */}
          {!isLogin && (
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

              <Text style={styles.label}>ÂGE</Text>
              <TextInput
                style={styles.input}
                placeholder="24"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />

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

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={regEmail}
                onChangeText={setRegEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>MOT DE PASSE</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={regPassword}
                onChangeText={setRegPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleRegister}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Inscription...' : 'Créer mon compte →'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 40 },

  logoWrap: {
    alignItems: 'center',
    marginTop: 40, marginBottom: 40, gap: 8,
  },
  logoHeart: { fontSize: 48 },
  logo: { fontSize: 32, fontWeight: '800', color: '#fff' },
  logoAccent: { color: '#FF3366' },

  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14, padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1, paddingVertical: 12,
    borderRadius: 10, alignItems: 'center',
  },
  tabActive: { backgroundColor: '#FF3366' },
  tabText: { color: 'rgba(255,255,255,0.4)', fontWeight: '600', fontSize: 14 },
  tabTextActive: { color: '#fff' },

  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ff6b6b', fontSize: 13 },

  form: { gap: 4 },
  label: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10, letterSpacing: 2,
    fontWeight: '600', marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 14,
  },
  row: { flexDirection: 'row', gap: 12 },
  fieldHalf: { flex: 1 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  chip: {
    flex: 1, paddingVertical: 12,
    borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#FF3366', borderColor: '#FF3366' },
  chipText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },

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
});