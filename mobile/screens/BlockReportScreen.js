import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, Platform, Alert, TextInput,
  ScrollView,
} from 'react-native';
import api from '../services/api';
import { blockUser } from '../services/api';

const REPORT_REASONS = [
  '🚫 Faux profil',
  '💬 Harcèlement',
  '🔞 Contenu inapproprié',
  '💔 Comportement abusif',
  '🤖 Bot / Spam',
  '⚠️ Autre',
];

export default function BlockReportScreen({ navigation, route }) {
  const { matchId, userId } = route.params || {};
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleBlock = async () => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Bloquer cet utilisateur ? Il ne pourra plus vous contacter.')
      : await new Promise(resolve =>
          Alert.alert(
            '🚫 Bloquer',
            'Bloquer cet utilisateur ? Il ne pourra plus vous contacter.',
            [
              { text: 'Annuler', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Bloquer', onPress: () => resolve(true), style: 'destructive' },
            ]
          )
        );

    if (!confirm) return;

    try {
      setLoading(true);
      await blockUser(userId);
      navigation.navigate('Home');
    } catch (err) {
      console.log('Block error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!selectedReason) {
      Platform.OS === 'web'
        ? window.alert('Veuillez choisir une raison')
        : Alert.alert('⚠️', 'Veuillez choisir une raison');
      return;
    }

    try {
      setLoading(true);
      await api.post('/users/report', {
        reportedUserId: userId,
        matchId,
        reason: selectedReason,
        details,
      });
      setDone(true);
    } catch (err) {
      console.log('Report error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneWrap}>
          <Text style={styles.doneIcon}>✅</Text>
          <Text style={styles.doneTitle}>Signalement envoyé</Text>
          <Text style={styles.doneSub}>
            Merci. Notre équipe examinera ce signalement dans les plus brefs délais.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => navigation.navigate('Home')}>
            <Text style={styles.btnText}>Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Signaler / Bloquer</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>

        {/* Block section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚫 Bloquer l'utilisateur</Text>
          <Text style={styles.sectionSub}>
            Cet utilisateur ne pourra plus vous contacter ni apparaître dans vos matchs.
          </Text>
          <TouchableOpacity
            style={styles.blockBtn}
            onPress={handleBlock}
            disabled={loading}>
            <Text style={styles.blockBtnText}>🚫 Bloquer</Text>
          </TouchableOpacity>
        </View>

        {/* Report section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Signaler l'utilisateur</Text>
          <Text style={styles.sectionSub}>
            Choisissez une raison pour votre signalement :
          </Text>

          <View style={styles.reasonsGrid}>
            {REPORT_REASONS.map(reason => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonChip,
                  selectedReason === reason && styles.reasonChipActive,
                ]}
                onPress={() => setSelectedReason(reason)}>
                <Text style={[
                  styles.reasonText,
                  selectedReason === reason && styles.reasonTextActive,
                ]}>
                  {reason}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>DÉTAILS (optionnel)</Text>
          <TextInput
            style={styles.detailsInput}
            placeholder="Décrivez le problème..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={details}
            onChangeText={setDetails}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleReport}
            disabled={loading}>
            <Text style={styles.btnText}>
              {loading ? 'Envoi...' : '⚠️ Envoyer le signalement'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: 'rgba(255,255,255,0.4)', fontSize: 14, width: 60 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },

  content: { padding: 24, gap: 16, paddingBottom: 40 },

  section: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13, lineHeight: 20,
  },

  blockBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 12, padding: 14,
    alignItems: 'center',
  },
  blockBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },

  reasonsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  reasonChipActive: {
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderColor: '#FF3366',
  },
  reasonText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  reasonTextActive: { color: '#FF3366', fontWeight: '600' },

  label: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10, letterSpacing: 2, fontWeight: '600',
  },
  detailsInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 14,
    color: '#fff', fontSize: 14,
    textAlignVertical: 'top', height: 100,
  },

  btn: {
    backgroundColor: '#FF3366',
    padding: 14, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  doneWrap: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', padding: 32, gap: 16,
  },
  doneIcon: { fontSize: 60 },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  doneSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14, textAlign: 'center', lineHeight: 22,
  },
});