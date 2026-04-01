import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { verifyEmail, resendVerificationCode, checkPreVerificationCode } from '../services/api';
import api from '../services/api';

export default function VerifyEmailScreen({ navigation, route }) {
  const { email, isPending } = route.params || {};
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { setCanResend(true); clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    try {
      setLoading(true);
      setError('');

      if (isPending) {
        // Verify code without account
        await checkPreVerificationCode(email, code);
        setSuccess(true);
        // Go to profile to take photo
        setTimeout(() => navigation.navigate('Profile', { isPending: true }), 1500);
      } else {
        // Verify existing account email
        await verifyEmail(code);
        setSuccess(true);
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.isEmailVerified = true;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
        setTimeout(() => navigation.navigate('Profile'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      if (isPending) {
        const pendingStr = await AsyncStorage.getItem('pendingRegistration');
        const pending = JSON.parse(pendingStr);
        await api.post('/auth/pre-verify', { email, firstName: pending.firstName });
      } else {
        await resendVerificationCode();
      }
      setCanResend(false);
      setCountdown(60);
    } catch (err) {
      setError('Erreur lors du renvoi');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📧</Text>
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.sub}>
          Nous avons envoyé un code à{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>✅ Email vérifié !</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

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
          onPress={handleVerify}
          disabled={loading}>
          <Text style={styles.btnText}>
            {loading ? 'Vérification...' : 'Vérifier →'}
          </Text>
        </TouchableOpacity>

        <View style={styles.resendRow}>
          {canResend ? (
            <TouchableOpacity onPress={handleResend}>
              <Text style={styles.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendTimer}>Renvoyer dans {countdown}s</Text>
          )}
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  content: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  email: { color: '#FF3366', fontWeight: '700' },
  successBox: {
    backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)', borderRadius: 12,
    padding: 12, marginBottom: 16, width: '100%',
  },
  successText: { color: '#22c55e', fontSize: 14, textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.1)', borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.2)', borderRadius: 12,
    padding: 12, marginBottom: 16, width: '100%',
  },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },
  codeInput: {
    width: '100%', backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: '#FF3366', borderRadius: 16,
    padding: 20, color: '#fff', fontSize: 32,
    fontWeight: '800', letterSpacing: 10, marginBottom: 20,
  },
  btn: {
    width: '100%', backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14, alignItems: 'center',
    shadowColor: '#FF3366', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  resendRow: { marginTop: 20 },
  resendLink: { color: '#FF3366', fontSize: 14, fontWeight: '600' },
  resendTimer: { color: 'rgba(255,255,255,0.3)', fontSize: 14 },
});