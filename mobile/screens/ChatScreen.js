import React, { useState, useRef, useEffect } from 'react';
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
  getSocket,
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
  const [isOnline, setIsOnline] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const [lastMilestone, setLastMilestone] = useState(null);

  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const typingTimeout = useRef(null);

  // --- INITIALISATION ---
  useEffect(() => {
    initChat();
    
    const socket = getSocket();
    if (socket) {
      socket.on('userOnline', (uid) => {
        if (uid === otherUser?._id) setIsOnline(true);
      });
      socket.on('userOffline', (uid) => {
        if (uid === otherUser?._id) setIsOnline(false);
      });
    }

    return () => {
      offReceiveMessage();
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (socket) {
        socket.off('userOnline');
        socket.off('userOffline');
      }
    };
  }, [otherUser?._id]);

  const initChat = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      const user = JSON.parse(userStr);
      setUserId(user.id);

      joinRoom(matchId);

      const msgs = await getMessages(matchId);
      setMessages(msgs);

      const info = await fetchUnlockedInfo();
      
      // ÉCOUTEUR DE MESSAGES (AVEC ANTI-DOUBLON)
      onReceiveMessage((msg) => {
        setMessages(prev => {
          // On ne rajoute que si l'ID n'existe pas déjà
          const exists = prev.some(m => m._id === msg._id);
          if (exists) return prev;

          return [...prev, {
            _id: msg._id || Date.now().toString(),
            sender: msg.senderId,
            text: msg.text,
            createdAt: msg.time,
          }];
        });

        setMessageCount(prev => {
          const newCount = prev + 1;
          checkMilestone(newCount, prev);
          return newCount;
        });
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

  const fetchUnlockedInfo = async () => {
    try {
      const data = await getUnlockedInfo(matchId);
      setTrustPercent(data.trustPercent);
      setCanGivePoint(data.canGivePoint);
      setMessageCount(data.messageCount);
      setUnlocked(data.unlocked);
      setOtherUser(data.user);
      if (data.user?.isOnline !== undefined) setIsOnline(data.user.isOnline);
      return data;
    } catch (err) {
      console.log('Fetch unlocked info error:', err.message);
    }
  };

  // --- LOGIQUE ENVOI ---
  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');

    try {
      const res = await sendMessage(matchId, text);
      
      // Mise à jour locale immédiate sécurisée
      setMessages(prev => {
        if (prev.some(m => m._id === res.message._id)) return prev;
        return [...prev, {
          _id: res.message._id,
          sender: userId,
          text: res.message.text,
          createdAt: res.message.createdAt,
        }];
      });

      const newCount = res.messageCount;
      setMessageCount(newCount);
      checkMilestone(newCount, newCount - 1);
      
      // Émettre via socket
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

  const checkMilestone = (newCount, oldCount) => {
    const milestones = [15, 30, 50, 75];
    const reached = milestones.find(m => m === newCount && oldCount < m);
    if (reached) {
      let label = reached === 15 ? 'Prénom révélé 👤' : 
                  reached === 30 ? 'Âge & Région révélés 📍' : 
                  reached === 50 ? 'Photo débloquée 📸' : 'Intérêts & Bio révélés ✨';
      setLastMilestone({ msgs: reached, label });
      setShowMilestone(true);
      Animated.sequence([
        Animated.timing(milestoneAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(milestoneAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setShowMilestone(false));
    }
  };

  const handleTrustPoint = async () => {
    if (!canGivePoint) return;
    try {
      const res = await giveTrustPoint(matchId);
      setTrustPercent(res.trustPercent);
      setCanGivePoint(false);
      fetchUnlockedInfo();
    } catch (err) {
      console.log('Trust error:', err.message);
    }
  };

  // --- RENDERING ---
  const renderMessage = ({ item }) => {
    const isSent = item.sender === userId || item.sender?._id === userId;
    return (
      <View style={[styles.msgRow, isSent && styles.msgRowSent]}>
        <View style={[styles.bubble, isSent ? styles.bubbleSent : styles.bubbleRecv]}>
          <Text style={[styles.bubbleText, isSent && styles.bubbleTextSent]}>{item.text}</Text>
        </View>
        <View style={styles.msgMeta}>
          <Text style={styles.msgTime}>
            {new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isSent && <Text style={styles.readReceipt}>{item.read ? '✓✓' : '✓'}</Text>}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.progressSection}>
      <View style={styles.matchBanner}>
        <Text style={styles.matchBannerIcon}>💘</Text>
        <Text style={styles.matchBannerTitle}>C'est un Match !</Text>
      </View>

      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>💬 Messages : {messageCount}/75</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min((messageCount / 75) * 100, 100)}%` }]} />
      </View>

      <View style={styles.trustSection}>
        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>❤️ Confiance : {trustPercent}%</Text>
          <TouchableOpacity 
            style={[styles.trustBtn, !canGivePoint && styles.trustBtnDisabled]} 
            onPress={handleTrustPoint} 
            disabled={!canGivePoint}
          >
            <Text style={styles.trustBtnText}>{canGivePoint ? '👍 Confiance' : '✓ Fait'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.trustTrack}>
          <View style={[styles.trustFill, { width: `${trustPercent}%`, backgroundColor: trustPercent >= 90 ? '#22c55e' : '#FF3366' }]} />
        </View>
      </View>

      <View style={styles.revealedGrid}>
        <InfoCard label="Prénom" val={unlocked.firstName ? otherUser?.firstName : '???'} done={unlocked.firstName} icon="👤" />
        <InfoCard label="Localisation" val={unlocked.ageRegion ? `${otherUser?.region}` : '???'} done={unlocked.ageRegion} icon="📍" />
        <InfoCard label="Photo" val={unlocked.photo ? 'Révélée' : '???'} done={unlocked.photo} icon="📸" />
        <InfoCard label="Profil" val={unlocked.fullProfile ? 'Complet' : '🔒'} done={unlocked.fullProfile} icon="🔓" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}><Text style={styles.backBtn}>←</Text></TouchableOpacity>
        <View style={styles.headerCenter}>
          {unlocked.photo && otherUser?.photo ? (
            <Image source={{ uri: otherUser.photo }} style={styles.avatarImage} />
          ) : (
            <View style={styles.anonAvatar}><Text style={styles.anonAvatarText}>?</Text></View>
          )}
          <View>
            <Text style={styles.headerName}>{unlocked.firstName ? otherUser?.firstName : 'Identité inconnue'}</Text>
            {isTyping ? (
              <Text style={styles.typingText}>écrit...</Text>
            ) : (
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: isOnline ? '#22c55e' : '#666' }]} />
                <Text style={isOnline ? styles.headerOnline : styles.headerOffline}>{isOnline ? 'En ligne' : 'Hors ligne'}</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}><Text style={styles.moreBtnText}>⋯</Text></TouchableOpacity>
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
            keyExtractor={item => item._id}
            contentContainerStyle={styles.messagesList}
            ListHeaderComponent={renderHeader}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Écrire..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={input}
            onChangeText={handleTyping}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend}><Text style={styles.sendBtnText}>➤</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const InfoCard = ({ label, val, done, icon }) => (
  <View style={[styles.revealCard, done && styles.revealCardDone]}>
    <Text style={styles.revealCardIcon}>{icon}</Text>
    <Text style={styles.revealCardLabel}>{label}</Text>
    <Text style={styles.revealCardVal}>{val || '???'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0a12' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backBtn: { color: '#fff', fontSize: 24 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  anonAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,51,102,0.1)', borderWidth: 1, borderColor: '#FF3366', alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#FF3366' },
  anonAvatarText: { color: '#FF3366', fontSize: 16, fontWeight: 'bold' },
  headerName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerOnline: { color: '#22c55e', fontSize: 10 },
  headerOffline: { color: 'rgba(255,255,255,0.3)', fontSize: 10 },
  typingText: { color: '#FF3366', fontSize: 10, fontStyle: 'italic' },
  moreBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  moreBtnText: { color: '#fff', fontSize: 20 },
  milestoneToast: { position: 'absolute', top: 70, alignSelf: 'center', backgroundColor: '#FF3366', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10, zIndex: 100 },
  milestoneToastText: { color: '#fff', fontWeight: 'bold' },
  progressSection: { padding: 16 },
  matchBanner: { alignItems: 'center', marginBottom: 15 },
  matchBannerIcon: { fontSize: 28 },
  matchBannerTitle: { color: '#FF3366', fontWeight: 'bold' },
  progressRow: { marginBottom: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 11 },
  progressTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, marginBottom: 15 },
  progressFill: { height: '100%', backgroundColor: '#FF3366', borderRadius: 2 },
  trustSection: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 12, marginBottom: 15 },
  trustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  trustLabel: { color: '#fff', fontSize: 12 },
  trustTrack: { height: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 },
  trustFill: { height: '100%', borderRadius: 2 },
  trustBtn: { backgroundColor: '#FF3366', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15 },
  trustBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
  trustBtnText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  revealedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  revealCard: { flex: 1, minWidth: '45%', backgroundColor: 'rgba(255,255,255,0.02)', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  revealCardDone: { borderColor: 'rgba(255,51,102,0.3)', backgroundColor: 'rgba(255,51,102,0.05)' },
  revealCardIcon: { fontSize: 18, marginBottom: 2 },
  revealCardLabel: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
  revealCardVal: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  messagesList: { paddingBottom: 20 },
  msgRow: { paddingHorizontal: 16, marginVertical: 4, alignItems: 'flex-start' },
  msgRowSent: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)' },
  bubbleSent: { backgroundColor: '#FF3366' },
  bubbleText: { color: '#fff', fontSize: 14 },
  bubbleTextSent: { color: '#fff' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  msgTime: { color: 'rgba(255,255,255,0.2)', fontSize: 9 },
  readReceipt: { fontSize: 9, color: 'rgba(255,255,255,0.3)' },
  inputBar: { flexDirection: 'row', padding: 12, gap: 10, backgroundColor: '#0d0a12', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, paddingHorizontal: 15, color: '#fff' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FF3366', alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#fff' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff' }
});