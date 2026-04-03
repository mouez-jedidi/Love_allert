
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Switch, Image ,Platform,
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMe, logout } from '../services/api';
import BottomNav from '../components/BottomNav';
import { Alert } from 'react-native';
import ProfileCompletion from '../components/ProfileCompletion';
import api from '../services/api';
export default function MyProfileScreen({ navigation }) {
  const [gpsActive, setGpsActive] = useState(true);
  const [notifActive, setNotifActive] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const me = await getMe();
      setUser(me);
    } catch (err) {
      console.log('Profile load error:', err.message);
      // Fallback to cached user
      const cached = await AsyncStorage.getItem('user');
      if (cached) setUser(JSON.parse(cached));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigation.navigate('Splash');
  };
const handleDeleteAccount = async () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm(
      'Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées définitivement.'
    );
    if (confirmed) await confirmDeleteAccount();
  } else {
    Alert.alert(
      '🗑️ Supprimer le compte',
      'Êtes-vous sûr ? Cette action est irréversible. Toutes vos données seront supprimées définitivement.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: confirmDeleteAccount },
      ]
    );
  }
};

const confirmDeleteAccount = async () => {
  try {
    await api.delete('/users/account');
    await logout();
    navigation.navigate('Splash');
  } catch (err) {
    Alert.alert('Erreur', 'Impossible de supprimer le compte');
  }
};
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const STATS = [
    { label: 'Matchs reçus', value: '0', icon: '💘' },
    { label: 'Chats actifs', value: '0', icon: '💬' },
    { label: 'Profils débloqués', value: '0', icon: '🔓' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Mon <Text style={styles.titleAccent}>Profil</Text>
          </Text>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.editBtnText}>✏️ Modifier</Text>
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
<View style={styles.avatar}>
  {user?.photo ? (
    <Image
      source={{ uri: user.photo }}
      style={styles.avatarImage}
    />
  ) : (
    <Text style={styles.avatarText}>
      {user?.sex === 'Femme' ? '👩' : '👨'}
    </Text>
  )}
</View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.profileAge}>
            {user?.age} ans{user?.region ? ` · ${user.region}` : ''}
          </Text>
          {user?.objective && (
            <View style={styles.objectiveChip}>
              <Text style={styles.objectiveText}>💍 {user.objective}</Text>
            </View>
          )}
          <TouchableOpacity
  style={styles.galleryBtn}
  onPress={() => navigation.navigate('Gallery', { isOwnProfile: true })}>
  <Text style={styles.galleryBtnText}>📸 Ma galerie</Text>
</TouchableOpacity>
        </View>
<ProfileCompletion user={user} />
        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statIcon}>{stat.icon}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Info section */}
        {(user?.studyDomain || user?.workDomain) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INFORMATIONS</Text>
            {user?.studyDomain && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🎓</Text>
                <Text style={styles.infoText}>
                  {user.studyDomain} — {user.studySpecialty}
                </Text>
              </View>
            )}
            {user?.workDomain && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>💼</Text>
                <Text style={styles.infoText}>
                  {user.workPost} · {user.workDomain}
                </Text>
              </View>
            )}
            {user?.university && (
              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>🏛️</Text>
                <Text style={styles.infoText}>{user.university}</Text>
              </View>
            )}
          </View>
        )}

        {/* Interests */}
        {user?.interests?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CENTRES D'INTÉRÊT</Text>
            <View style={styles.interestsWrap}>
              {user.interests.map(interest => (
                <View key={interest} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARAMÈTRES</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📡</Text>
              <View>
                <Text style={styles.settingLabel}>GPS actif</Text>
                <Text style={styles.settingHint}>Détection des personnes proches</Text>
              </View>
            </View>
            <Switch
              value={gpsActive}
              onValueChange={setGpsActive}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FF3366' }}
              thumbColor={gpsActive ? '#fff' : 'rgba(255,255,255,0.4)'}
            />
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text style={styles.settingLabel}>Notifications</Text>
                <Text style={styles.settingHint}>Alertes de match</Text>
              </View>
            </View>
            <Switch
              value={notifActive}
              onValueChange={setNotifActive}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FF3366' }}
              thumbColor={notifActive ? '#fff' : 'rgba(255,255,255,0.4)'}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES DE MATCHING</Text>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>🎯 Tranche d'âge</Text>
            <Text style={styles.prefValue}>
              {user?.minAge || 18} — {user?.maxAge || 35} ans
            </Text>
          </View>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>📏 Distance max</Text>
            <Text style={styles.prefValue}>{user?.maxDistance || 500}m</Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE</Text>
          <View style={styles.emailRow}>
            <Text style={styles.settingIcon}>📧</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
{[
  { icon: '🔒', label: 'Confidentialité', onPress: () => navigation.navigate('Terms') },
  { icon: '🚫', label: 'Utilisateurs bloqués', onPress: () => {} },
  { icon: '⚠️', label: 'Signaler un problème', onPress: () => {} },
  { icon: '🗑️', label: 'Supprimer mon compte', onPress: handleDeleteAccount, danger: true },
].map(item => (
  <TouchableOpacity key={item.label} style={styles.actionRow} onPress={item.onPress}>
    <Text style={styles.actionIcon}>{item.icon}</Text>
    <Text style={[styles.actionLabel, item.danger && styles.actionLabelDanger]}>
      {item.label}
    </Text>
    <Text style={styles.actionArrow}>›</Text>
  </TouchableOpacity>
))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      <BottomNav navigation={navigation} active="MyProfile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  scroll: { padding: 24, paddingBottom: 100 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 24,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  titleAccent: { color: '#FF3366' },
  editBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)',
  },
  editBtnText: { color: '#FF3366', fontSize: 12, fontWeight: '600' },

  profileCard: {
    alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, padding: 24, marginBottom: 20,
  },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  avatarText: { fontSize: 36 },
  verifiedBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0d0a12',
  },
  verifiedText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  profileAge: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  objectiveChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)',
  },
  objectiveText: { color: '#FF3366', fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, padding: 14,
  },
  statIcon: { fontSize: 20 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9, textAlign: 'center', letterSpacing: 0.5,
  },

  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10, letterSpacing: 2,
    fontWeight: '600', marginBottom: 16,
  },

  infoRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoIcon: { fontSize: 18 },
  infoText: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },

  interestsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,51,102,0.2)',
  },
  interestText: { color: '#FF3366', fontSize: 12 },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon: { fontSize: 20 },
  settingLabel: { color: '#fff', fontSize: 14, fontWeight: '500' },
  settingHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },

  prefRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  prefLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  prefValue: { color: '#FF3366', fontSize: 13, fontWeight: '600' },

  emailRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  emailText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  actionArrow: { color: 'rgba(255,255,255,0.2)', fontSize: 18 },
avatarImage: {
  width: 80, height: 80, borderRadius: 40,
},
  logoutBtn: {
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  logoutText: { color: 'rgba(255,100,100,0.7)', fontSize: 14, fontWeight: '600' },
  actionLabelDanger: { color: 'rgba(255,100,100,0.8)' },
  galleryBtn: {
  paddingHorizontal: 16, paddingVertical: 8,
  borderRadius: 20, marginTop: 4,
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
},
galleryBtnText: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
});