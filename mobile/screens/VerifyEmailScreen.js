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
        await checkPreVerificationCode(email, code);
        setSuccess(true);
        setTimeout(() => navigation.navigate('Profile', { isPending: true }), 1500);
      } else {
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
        {/* Back button (optional, but consistent with AuthScreen) */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        {/* Brand header */}
        <View style={styles.logoWrap}>
          <Text style={styles.brandTitle}>LOVE</Text>
          <Text style={styles.brandSubtitle}>ALERT</Text>
          <Text style={styles.logoSub}>VÉRIFICATION EMAIL</Text>
        </View>

        <Text style={styles.sub}>
          Nous avons envoyé un code à{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>

        {success && (
          <View style={styles.successBox}>
            <Text style={styles.successText}>Email vérifié avec succès</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
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
            {loading ? 'Vérification...' : 'VÉRIFIER'}
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
  container: { flex: 1, backgroundColor: '#050505' },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  backBtn: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 10,
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    letterSpacing: 1,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
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
  sub: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  email: {
    color: '#D9A066',
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: 'rgba(217,160,102,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(217,160,102,0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  successText: {
    color: '#D9A066',
    fontSize: 13,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    textAlign: 'center',
  },
  codeInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: '#D9A066',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
  },
  resendRow: { marginTop: 24 },
  resendLink: {
    color: '#D9A066',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resendTimer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
  },
});