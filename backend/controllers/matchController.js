const Match = require('../models/Match');
const User = require('../models/User');
const { sendPushNotification } = require('../services/notificationService'); // Notre nouveau service
const { getOnlineUsers, emitToUser } = require('../config/socket');
// Calculate compatibility score
const calculateScore = (user1, user2) => {
  let score = 0;

  // Common interests
  const commonInterests = user1.interests.filter(i =>
    user2.interests.includes(i)
  );
  score += commonInterests.length * 10;

  // Same region
  if (user1.region && user1.region === user2.region) score += 20;

  // Same objective
  if (user1.objective && user1.objective === user2.objective) score += 30;

  // Same religion
  if (user1.religion && user1.religion === user2.religion) score += 15;

  // Age difference (closer = better)
  const ageDiff = Math.abs(user1.age - user2.age);
  if (ageDiff <= 2) score += 20;
  else if (ageDiff <= 5) score += 10;

  return Math.min(score, 100);
};

// @route POST /api/matches/check-nearby
exports.checkNearby = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const onlineUserIds = getOnlineUsers();

    const nearbyUsers = await User.find({
      _id: { $ne: req.user.id, $in: onlineUserIds },
      sex: currentUser.sex === 'Homme' ? 'Femme' : 'Homme',
      age: { $gte: currentUser.minAge, $lte: currentUser.maxAge },
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: currentUser.location.coordinates },
          $maxDistance: 50, 
        },
      },
    });

    let matchProposal = null;

    for (const nearUser of nearbyUsers) {
      const existingMatch = await Match.findOne({
        $or: [
          { user1: req.user.id, user2: nearUser._id },
          { user1: nearUser._id, user2: req.user.id },
        ],
      });

      if (existingMatch) continue; 

      const score = calculateScore(currentUser, nearUser);
      if (score >= 10) {
        matchProposal = nearUser;
        break; 
      }
    }

    if (matchProposal) {
      const io = req.app.get('io');
      const score = calculateScore(currentUser, matchProposal);

      const newMatch = await Match.create({
        user1: req.user.id,
        user2: matchProposal._id,
        compatibilityScore: score,
        status: 'pending',
        user1Accepted: null,
        user2Accepted: null
      });

      const matchData = { 
        matchId: newMatch._id, 
        distance: "Très proche", 
        score: score 
      };

      // 1. Sockets (Si l'app est ouverte)
      emitToUser(io, req.user.id, 'newMatch', matchData);
      emitToUser(io, matchProposal._id, 'newMatch', matchData);

      // 2. Push Notification (Si l'app est fermée)
      // On prévient surtout l'autre utilisateur (matchProposal) qu'une alerte est proche
      if (matchProposal.fcmToken) {
        await sendPushNotification(
          matchProposal.fcmToken,
          "Alerte Proximité ! 🔥",
          "Quelqu'un qui vous correspond est tout près...",
          { matchId: newMatch._id, type: 'NEW_MATCH' }
        );
      }

      return res.json({ message: "Match proposé", matchId: newMatch._id });
    }

    res.json({ message: "Aucun utilisateur à proximité" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route PUT /api/matches/:id/respond
exports.respondToMatch = async (req, res) => {
  try {
    const { accepted } = req.body;
    const match = await Match.findById(req.params.id)
      .populate('user1')
      .populate('user2');

    if (!match) return res.status(404).json({ message: 'Match non trouvé' });

    if (match.user1._id.toString() === req.user.id) {
      match.user1Accepted = accepted;
    } else {
      match.user2Accepted = accepted;
    }

    if (match.user1Accepted === true && match.user2Accepted === true) {
      match.status = 'active';
    } else if (match.user1Accepted === false || match.user2Accepted === false) {
      match.status = 'refused';
    }

    await match.save();

    const io = req.app.get('io');

    if (match.status === 'active') {
      // Sockets
      emitToUser(io, match.user1._id.toString(), 'matchAccepted', { matchId: match._id });
      emitToUser(io, match.user2._id.toString(), 'matchAccepted', { matchId: match._id });

      // Push Notifications : Prévenir les deux que le chat est ouvert !
      const sendTo = (user, other) => {
        if (user.fcmToken) {
          sendPushNotification(
            user.fcmToken,
            "Match validé ! ❤️",
            `C'est réciproque ! Vous pouvez maintenant discuter.`,
            { matchId: match._id, type: 'MATCH_ACTIVE' }
          );
        }
      };

      sendTo(match.user1, match.user2);
      sendTo(match.user2, match.user1);
    }

    res.json({ match, chatOpen: match.status === 'active' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route POST /api/matches/:id/trust
exports.giveTrustPoint = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match non trouvé' });

    const isUser1 = match.user1.toString() === req.user.id;
    const lastTrustField = isUser1 ? 'user1LastTrust' : 'user2LastTrust';
    const trustField = isUser1 ? 'user1TrustPoints' : 'user2TrustPoints';

    // Check if already gave point today
    const lastTrust = match[lastTrustField];
    if (lastTrust) {
      const today = new Date();
      const last = new Date(lastTrust);
      if (
        today.getDate() === last.getDate() &&
        today.getMonth() === last.getMonth() &&
        today.getFullYear() === last.getFullYear()
      ) {
        return res.status(400).json({
          message: 'Vous avez déjà donné un point aujourd\'hui'
        });
      }
    }

    // Give point (max 10)
    if (match[trustField] < 10) {
      match[trustField] += 1;
      match[lastTrustField] = new Date();
      await match.save();
    }

    const trustPercent = Math.round(
      ((match.user1TrustPoints + match.user2TrustPoints) / 20) * 100
    );

    res.json({
      trustPercent,
      profileUnlocked: trustPercent >= 90,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/matches/my-matches
exports.getMyMatches = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);
    const blockedIds = currentUser.blockedUsers || [];
    
    const matches = await Match.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }],
      status: 'active',
      user1: { $nin: blockedIds },
      user2: { $nin: blockedIds },
    }).populate('user1', '-password -email')
      .populate('user2', '-password -email');
    
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/matches/:id/trust-info
exports.getTrustInfo = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const isUser1 = match.user1.toString() === req.user.id;
    const trustField = isUser1 ? 'user1TrustPoints' : 'user2TrustPoints';
    const lastTrustField = isUser1 ? 'user1LastTrust' : 'user2LastTrust';

    const combinedPercent = Math.round(((match.user1TrustPoints + match.user2TrustPoints) / 20) * 100);
    
    let canGiveToday = true;
    const lastTrust = match[lastTrustField];
    if (lastTrust) {
      const today = new Date();
      const last = new Date(lastTrust);
      if (today.getDate() === last.getDate() &&
          today.getMonth() === last.getMonth() &&
          today.getFullYear() === last.getFullYear()) {
        canGiveToday = false;
      }
    }

    res.json({
      trustPercent: combinedPercent,
      myTrustPoints: match[trustField],
      canGivePoint: canGiveToday,
      profileUnlocked: combinedPercent >= 90,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @route GET /api/matches/:id/unlocked-info
exports.getUnlockedInfo = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('user1', '-password')
      .populate('user2', '-password');
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const currentUserId = req.user.id;
    const otherUser = match.user1._id.toString() === currentUserId ? match.user2 : match.user1;
    const currentUserIsUser1 = match.user1._id.toString() === currentUserId;
    
    const messageCount = match.messageCount;
    const trustPercent = Math.round(((match.user1TrustPoints + match.user2TrustPoints) / 20) * 100);
    
    // Determine what is unlocked based on thresholds
    const unlocked = {
      firstName: messageCount >= 15,
      ageAndRegion: messageCount >= 30,
      photo: messageCount >= 50,
      interests: messageCount >= 75,
      fullProfile: trustPercent >= 90,
    };
    
    const revealedInfo = {};
    if (unlocked.firstName) revealedInfo.firstName = otherUser.firstName;
    if (unlocked.ageAndRegion) {
      revealedInfo.age = otherUser.age;
      revealedInfo.region = otherUser.region;
    }
    if (unlocked.photo) revealedInfo.photo = otherUser.photo;
    if (unlocked.interests) revealedInfo.interests = otherUser.interests;
    if (unlocked.fullProfile) {
      revealedInfo.bio = otherUser.bio;
      revealedInfo.civilStatus = otherUser.civilStatus;
      revealedInfo.educationLevel = otherUser.educationLevel;
      revealedInfo.workDomain = otherUser.workDomain;
      revealedInfo.studyDomain = otherUser.studyDomain;
    }
    
    // Always include anonymous placeholder if not unlocked
    if (!revealedInfo.firstName) revealedInfo.firstName = '???';
    if (!revealedInfo.ageAndRegion) revealedInfo.ageRegionDisplay = '???';
    
    res.json({
      unlocked,
      revealedInfo,
      messageCount,
      trustPercent,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};