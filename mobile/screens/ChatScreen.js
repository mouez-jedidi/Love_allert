import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, SafeAreaView, Animated,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessages, sendMessage, giveTrustPoint, getUnlockedInfo,
} from '../services/api';
import {
  joinRoom, sendSocketMessage,
  onReceiveMessage, offReceiveMessage,
  onUserTyping, onUserStopTyping,
  emitTyping, emitStopTyping,
} from '../services/socket';

export default function ChatScreen({ navigation, route }) {
  const { matchId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [trustPercent, setTrustPercent] = useState(0);
  const [canGivePoint, setCanGivePoint] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [unlocked, setUnlocked] = useState({
    firstName: false,
    ageRegion: false,
    photo: false,
    interests: false,
    fullProfile: false,
  });
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(null);

  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  // Helper to fetch latest unlocked info
  const fetchUnlockedInfo = async () => {
    try {
      const data = await getUnlockedInfo(matchId);
      setTrustPercent(data.trustPercent);
      setCanGivePoint(data.canGivePoint);
      setMessageCount(data.messageCount);
      setUnlocked(data.unlocked);
      setOtherUser(data.user);
      return data;
    } catch (err) {
      console.log('Fetch unlocked info error:', err.message);
    }
  };

  // Check milestone and show toast
  const checkMilestone = (newCount, oldCount) => {
    const milestones = [15, 30, 50, 75];
    const reached = milestones.find(m => m === newCount && oldCount < m);
    if (reached) {
      let label = '';
      if (reached === 15) label = 'Prénom révélé 👤';
      else if (reached === 30) label = 'Âge & Région révélés 📍';
      else if (reached === 50) label = 'Photo débloquée 📸';
      else if (reached === 75) label = 'Intérêts & Bio révélés ✨';
      setLastMilestone({ msgs: reached, label });
      setShowMilestone(true);
      Animated.sequence([
        Animated.timing(milestoneAnim, {
          toValue: 1, duration: 400, useNativeDriver: false,
        }),
        Animated.delay(2500),
        Animated.timing(milestoneAnim, {
          toValue: 0, duration: 400, useNativeDriver: false,
        }),
      ]).start(() => setShowMilestone(false));
    }
  };

  useEffect(() => {
    initChat();
    return () => {
      offReceiveMessage();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const initChat = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setUserId(user.id);

      // Join socket room
      joinRoom(matchId);

      // Load messages
      const msgs = await getMessages(matchId);
      setMessages(msgs);

      // Load unlocked info
      const info = await fetchUnlockedInfo();
      setMessageCount(info.messageCount);

      // Listen for new messages
      onReceiveMessage((msg) => {
        setMessages(prev => [...prev, {
          _id: Date.now().toString(),
          sender: msg.senderId,
          text: msg.text,
          createdAt: msg.time,
        }]);
        setMessageCount(prev => {
          const newCount = prev + 1;
          checkMilestone(newCount, prev);
          return newCount;
        });
        // Refresh unlocked info after new message (might unlock something)
        fetchUnlockedInfo();
      });

      onUserTyping(() => setIsTyping(true));
      onUserStopTyping(() => setIsTyping(false));

    } catch (err) {
      console.log('Chat init error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    try {
      const res = await sendMessage(matchId, text);
      setMessages(prev => [...prev, {
        _id: res.message._id,
        sender: userId,
        text: res.message.text,
        createdAt: res.message.createdAt,
      }]);
      const newCount = res.messageCount;
      setMessageCount(newCount);
      checkMilestone(newCount, newCount - 1);
      fetchUnlockedInfo(); // Refresh after message
      sendSocketMessage(matchId, userId, text);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      console.log('Send error:', err.message);
    }
  };

  const handleTyping = (text) => {
    setInput(text);
    emitTyping(matchId, userId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitStopTyping(matchId), 1500);
  };

  const handleTrustPoint = async () => {
    if (!canGivePoint) return;
    try {
      const res = await giveTrustPoint(matchId);
      setTrustPercent(res.trustPercent);
      setCanGivePoint(false);
      fetchUnlockedInfo(); // Refresh in case full profile unlocked
    } catch (err) {
      console.log('Trust error:', err.message);
    }
  };

  const renderMessage = ({ item }) => {
    const isSent = item.sender === userId || item.sender?._id === userId;
    return (
      <View style={[styles.msgRow, isSent && styles.msgRowSent]}>
        <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleRecv]}>
          <Text style={[styles.bubbleText, isSent && styles.bubbleTextSent]}>
            {item.text}
          </Text>
        </View>
        <View style={styles.msgMeta}>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit', minute: '2-digit',
            })}
          </Text>
          {isSent && <Text style={styles.readReceipt}>{item.read ? '✓✓' : '✓'}</Text>}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      <View style={styles.matchBanner}>
        <Text style={styles.matchBannerIcon}>💘</Text>
        <Text style={styles.matchBannerTitle}>C'est un Match !</Text>
        <Text style={styles.matchBannerSub}>
          Vous avez tous les deux accepté de vous parler
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>💬 Messages</Text>
          <Text style={styles.progressVal}>{messageCount} msgs</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min((messageCount / 75) * 100, 100)}%` }]} />
        </View>

        <View style={styles.milestonesRow}>
          {[
            { msgs: 15, label: 'Prénom révélé 👤', unlocked: unlocked.firstName },
            { msgs: 30, label: 'Âge & Région 📍', unlocked: unlocked.ageRegion },
            { msgs: 50, label: 'Photo débloquée 📸', unlocked: unlocked.photo },
            { msgs: 75, label: 'Intérêts & Bio ✨', unlocked: unlocked.interests },
          ].map((m, i) => (
            <View key={i} style={[styles.milestoneChip, m.unlocked && styles.milestoneChipDone]}>
              <Text style={styles.milestoneChipText}>{m.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Text style={styles.trustLabel}>❤️ Jauge de confiance</Text>
            <Text style={[styles.trustVal, trustPercent >= 90 && styles.trustValUnlocked]}>
              {trustPercent}% {trustPercent >= 90 ? '🔓' : '🔒'}
            </Text>
          </View>
          <View style={styles.trustTrack}>
            <View style={[styles.trustFill, { width: `${trustPercent}%`, backgroundColor: trustPercent >= 90 ? '#22c55e' : '#FF3366' }]} />
            <View style={styles.trustThreshold} />
          </View>
          <View style={styles.trustActions}>
            <Text style={styles.trustHint}>
              {canGivePoint ? '+1 point disponible aujourd\'hui' : '✓ Point donné aujourd\'hui'}
            </Text>
            <TouchableOpacity style={[styles.trustBtn, !canGivePoint && styles.trustBtnDisabled]} onPress={handleTrustPoint} disabled={!canGivePoint}>
              <Text style={styles.trustBtnText}>{canGivePoint ? '👍 Faire confiance' : '✓ Fait'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.revealedSection}>
          <Text style={styles.revealedTitle}>INFORMATIONS RÉVÉLÉES</Text>
          <View style={styles.revealedGrid}>
            <View style={[styles.revealCard, unlocked.firstName && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>👤</Text>
              <Text style={styles.revealCardLabel}>Prénom</Text>
              <Text style={styles.revealCardVal}>{unlocked.firstName ? (otherUser?.firstName || '?') : '???'}</Text>
            </View>
            <View style={[styles.revealCard, unlocked.ageRegion && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>📍</Text>
              <Text style={styles.revealCardLabel}>Âge & Région</Text>
              <Text style={styles.revealCardVal}>
                {unlocked.ageRegion ? `${otherUser?.age || '?'} ans, ${otherUser?.region || '?'}` : '???'}
              </Text>
            </View>
            <View style={[styles.revealCard, unlocked.photo && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>📸</Text>
              <Text style={styles.revealCardLabel}>Photo</Text>
              <Text style={styles.revealCardVal}>{unlocked.photo ? '🖼️' : '???'}</Text>
            </View>
            <View style={[styles.revealCard, unlocked.fullProfile && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>🔓</Text>
              <Text style={styles.revealCardLabel}>Profil complet</Text>
              <Text style={styles.revealCardVal}>{unlocked.fullProfile ? 'Débloqué!' : '90% confiance'}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          {unlocked.photo && otherUser?.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.anonAvatar}>
              <Text style={styles.anonAvatarText}>?</Text>
            </View>
          )}
          <View>
            <Text style={styles.headerName}>
              {unlocked.firstName ? otherUser?.firstName || 'Inconnu' : 'Identité inconnue'}
            </Text>
            {isTyping ? <Text style={styles.typingText}>En train d'écrire...</Text> : <Text style={styles.headerOnline}>● En ligne</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn} onPress={() => navigation.navigate('BlockReport', { matchId, userId: null })}>
          <Text style={styles.moreBtnText}>⋯</Text>
        </TouchableOpacity>
      </View>

      {showMilestone && (
        <Animated.View style={[styles.milestoneToast, { opacity: milestoneAnim }]}>
          <Text style={styles.milestoneToastText}>🎉 {lastMilestone?.label}</Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.loadingWrap}><Text style={styles.loadingText}>Chargement...</Text></View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderHeader}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={input}
            onChangeText={handleTyping}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
            <Text style={styles.sendBtnText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.4)', fontSize: 14 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: '#fff', fontSize: 22 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anonAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,51,102,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 2, borderColor: '#FF3366',
  },
  anonAvatarText: { color: '#FF3366', fontSize: 18, fontWeight: '800' },
  headerName: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerOnline: { color: '#22c55e', fontSize: 11 },
  typingText: { color: '#FF3366', fontSize: 11, fontStyle: 'italic' },
  moreBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  moreBtnText: { color: '#fff', fontSize: 18 },
  milestoneToast: {
    position: 'absolute', top: 80, left: 20, right: 20,
    backgroundColor: '#FF3366', borderRadius: 12, padding: 12,
    alignItems: 'center', zIndex: 100,
    shadowColor: '#FF3366', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  milestoneToastText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  matchBanner: {
    alignItems: 'center', padding: 20,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  matchBannerIcon: { fontSize: 32, marginBottom: 6 },
  matchBannerTitle: { color: '#FF3366', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  matchBannerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' },
  progressSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  progressVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 12 },
  progressFill: { height: '100%', backgroundColor: '#FF3366', borderRadius: 2 },
  milestonesRow: { gap: 6, marginBottom: 16 },
  milestoneChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  milestoneChipDone: { backgroundColor: 'rgba(255,51,102,0.15)', borderColor: 'rgba(255,51,102,0.3)' },
  milestoneChipText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  trustSection: {
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 16,
  },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trustLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  trustVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  trustValUnlocked: { color: '#22c55e' },
  trustTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 3, position: 'relative', marginBottom: 10 },
  trustFill: { height: '100%', borderRadius: 3 },
  trustThreshold: { position: 'absolute', left: '90%', top: -2, width: 2, height: 10, backgroundColor: '#22c55e' },
  trustActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trustHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  trustBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#FF3366' },
  trustBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  trustBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  revealedSection: { gap: 10 },
  revealedTitle: { color: 'rgba(255,255,255,0.25)', fontSize: 10, letterSpacing: 2, fontWeight: '600' },
  revealedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  revealCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12, alignItems: 'center', gap: 4,
  },
  revealCardDone: { backgroundColor: 'rgba(255,51,102,0.08)', borderColor: 'rgba(255,51,102,0.2)' },
  revealCardIcon: { fontSize: 20 },
  revealCardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 1 },
  revealCardVal: { color: '#fff', fontSize: 12, fontWeight: '600' },
  messagesList: { paddingBottom: 20 },
  msgRow: { paddingHorizontal: 16, marginVertical: 3, alignItems: 'flex-start' },
  msgRowSent: { alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', padding: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', borderBottomLeftRadius: 4 },
  bubbleSent: { backgroundColor: '#FF3366', borderBottomLeftRadius: 18, borderBottomRightRadius: 4 },
  bubbleText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: '#fff' },
  msgTime: { color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 3, marginHorizontal: 4 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  readReceipt: { fontSize: 10, color: 'rgba(255,255,255,0.4)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', backgroundColor: '#0d0a12',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontSize: 16 },
});