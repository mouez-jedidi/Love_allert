const Match = require('../models/Match');
const User = require('../models/User');
const { sendMatchNotification } = require('../config/firebase');

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
    const maxDistance = currentUser.maxDistance || 500;

    const nearbyUsers = await User.find({
      _id: { $ne: req.user.id },
      sex: currentUser.sex === 'Homme' ? 'Femme' : 'Homme',
      age: { $gte: currentUser.minAge, $lte: currentUser.maxAge },
      isActive: true,
      blockedUsers: { $ne: req.user.id },
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: currentUser.location.coordinates,
          },
          $maxDistance: maxDistance,
        },
      },
    });

    let bestMatch = null;
    let bestScore = 0;
    let existingPendingMatch = null;

    for (const nearUser of nearbyUsers) {
      if (
        currentUser.age < nearUser.minAge ||
        currentUser.age > nearUser.maxAge
      ) continue;

      const existingMatch = await Match.findOne({
        $or: [
          { user1: req.user.id, user2: nearUser._id },
          { user1: nearUser._id, user2: req.user.id },
        ],
      });

      if (existingMatch) {
        if (existingMatch.status === 'pending') {
          existingPendingMatch = existingMatch;
          const isUser1 = existingMatch.user1.toString() === req.user.id;
          const otherUserId = isUser1 ? existingMatch.user2 : existingMatch.user1;
          // Si l'utilisateur courant a déjà accepté/refusé, alors l'autre n'a pas répondu
          const currentResponse = isUser1 ? existingMatch.user1Accepted : existingMatch.user2Accepted;
          if (currentResponse !== null) {
            // L'autre utilisateur n'a pas encore répondu → lui renvoyer la notification
            const io = req.app.get('io');
            const { emitToUser } = require('../config/socket');
            if (io) {
              emitToUser(io, otherUserId.toString(), 'newMatch', { matchId: existingMatch._id });
            }
            if (nearUser.fcmToken) {
              await sendMatchNotification(nearUser.fcmToken, existingMatch._id);
            }
          }
        }
        continue;
      }

      const score = calculateScore(currentUser, nearUser);
      if (score >= 10 && score > bestScore) {
        bestScore = score;
        bestMatch = nearUser;
      }
    }

    let createdMatch = null;
    if (bestMatch) {
      createdMatch = await Match.create({
        user1: req.user.id,
        user2: bestMatch._id,
        compatibilityScore: bestScore,
      });

      // Notifications push
      if (bestMatch.fcmToken) {
        await sendMatchNotification(bestMatch.fcmToken, createdMatch._id);
      }
      if (currentUser.fcmToken) {
        await sendMatchNotification(currentUser.fcmToken, createdMatch._id);
      }

      // Notifications socket directes via emitToUser
      const io = req.app.get('io');
      const { emitToUser } = require('../config/socket');
      if (io) {
        emitToUser(io, req.user.id, 'newMatch', { matchId: createdMatch._id });
        emitToUser(io, bestMatch._id, 'newMatch', { matchId: createdMatch._id });
      }
    }

    res.json({ matches: createdMatch ? [{ matchId: createdMatch._id, score: bestScore }] : [] });
  } catch (err) {
    console.error('checkNearby error:', err);
    res.status(500).json({ message: err.message });
  }
};
// @route PUT /api/matches/:id/respond
exports.respondToMatch = async (req, res) => {
  try {
    const { accepted } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match non trouvé' });
    }

    // Set response
    if (match.user1.toString() === req.user.id) {
      match.user1Accepted = accepted;
    } else {
      match.user2Accepted = accepted;
    }

    // Check if both responded
    if (match.user1Accepted === true && match.user2Accepted === true) {
      match.status = 'active';
    } else if (match.user1Accepted === false || match.user2Accepted === false) {
      match.status = 'refused';
    }

    await match.save();

    const io = req.app.get('io');
    const socketModule = require('../config/socket');

    if (match.status === 'active') {
      if (socketModule.emitToUser) {
        socketModule.emitToUser(io, match.user1.toString(), 'matchAccepted', { matchId: match._id });
        socketModule.emitToUser(io, match.user2.toString(), 'matchAccepted', { matchId: match._id });
      } else {
        console.log('⚠️ emitToUser function not available');
      }
    }

    res.json({
      match,
      chatOpen: match.status === 'active',
    });
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