import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, SafeAreaView, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';

const REVEAL_MILESTONES = [
  { msgs: 15, label: 'Prénom révélé 👤', field: 'firstName' },
  { msgs: 30, label: 'Âge & Région révélés 📍', field: 'ageRegion' },
  { msgs: 50, label: 'Photo débloquée 📸', field: 'photo' },
  { msgs: 75, label: 'Intérêts & Bio révélés ✨', field: 'interests' },
];

const INITIAL_MESSAGES = [
  {
    id: '1',
    text: 'Bonjour ! Je suis ravi(e) qu\'on se soit matchés 😊',
    sent: false,
    time: '14:30',
  },
];

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [trustPoints, setTrustPoints] = useState(0); // 0-10 (each = 10%)
  const [canGivePoint, setCanGivePoint] = useState(true);
  const [lastMilestone, setLastMilestone] = useState(null);
  const [showMilestone, setShowMilestone] = useState(false);
  const milestoneAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);

  const totalMessages = messages.length;
  const trustPercent = trustPoints * 10;
  const profileUnlocked = trustPercent >= 90;

  // Current revealed info based on message count
  const getRevealedInfo = () => {
    const revealed = {};
    REVEAL_MILESTONES.forEach(m => {
      if (totalMessages >= m.msgs) revealed[m.field] = true;
    });
    return revealed;
  };

  const revealed = getRevealedInfo();

  // Check milestones
  useEffect(() => {
    const milestone = REVEAL_MILESTONES.find(m => m.msgs === totalMessages);
    if (milestone && milestone !== lastMilestone) {
      setLastMilestone(milestone);
      setShowMilestone(true);
      Animated.sequence([
        Animated.timing(milestoneAnim, {
          toValue: 1, duration: 400, useNativeDriver: true,
        }),
        Animated.delay(2500),
        Animated.timing(milestoneAnim, {
          toValue: 0, duration: 400, useNativeDriver: true,
        }),
      ]).start(() => setShowMilestone(false));
    }
  }, [totalMessages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      text: input.trim(),
      sent: true,
      time: new Date().toLocaleTimeString('fr-FR', {
        hour: '2-digit', minute: '2-digit',
      }),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput('');

    // Simulate reply after 1.5s
    setTimeout(() => {
      const replies = [
        'C\'est intéressant ! Parle-moi de toi 😊',
        'Je suis d\'accord avec toi !',
        'Vraiment ? Moi aussi j\'aime ça !',
        'Haha, tu es drôle 😄',
        'On a beaucoup de choses en commun !',
        'Je suis curieux(se) d\'en savoir plus sur toi...',
      ];
      const reply = {
        id: (Date.now() + 1).toString(),
        text: replies[Math.floor(Math.random() * replies.length)],
        sent: false,
        time: new Date().toLocaleTimeString('fr-FR', {
          hour: '2-digit', minute: '2-digit',
        }),
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  const giveTrustPoint = () => {
    if (!canGivePoint || trustPoints >= 10) return;
    setTrustPoints(prev => prev + 1);
    setCanGivePoint(false);
  };

  const renderMessage = ({ item }) => (
    <View style={[styles.msgRow, item.sent && styles.msgRowSent]}>
      <View style={[styles.bubble, item.sent ? styles.bubbleSent : styles.bubbleRecv]}>
        <Text style={[styles.bubbleText, item.sent && styles.bubbleTextSent]}>
          {item.text}
        </Text>
      </View>
      <Text style={styles.msgTime}>{item.time}</Text>
    </View>
  );

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

      {/* Progress bar */}
      <View style={styles.progressSection}>

        {/* Messages progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>💬 Messages</Text>
          <Text style={styles.progressVal}>{totalMessages} msgs</Text>
        </View>
        <View style={styles.progressTrack}>
          {REVEAL_MILESTONES.map((m, i) => (
            <View
              key={i}
              style={[
                styles.progressMark,
                { left: `${(m.msgs / 80) * 100}%` },
                totalMessages >= m.msgs && styles.progressMarkDone,
              ]}>
              <Text style={styles.progressMarkText}>{m.msgs}</Text>
            </View>
          ))}
          <View style={[
            styles.progressFill,
            { width: `${Math.min((totalMessages / 80) * 100, 100)}%` }
          ]} />
        </View>

        {/* Milestones */}
        <View style={styles.milestonesRow}>
          {REVEAL_MILESTONES.map((m, i) => (
            <View key={i} style={[
              styles.milestoneChip,
              totalMessages >= m.msgs && styles.milestoneChipDone,
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
              {trustPercent}%
              {profileUnlocked ? ' 🔓' : ' 🔒'}
            </Text>
          </View>
          <View style={styles.trustTrack}>
            <Animated.View style={[
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
              onPress={giveTrustPoint}
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
            <View style={[styles.revealCard, revealed.firstName && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>👤</Text>
              <Text style={styles.revealCardLabel}>Prénom</Text>
              <Text style={styles.revealCardVal}>
                {revealed.firstName ? 'Inconnu(e)' : '???'}
              </Text>
            </View>
            <View style={[styles.revealCard, revealed.ageRegion && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>📍</Text>
              <Text style={styles.revealCardLabel}>Âge & Région</Text>
              <Text style={styles.revealCardVal}>
                {revealed.ageRegion ? '?? ans · ???' : '???'}
              </Text>
            </View>
            <View style={[styles.revealCard, revealed.photo && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>📸</Text>
              <Text style={styles.revealCardLabel}>Photo</Text>
              <Text style={styles.revealCardVal}>
                {revealed.photo ? '🖼️' : '???'}
              </Text>
            </View>
            <View style={[styles.revealCard, profileUnlocked && styles.revealCardDone]}>
              <Text style={styles.revealCardIcon}>🔓</Text>
              <Text style={styles.revealCardLabel}>Profil complet</Text>
              <Text style={styles.revealCardVal}>
                {profileUnlocked ? 'Débloqué !' : '90% confiance'}
              </Text>
            </View>
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
            <Text style={styles.headerOnline}>● En ligne</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}>
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

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={renderHeader}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
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
    shadowOpacity: 0.4, shadowRadius: 12,
    elevation: 10,
  },
  milestoneToastText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  matchBanner: {
    alignItems: 'center', padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  matchBannerIcon: { fontSize: 32, marginBottom: 6 },
  matchBannerTitle: {
    color: '#FF3366', fontSize: 18,
    fontWeight: '800', marginBottom: 4,
  },
  matchBannerSub: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12, textAlign: 'center',
  },

  progressSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  progressVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  progressTrack: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 2, position: 'relative', marginBottom: 12,
  },
  progressFill: {
    height: '100%', backgroundColor: '#FF3366',
    borderRadius: 2, position: 'absolute',
  },
  progressMark: {
    position: 'absolute', top: -8,
    width: 2, height: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  progressMarkDone: { backgroundColor: '#FF3366' },
  progressMarkText: { display: 'none' },

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
  trustRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: 8,
  },
  trustLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  trustVal: { color: '#FF3366', fontSize: 12, fontWeight: '700' },
  trustValUnlocked: { color: '#22c55e' },
  trustTrack: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3, position: 'relative', marginBottom: 10,
  },
  trustFill: {
    height: '100%', borderRadius: 3,
    position: 'absolute',
  },
  trustThreshold: {
    position: 'absolute', left: '90%',
    top: -2, width: 2, height: 10,
    backgroundColor: '#22c55e',
  },
  trustActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: 'rgba(255,255,255,0.25)',
    fontSize: 10, letterSpacing: 2, fontWeight: '600',
  },
  revealedGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  revealCard: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, padding: 12, alignItems: 'center', gap: 4,
  },
  revealCardDone: {
    backgroundColor: 'rgba(255,51,102,0.08)',
    borderColor: 'rgba(255,51,102,0.2)',
  },
  revealCardIcon: { fontSize: 20 },
  revealCardLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10, letterSpacing: 1,
  },
  revealCardVal: {
    color: '#fff', fontSize: 12, fontWeight: '600',
  },

  messagesList: { paddingBottom: 20 },
  msgRow: {
    paddingHorizontal: 16, marginVertical: 3,
    alignItems: 'flex-start',
  },
  msgRowSent: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '75%', padding: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: '#FF3366',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 4,
  },
  bubbleText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  bubbleTextSent: { color: '#fff' },
  msgTime: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10, marginTop: 3, marginHorizontal: 4,
  },

  inputBar: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, gap: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
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