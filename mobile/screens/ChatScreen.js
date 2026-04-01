import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, SafeAreaView, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getMessages, sendMessage, giveTrustPoint,
} from '../services/api';
import {
  joinRoom, sendSocketMessage,
  onReceiveMessage, offReceiveMessage,
  onUserTyping, onUserStopTyping,
  emitTyping, emitStopTyping,
} from '../services/socket';

const REVEAL_MILESTONES = [
  { msgs: 15, label: 'Prénom révélé 👤', field: 'firstName' },
  { msgs: 30, label: 'Âge & Région révélés 📍', field: 'ageRegion' },
  { msgs: 50, label: 'Photo débloquée 📸', field: 'photo' },
  { msgs: 75, label: 'Intérêts & Bio révélés ✨', field: 'interests' },
];

export default function ChatScreen({ navigation, route }) {
  const { matchId } = route.params || { matchId: '001' };
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [trustPoints, setTrustPoints] = useState(0);
  const [canGivePoint, setCanGivePoint] = useState(true);
  const [messageCount, setMessageCount] = useState(0);
  const [lastMilestone, setLastMilestone] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  const trustPercent = trustPoints * 10;
  const profileUnlocked = trustPercent >= 90;

  const getRevealedInfo = () => {
    const revealed = {};
    REVEAL_MILESTONES.forEach(m => {
      if (messageCount >= m.msgs) revealed[m.field] = true;
    });
    return revealed;
  };

  const revealed = getRevealedInfo();

  useEffect(() => {
    initChat();
    return () => {
      offReceiveMessage();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
    };
  }, []);

  const initChat = async () => {
    try {
      // Get current user
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setUserId(user.id);

      // Join socket room
      joinRoom(matchId);

      // Load existing messages
      const msgs = await getMessages(matchId);
      setMessages(msgs);
      setMessageCount(msgs.length);

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
          checkMilestone(newCount);
          return newCount;
        });
      });

      // Listen for typing
      onUserTyping(() => setIsTyping(true));
      onUserStopTyping(() => setIsTyping(false));

    } catch (err) {
      console.log('Chat init error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkMilestone = (count) => {
    const milestone = REVEAL_MILESTONES.find(m => m.msgs === count);
    if (milestone) {
      setLastMilestone(milestone);
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

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    try {
      // Send via API
      const res = await sendMessage(matchId, text);

      // Add to local messages
      setMessages(prev => [...prev, {
        _id: res.message._id,
        sender: userId,
        text: res.message.text,
        createdAt: res.message.createdAt,
      }]);

      const newCount = res.messageCount;
      setMessageCount(newCount);
      checkMilestone(newCount);

      // Send via socket for real-time
      sendSocketMessage(matchId, userId, text);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (err) {
      console.log('Send message error:', err.message);
    }
  };

  const handleTyping = (text) => {
    setInput(text);
    emitTyping(matchId, userId);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      emitStopTyping(matchId);
    }, 1500);
  };

  const handleTrustPoint = async () => {
    if (!canGivePoint) return;
    try {
      const res = await giveTrustPoint(matchId);
      setTrustPoints(Math.round(res.trustPercent / 10));
      setCanGivePoint(false);
    } catch (err) {
      console.log('Trust error:', err.message);
    }
  };

  const renderMessage = ({ item }) => {
    const isSent = item.sender === userId ||
      item.sender?._id === userId;
    return (
      <View style={[styles.msgRow, isSent && styles.msgRowSent]}>
        <View style={[styles.bubble,
          isSent ? styles.bubbleSent : styles.bubbleRecv]}>
          <Text style={[styles.bubbleText, isSent && styles.bubbleTextSent]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.msgTime}>
          {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit', minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View>
      {/* Match banner */}
      <View style={styles.matchBanner}>
        <Text style={styles.matchBannerIcon}>💘</Text>
        <Text style={styles.matchBannerTitle}>C'est un Match !</Text>
        <Text style={styles.matchBannerSub}>
          Vous avez tous les deux accepté de vous parler
        </Text>
      </View>

      {/* Progress */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>💬 Messages</Text>
          <Text style={styles.progressVal}>{messageCount} msgs</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[
            styles.progressFill,
            { width: `${Math.min((messageCount / 75) * 100, 100)}%` }
          ]} />
        </View>

        {/* Milestones */}
        <View style={styles.milestonesRow}>
          {REVEAL_MILESTONES.map((m, i) => (
            <View key={i} style={[
              styles.milestoneChip,
              messageCount >= m.msgs && styles.milestoneChipDone,
            ]}>
              <Text style={styles.milestoneChipText}>{m.label}</Text>
            </View>
          ))}
        </View>

        {/* Trust gauge */}
        <View style={styles.trustSection}>
          <View style={styles.trustRow}>
            <Text style={styles.trustLabel}>❤️ Jauge de confiance</Text>
            <Text style={[
              styles.trustVal,
              trustPercent >= 90 && styles.trustValUnlocked,
            ]}>
              {trustPercent}% {profileUnlocked ? '🔓' : '🔒'}
            </Text>
          </View>
          <View style={styles.trustTrack}>
            <View style={[
              styles.trustFill,
              {
                width: `${trustPercent}%`,
                backgroundColor: trustPercent >= 90 ? '#22c55e' : '#FF3366',
              }
            ]} />
            <View style={styles.trustThreshold} />
          </View>
          <View style={styles.trustActions}>
            <Text style={styles.trustHint}>
              {canGivePoint
                ? '+1 point disponible aujourd\'hui'
                : '✓ Point donné aujourd\'hui'}
            </Text>
            <TouchableOpacity
              style={[styles.trustBtn, !canGivePoint && styles.trustBtnDisabled]}
              onPress={handleTrustPoint}
              disabled={!canGivePoint}>
              <Text style={styles.trustBtnText}>
                {canGivePoint ? '👍 Faire confiance' : '✓ Fait'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Revealed info */}
        <View style={styles.revealedSection}>
          <Text style={styles.revealedTitle}>INFORMATIONS RÉVÉLÉES</Text>
          <View style={styles.revealedGrid}>
            {[
              { key: 'firstName', icon: '👤', label: 'Prénom', val: revealed.firstName ? 'Révélé' : '???' },
              { key: 'ageRegion', icon: '📍', label: 'Âge & Région', val: revealed.ageRegion ? 'Révélé' : '???' },
              { key: 'photo', icon: '📸', label: 'Photo', val: revealed.photo ? '🖼️' : '???' },
              { key: 'full', icon: '🔓', label: 'Profil complet', val: profileUnlocked ? 'Débloqué!' : '90% confiance' },
            ].map(item => (
              <View key={item.key} style={[
                styles.revealCard,
                revealed[item.key] && styles.revealCardDone,
              ]}>
                <Text style={styles.revealCardIcon}>{item.icon}</Text>
                <Text style={styles.revealCardLabel}>{item.label}</Text>
                <Text style={styles.revealCardVal}>{item.val}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.anonAvatar}>
            <Text style={styles.anonAvatarText}>?</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Identité inconnue</Text>
            {isTyping
              ? <Text style={styles.typingText}>En train d'écrire...</Text>
              : <Text style={styles.headerOnline}>● En ligne</Text>
            }
          </View>
        </View>
<TouchableOpacity
  style={styles.moreBtn}
  onPress={() => navigation.navigate('BlockReport', {
    matchId,
    userId: null,
  })}>
  <Text style={styles.moreBtnText}>⋯</Text>
</TouchableOpacity>
      </View>

      {/* Milestone toast */}
      {showMilestone && (
        <Animated.View style={[styles.milestoneToast, { opacity: milestoneAnim }]}>
          <Text style={styles.milestoneToastText}>
            🎉 {lastMilestone?.label}
          </Text>
        </Animated.View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {loading ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id?.toString() || Math.random().toString()}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderHeader}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          />
        )}

        {/* Input */}
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
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { color: '#fff', fontSize: 22 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anonAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderWidth: 2, borderColor: 'rgba(255,51,102,0.3)',
    alignItems: 'center', justifyContent: 'center',
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
    backgroundColor: '#FF3366',
    borderRadius: 12, padding: 12,
    alignItems: 'center', zIndex: 100,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
  },
  milestoneToastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  matchBanner: {
    alignItems: 'center', padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  matchBannerIcon: { fontSize: 32, marginBottom: 6 },
  matchBannerTitle: { color: '#FF3366', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  matchBannerSub: { color: 'rgba(255,255,255,0.3)', fontSize: 12, textAlign: 'center' },

  progressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  progressRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8,
  },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  progressVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, marginBottom: 12,
  },
  progressFill: { height: '100%', backgroundColor: '#FF3366', borderRadius: 2 },

  milestonesRow: { gap: 6, marginBottom: 16 },
  milestoneChip: {
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  milestoneChipDone: {
    backgroundColor: 'rgba(255,51,102,0.15)',
    borderColor: 'rgba(255,51,102,0.3)',
  },
  milestoneChipText: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },

  trustSection: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  trustLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  trustVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  trustValUnlocked: { color: '#22c55e' },
  trustTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, position: 'relative', marginBottom: 10,
  },
  trustFill: { height: '100%', borderRadius: 3 },
  trustThreshold: {
    position: 'absolute', left: '90%',
    top: -2, width: 2, height: 10,
    backgroundColor: '#22c55e',
  },
  trustActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  trustHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11 },
  trustBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#FF3366',
  },
  trustBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.08)' },
  trustBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  revealedSection: { gap: 10 },
  revealedTitle: {
    color: 'rgba(255,255,255,0.25)', fontSize: 10,
    letterSpacing: 2, fontWeight: '600',
  },
  revealedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  revealCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12,
    alignItems: 'center', gap: 4,
  },
  revealCardDone: {
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderColor: 'rgba(255,51,102,0.2)',
  },
  revealCardIcon: { fontSize: 20 },
  revealCardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 10, letterSpacing: 1 },
  revealCardVal: { color: '#fff', fontSize: 12, fontWeight: '600' },

  messagesList: { paddingBottom: 20 },
  msgRow: { paddingHorizontal: 16, marginVertical: 3, alignItems: 'flex-start' },
  msgRowSent: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%', padding: 12, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: '#FF3366',
    borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
  },
  bubbleText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: '#fff' },
  msgTime: {
    color: 'rgba(255,255,255,0.2)', fontSize: 10,
    marginTop: 3, marginHorizontal: 4,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0d0a12',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
    color: '#fff', fontSize: 14,
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#FF3366',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  sendBtnText: { color: '#fff', fontSize: 16 },
});