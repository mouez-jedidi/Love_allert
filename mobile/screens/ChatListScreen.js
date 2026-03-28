import BottomNav from '../components/BottomNav';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView,
} from 'react-native';

const MOCK_CHATS = [
  {
    id: '1',
    messages: 52,
    trust: 60,
    lastMessage: 'Tu aimes le cinéma aussi ?',
    time: '14:35',
    online: true,
    revealed: { firstName: true, ageRegion: true, photo: true },
  },
  {
    id: '2',
    messages: 28,
    trust: 30,
    lastMessage: 'C\'est intéressant ce que tu dis !',
    time: '11:20',
    online: false,
    revealed: { firstName: true, ageRegion: false, photo: false },
  },
  {
    id: '3',
    messages: 8,
    trust: 10,
    lastMessage: 'Bonjour ! Ravi(e) de te parler 😊',
    time: 'Hier',
    online: true,
    revealed: { firstName: false, ageRegion: false, photo: false },
  },
];

const getRevealLabel = (revealed) => {
  if (revealed.photo) return '📸 Photo débloquée';
  if (revealed.ageRegion) return '📍 Âge & Région révélés';
  if (revealed.firstName) return '👤 Prénom révélé';
  return '🔒 Identité inconnue';
};

const getAvatarLabel = (revealed) => {
  if (revealed.photo) return '🖼️';
  if (revealed.firstName) return '?';
  return '?';
};

export default function ChatListScreen({ navigation }) {

  const renderChat = ({ item }) => (
    <TouchableOpacity
      style={styles.chatCard}
      onPress={() => navigation.navigate('Chat', { matchId: item.id })}>

      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <View style={[
          styles.avatar,
          item.revealed.photo && styles.avatarUnlocked,
        ]}>
          <Text style={styles.avatarText}>{getAvatarLabel(item.revealed)}</Text>
        </View>
        {item.online && <View style={styles.onlineDot} />}
      </View>

      {/* Info */}
      <View style={styles.chatInfo}>
        <View style={styles.chatTopRow}>
          <Text style={styles.chatName}>
            {item.revealed.firstName ? 'Inconnu(e)' : 'Identité inconnue'}
          </Text>
          <Text style={styles.chatTime}>{item.time}</Text>
        </View>
        <Text style={styles.chatReveal}>{getRevealLabel(item.revealed)}</Text>
        <Text style={styles.chatLastMsg} numberOfLines={1}>
          {item.lastMessage}
        </Text>

        {/* Progress bars */}
        <View style={styles.barsRow}>
          {/* Messages bar */}
          <View style={styles.miniBar}>
            <View style={styles.miniBarLabel}>
              <Text style={styles.miniBarText}>💬 {item.messages} msgs</Text>
            </View>
            <View style={styles.miniBarTrack}>
              <View style={[
                styles.miniBarFill,
                { width: `${Math.min((item.messages / 75) * 100, 100)}%` }
              ]} />
            </View>
          </View>

          {/* Trust bar */}
          <View style={styles.miniBar}>
            <View style={styles.miniBarLabel}>
              <Text style={styles.miniBarText}>❤️ {item.trust}%</Text>
            </View>
            <View style={styles.miniBarTrack}>
              <View style={[
                styles.miniBarFill,
                {
                  width: `${item.trust}%`,
                  backgroundColor: item.trust >= 90 ? '#22c55e' : '#FF3366',
                }
              ]} />
            </View>
          </View>
        </View>
      </View>

    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          Mes <Text style={styles.titleAccent}>Chats</Text>
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{MOCK_CHATS.length}</Text>
        </View>
      </View>

      {/* Empty state */}
      {MOCK_CHATS.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>💘</Text>
          <Text style={styles.emptyTitle}>Aucun chat pour l'instant</Text>
          <Text style={styles.emptySub}>
            L'app vous notifiera quand une personne{'\n'}
            compatible sera proche de vous
          </Text>
        </View>
      )}

      {/* Chat list */}
      <FlatList
        data={MOCK_CHATS}
        renderItem={renderChat}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Bottom nav */}
      <BottomNav navigation={navigation} active="ChatList" />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: 10, paddingHorizontal: 24,
    paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  titleAccent: { color: '#FF3366' },
  badge: {
    backgroundColor: '#FF3366',
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  list: { padding: 16, paddingBottom: 90, gap: 12 },

  chatCard: {
    flexDirection: 'row', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 14,
  },

  avatarWrap: { position: 'relative' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,51,102,0.1)',
    borderWidth: 2, borderColor: 'rgba(255,51,102,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarUnlocked: {
    backgroundColor: 'rgba(255,51,102,0.2)',
    borderColor: '#FF3366',
  },
  avatarText: { fontSize: 22, color: '#FF3366', fontWeight: '800' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2, borderColor: '#0d0a12',
  },

  chatInfo: { flex: 1, gap: 3 },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  chatTime: { color: 'rgba(255,255,255,0.25)', fontSize: 11 },
  chatReveal: { color: '#FF3366', fontSize: 11, fontWeight: '600' },
  chatLastMsg: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12, marginBottom: 6,
  },

  barsRow: { gap: 5 },
  miniBar: { gap: 3 },
  miniBarLabel: { flexDirection: 'row' },
  miniBarText: { color: 'rgba(255,255,255,0.25)', fontSize: 9 },
  miniBarTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },
  miniBarFill: {
    height: '100%',
    backgroundColor: '#FF3366',
    borderRadius: 2,
  },

  emptyState: {
    flex: 1, alignItems: 'center',
    justifyContent: 'center', gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    color: '#fff', fontSize: 18,
    fontWeight: '700', textAlign: 'center',
  },
  emptySub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 13, textAlign: 'center', lineHeight: 20,
  },


});