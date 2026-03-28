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

    // Find nearby opposite sex users
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

    const matches = [];

    for (const nearUser of nearbyUsers) {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { user1: req.user.id, user2: nearUser._id },
          { user1: nearUser._id, user2: req.user.id },
        ],
      });

      if (existingMatch) continue;

      // Calculate score
      const score = calculateScore(currentUser, nearUser);

      if (score >= 30) {
        // Create match
        const match = await Match.create({
          user1: req.user.id,
          user2: nearUser._id,
          compatibilityScore: score,
        });

// Send notifications to both users
if (currentUser.fcmToken) {
  await sendMatchNotification(currentUser.fcmToken, match._id.toString());
}
if (nearUser.fcmToken) {
  await sendMatchNotification(nearUser.fcmToken, match._id.toString());
}

matches.push({
  matchId: match._id,
  score,
});
      }
    }

    res.json({ matches });
  } catch (err) {
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
    const matches = await Match.find({
      $or: [{ user1: req.user.id }, { user2: req.user.id }],
      status: 'active',
    }).populate('user1', '-password -email')
      .populate('user2', '-password -email');

    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};