import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import api from '../services/api';

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState('email'); // email | code | newPassword
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      setError('Entrez votre email');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post('/auth/forgot-password', { email });
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.message || 'Email non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post('/auth/verify-reset-code', { email, code });
      setStep('newPassword');
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      setError('Minimum 8 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await api.post('/auth/reset-password', { email, code, newPassword });
      setSuccess(true);
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <View style={styles.content}>

          {/* Back */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          {/* Icon */}
          <Text style={styles.icon}>🔑</Text>

          <Text style={styles.title}>
            {step === 'email' && 'Mot de passe oublié'}
            {step === 'code' && 'Vérification'}
            {step === 'newPassword' && 'Nouveau mot de passe'}
          </Text>

          <Text style={styles.sub}>
            {step === 'email' && 'Entrez votre email pour recevoir un code de réinitialisation'}
            {step === 'code' && `Code envoyé à ${email}`}
            {step === 'newPassword' && 'Créez un nouveau mot de passe sécurisé'}
          </Text>

          {/* Success */}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                ✅ Mot de passe réinitialisé ! Redirection...
              </Text>
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Email step */}
          {step === 'email' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendCode}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Envoi...' : 'Envoyer le code →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Code step */}
          {step === 'code' && (
            <>
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                maxLength={6}
                textAlign="center"
              />
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleVerifyCode}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Vérification...' : 'Vérifier →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* New password step */}
          {step === 'newPassword' && (
            <>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Nouveau mot de passe"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}>
                  <Text>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={[styles.input, { marginTop: 12 }]}
                placeholder="Confirmer le mot de passe"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />

              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Réinitialisation...' : '✓ Réinitialiser'}
                </Text>
              </TouchableOpacity>
            </>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  content: {
    flex: 1, padding: 32,
    justifyContent: 'center',
  },

  backBtn: { marginBottom: 32 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  icon: { fontSize: 56, marginBottom: 16, textAlign: 'center' },
  title: {
    color: '#fff', fontSize: 26,
    fontWeight: '800', textAlign: 'center', marginBottom: 10,
  },
  sub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14, textAlign: 'center',
    lineHeight: 22, marginBottom: 32,
  },

  successBox: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  successText: { color: '#22c55e', fontSize: 14, textAlign: 'center' },

  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },

  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 16,
    marginBottom: 16,
  },
  codeInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: '#FF3366',
    borderRadius: 16, padding: 20,
    color: '#fff', fontSize: 32,
    fontWeight: '800', letterSpacing: 10,
    marginBottom: 20,
  },
  passwordWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, overflow: 'hidden',
    marginBottom: 4,
  },
  passwordInput: { flex: 1, padding: 14, color: '#fff', fontSize: 16 },
  eyeBtn: { padding: 14, alignItems: 'center', justifyContent: 'center' },

  btn: {
    backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});