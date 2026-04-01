import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { sendPhoneOTP, verifyPhoneOTP } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VerifyPhoneScreen({ navigation }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+216');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSendOTP = async () => {
    if (phone.length < 8) {
      setError('Entrez un numéro valide');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await sendPhoneOTP(phone);
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (code.length !== 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await verifyPhoneOTP(phone, code);
      setSuccess(true);

      // Update cached user
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.isPhoneVerified = true;
        await AsyncStorage.setItem('user', JSON.stringify(user));
      }

      setTimeout(() => navigation.navigate('Profile'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Code incorrect');
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

          {/* Icon */}
          <Text style={styles.icon}>📱</Text>

          <Text style={styles.title}>
            {step === 'phone' ? 'Votre numéro' : 'Code de vérification'}
          </Text>
          <Text style={styles.sub}>
            {step === 'phone'
              ? 'Entrez votre numéro de téléphone pour recevoir un code SMS'
              : `Code envoyé au ${phone}`}
          </Text>

          {/* Success */}
          {success && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ Téléphone vérifié !</Text>
            </View>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          ) : null}

          {/* Phone input */}
          {step === 'phone' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="+216 XX XXX XXX"
                placeholderTextColor="rgba(255,255,255,0.2)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <Text style={styles.hint}>
                Format international: +216 pour la Tunisie
              </Text>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Envoi...' : 'Envoyer le code →'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* OTP input */}
          {step === 'otp' && (
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
                onPress={handleVerifyOTP}
                disabled={loading}>
                <Text style={styles.btnText}>
                  {loading ? 'Vérification...' : 'Vérifier →'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => { setStep('phone'); setCode(''); setError(''); }}>
                <Text style={styles.backText}>← Changer de numéro</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Skip */}
<TouchableOpacity
  style={styles.skipBtn}
  onPress={() => navigation.navigate('Profile')}>
  <Text style={styles.skipText}>
    Continuer sans vérification →
  </Text>
</TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  content: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },

  icon: { fontSize: 64, marginBottom: 16 },
  title: {
    color: '#fff', fontSize: 24,
    fontWeight: '800', marginBottom: 12, textAlign: 'center',
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
    width: '100%',
  },
  successText: { color: '#22c55e', fontSize: 14, textAlign: 'center' },

  errorBox: {
    backgroundColor: 'rgba(255,50,50,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,50,50,0.2)',
    borderRadius: 12, padding: 12, marginBottom: 16,
    width: '100%',
  },
  errorText: { color: '#ff6b6b', fontSize: 13, textAlign: 'center' },

  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 16,
    color: '#fff', fontSize: 18,
    marginBottom: 8,
  },
  hint: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 11, marginBottom: 20,
  },
  codeInput: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 2, borderColor: '#FF3366',
    borderRadius: 16, padding: 20,
    color: '#fff', fontSize: 32,
    fontWeight: '800', letterSpacing: 10,
    marginBottom: 20,
  },

  btn: {
    width: '100%', backgroundColor: '#FF3366',
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 15, elevation: 10,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  backBtn: { marginTop: 16 },
  backText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  skipBtn: { marginTop: 20 },
  skipText: { color: 'rgba(255,255,255,0.25)', fontSize: 13 },
});