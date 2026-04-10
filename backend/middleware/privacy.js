const Match = require('../models/Match');

/**
 * Filter user data based on match status and unlocked info
 * @param {Object} targetUser - The user being requested
 * @param {String} currentUserId - The ID of the requesting user
 * @returns {Object} Filtered user object
 */
const filterUserByPrivacy = async (targetUser, currentUserId) => {
  // If requesting own data, return everything (except password)
  if (targetUser._id.toString() === currentUserId) {
    const userObj = targetUser.toObject();
    delete userObj.password;
    delete userObj.emailVerificationCode;
    delete userObj.emailVerificationExpiry;
    return userObj;
  }

  // Find active match between them
  const match = await Match.findOne({
    $or: [
      { user1: currentUserId, user2: targetUser._id },
      { user1: targetUser._id, user2: currentUserId },
    ],
    status: 'active',
  });

  if (!match) {
    // No active match – only return public info (nothing identifiable)
    return {
      _id: targetUser._id,
      // No name, no photo, no age, no location
      // Only generic fields
    };
  }

  // There is an active match – apply progressive reveal
  const messageCount = match.messageCount;
  const trustPercent = Math.round(((match.user1TrustPoints + match.user2TrustPoints) / 20) * 100);
  const profileUnlocked = trustPercent >= 90;

  const unlocked = {
    firstName: messageCount >= 15,
    ageRegion: messageCount >= 30,
    photo: messageCount >= 50,
    interests: messageCount >= 75,
    fullProfile: profileUnlocked,
  };

  const filtered = {
    _id: targetUser._id,
    sex: targetUser.sex, // Always visible (male/female)
  };

  if (unlocked.firstName) filtered.firstName = targetUser.firstName;
  if (unlocked.ageRegion) {
    filtered.age = targetUser.age;
    filtered.region = targetUser.region;
  }
  if (unlocked.photo) filtered.photo = targetUser.photo;
  if (unlocked.interests) {
    filtered.interests = targetUser.interests;
    filtered.bio = targetUser.bio;
  }
  if (profileUnlocked) {
    filtered.lastName = targetUser.lastName;
    filtered.civilStatus = targetUser.civilStatus;
    filtered.religion = targetUser.religion;
    filtered.educationLevel = targetUser.educationLevel;
    filtered.objective = targetUser.objective;
    filtered.gallery = targetUser.gallery;
  }

  return filtered;
};

module.exports = { filterUserByPrivacy };