import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';
import { getMyMatches } from '../services/api';
import BottomNav from '../components/BottomNav';

const getRevealLabel = (messageCount, trustPercent) => {
  if (trustPercent >= 90) return 'Profil débloqué';
  if (messageCount >= 50) return 'Photo débloquée';
  if (messageCount >= 30) return 'Âge et région révélés';
  if (messageCount >= 15) return 'Prénom révélé';
  return 'Identité inconnue';
};

export default function ChatListScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const matches = await getMyMatches();
      setChats(matches);
    } catch (err) {
      console.log('Load chats error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderChat = ({ item }) => {
    const trustPercent = Math.round(
      ((item.user1TrustPoints + item.user2TrustPoints) / 20) * 100
    );

    // Determine avatar placeholder
    const avatarInitial = '?';

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('Chat', { matchId: item._id })}>

        <View style={styles.avatarWrap}>
          <View style={[
            styles.avatar,
            trustPercent >= 90 && styles.avatarUnlocked,
          ]}>
            <Text style={styles.avatarText}>{avatarInitial}</Text>
          </View>
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatTopRow}>
            <Text style={styles.chatName}>
              {trustPercent >= 90 ? 'Profil débloqué' : 'Identité inconnue'}
            </Text>
            <Text style={styles.chatTime}>
              {new Date(item.updatedAt).toLocaleTimeString('fr-FR', {
                hour: '2-digit', minute: '2-digit',
              })}
            </Text>
          </View>
          <Text style={styles.chatReveal}>
            {getRevealLabel(item.messageCount, trustPercent)}
          </Text>

          <View style={styles.barsRow}>
            <View style={styles.miniBar}>
              <Text style={styles.miniBarText}>Messages {item.messageCount}</Text>
              <View style={styles.miniBarTrack}>
                <View style={[
                  styles.miniBarFill,
                  { width: `${Math.min((item.messageCount / 75) * 100, 100)}%` }
                ]} />
              </View>
            </View>
            <View style={styles.miniBar}>
              <Text style={styles.miniBarText}>Confiance {trustPercent}%</Text>
              <View style={styles.miniBarTrack}>
                <View style={[
                  styles.miniBarFill,
                  {
                    width: `${trustPercent}%`,
                    backgroundColor: trustPercent >= 90 ? '#88c9a0' : '#D9A066',
                  }
                ]} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Mes <Text style={styles.titleAccent}>Chats</Text>
        </Text>
        {chats.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{chats.length}</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Chargement...</Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Aucun chat pour l'instant</Text>
          <Text style={styles.emptySub}>
            L'application vous notifiera quand une personne{'\n'}
            compatible sera proche de vous
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChat}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={loadChats}
          refreshing={loading}
        />
      )}

      <BottomNav navigation={navigation} active="ChatList" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 24,
    paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  titleAccent: { color: '#D9A066' },
  badge: {
    backgroundColor: '#D9A066',
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#050505', fontSize: 12, fontWeight: '800' },
  list: { padding: 16, paddingBottom: 90, gap: 12 },
  chatCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 14,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(217,160,102,0.1)',
    borderWidth: 1.5, borderColor: 'rgba(217,160,102,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarUnlocked: {
    backgroundColor: 'rgba(217,160,102,0.2)',
    borderColor: '#D9A066',
  },
  avatarText: { fontSize: 20, color: '#D9A066', fontWeight: '400' },
  chatInfo: { flex: 1, gap: 3 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', alignItems: 'center',
  },
  chatName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  chatTime: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 0.5 },
  chatReveal: { color: '#D9A066', fontSize: 11, fontWeight: '500', letterSpacing: 0.5 },
  barsRow: { gap: 5, marginTop: 4 },
  miniBar: { gap: 3 },
  miniBarText: { color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: 0.5 },
  miniBarTrack: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 1,
  },
  miniBarFill: { height: '100%', borderRadius: 1 },
  emptyState: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 12, paddingHorizontal: 40,
  },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center', letterSpacing: 0.5 },
  emptySub: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12, textAlign: 'center', lineHeight: 18,
  },
});