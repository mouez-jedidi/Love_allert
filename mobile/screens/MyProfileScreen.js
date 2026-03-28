import BottomNav from '../components/BottomNav';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, Switch,
} from 'react-native';
import { useState } from 'react';

export default function MyProfileScreen({ navigation }) {
  const [gpsActive, setGpsActive] = useState(true);
  const [notifActive, setNotifActive] = useState(true);
  const [showDistance, setShowDistance] = useState(false);

  const STATS = [
    { label: 'Matchs reçus', value: '12', icon: '💘' },
    { label: 'Chats actifs', value: '3', icon: '💬' },
    { label: 'Profils débloqués', value: '1', icon: '🔓' },
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
              <Text style={styles.avatarText}>📷</Text>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Sarah Ben Ali</Text>
          <Text style={styles.profileAge}>24 ans · Tunis</Text>
          <View style={styles.objectiveChip}>
            <Text style={styles.objectiveText}>💍 Relation sérieuse</Text>
          </View>
        </View>

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

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingIcon}>📍</Text>
              <View>
                <Text style={styles.settingLabel}>Afficher la distance</Text>
                <Text style={styles.settingHint}>Distance approximative uniquement</Text>
              </View>
            </View>
            <Switch
              value={showDistance}
              onValueChange={setShowDistance}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#FF3366' }}
              thumbColor={showDistance ? '#fff' : 'rgba(255,255,255,0.4)'}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRÉFÉRENCES DE MATCHING</Text>

          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>🎯 Tranche d'âge</Text>
            <Text style={styles.prefValue}>20 — 30 ans</Text>
          </View>
          <View style={styles.prefRow}>
            <Text style={styles.prefLabel}>📏 Distance max</Text>
            <Text style={styles.prefValue}>500m</Text>
          </View>
          <TouchableOpacity
            style={styles.editPrefBtn}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.editPrefText}>Modifier les préférences →</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMPTE</Text>

          {[
            { icon: '🔒', label: 'Confidentialité' },
            { icon: '🚫', label: 'Utilisateurs bloqués' },
            { icon: '⚠️', label: 'Signaler un problème' },
          ].map(item => (
            <TouchableOpacity key={item.label} style={styles.actionRow}>
              <Text style={styles.actionIcon}>{item.icon}</Text>
              <Text style={styles.actionLabel}>{item.label}</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => navigation.navigate('Splash')}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom nav */}
      <BottomNav navigation={navigation} active="MyProfile" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  scroll: { padding: 24, paddingBottom: 100 },

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
    borderRadius: 20, padding: 24,
    marginBottom: 20,
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
  avatarText: { fontSize: 32 },
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

  statsRow: {
    flexDirection: 'row', gap: 10, marginBottom: 24,
  },
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
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10, letterSpacing: 2,
    fontWeight: '600', marginBottom: 16,
  },

  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  editPrefBtn: { paddingTop: 12 },
  editPrefText: { color: 'rgba(255,51,102,0.6)', fontSize: 12 },

  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  actionIcon: { fontSize: 18 },
  actionLabel: { flex: 1, color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  actionArrow: { color: 'rgba(255,255,255,0.2)', fontSize: 18 },

  logoutBtn: {
    padding: 16, borderRadius: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  logoutText: { color: 'rgba(255,100,100,0.7)', fontSize: 14, fontWeight: '600' },


});