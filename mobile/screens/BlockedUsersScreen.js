import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView, Platform, Alert,
} from 'react-native';
import api from '../services/api';

export default function BlockedUsersScreen({ navigation }) {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlockedUsers();
  }, []);

  const loadBlockedUsers = async () => {
    try {
      const res = await api.get('/users/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.log('Load blocked error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    const confirm = Platform.OS === 'web'
      ? window.confirm('Débloquer cet utilisateur ?')
      : await new Promise(resolve =>
          Alert.alert(
            'Débloquer',
            'Voulez-vous débloquer cet utilisateur ?',
            [
              { text: 'Annuler', onPress: () => resolve(false), style: 'cancel' },
              { text: 'Débloquer', onPress: () => resolve(true) },
            ]
          )
        );

    if (!confirm) return;

    try {
      await api.post(`/users/unblock/${userId}`);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.log('Unblock error:', err.message);
    }
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>X</Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>Utilisateur bloqué</Text>
        <Text style={styles.userDate}>
          Bloqué le {new Date(item.blockedAt || Date.now()).toLocaleDateString('fr-FR')}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.unblockBtn}
        onPress={() => handleUnblock(item._id)}>
        <Text style={styles.unblockBtnText}>Débloquer</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Utilisateurs bloqués</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
          <Text style={styles.emptySub}>
            Les utilisateurs que vous bloquez apparaîtront ici
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          renderItem={renderUser}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 0.5, width: 60 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600', letterSpacing: 0.5 },
  list: { padding: 16, gap: 12 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(217,160,102,0.1)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(217,160,102,0.2)',
  },
  avatarText: { fontSize: 18, color: '#D9A066', fontWeight: '500' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
  userDate: { color: 'rgba(255,255,255,0.35)', fontSize: 11, marginTop: 2 },
  unblockBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  unblockBtnText: { color: '#fff', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  emptyState: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 12, padding: 32,
  },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  emptySub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12, textAlign: 'center', lineHeight: 18,
  },
  emptyText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
});