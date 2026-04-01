import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { login } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll}
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
            <Text style={styles.logoSub}>Bon retour parmi nous !</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Form */}
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
            <View style={styles.passwordWrap}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.eyeText}>
                  {showPassword ? '🙈' : '👁️'}
                </Text>
              </TouchableOpacity>
            </View>
<TouchableOpacity
  style={styles.forgotBtn}
  onPress={() => navigation.navigate('ForgotPassword')}>
  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
</TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading}>
              <Text style={styles.btnText}>
                {loading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Pas encore de compte ? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Auth')}>
                <Text style={styles.registerLink}>S'inscrire</Text>
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

  logoWrap: { alignItems: 'center', marginBottom: 40, gap: 8 },
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
  passwordWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, overflow: 'hidden',
  },
  passwordInput: {
    flex: 1, padding: 14,
    color: '#fff', fontSize: 14,
  },
  eyeBtn: {
    padding: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  eyeText: { fontSize: 18 },

  forgotBtn: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: 'rgba(255,51,102,0.6)', fontSize: 12 },

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

  registerRow: {
    flexDirection: 'row', justifyContent: 'center',
    marginTop: 20,
  },
  registerText: { color: 'rgba(255,255,255,0.3)', fontSize: 13 },
  registerLink: { color: '#FF3366', fontSize: 13, fontWeight: '700' },
});