const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Consent
  user1Accepted: { type: Boolean, default: null },
  user2Accepted: { type: Boolean, default: null },

  // Status
  status: {
    type: String,
    enum: ['pending', 'active', 'refused', 'blocked'],
    default: 'pending',
  },

  // Messages count for progressive reveal
  messageCount: { type: Number, default: 0 },

  // Trust gauge (each user gives max 1 point per day = 10%)
  user1TrustPoints: { type: Number, default: 0 }, // max 10
  user2TrustPoints: { type: Number, default: 0 }, // max 10
  user1LastTrust: { type: Date, default: null },
  user2LastTrust: { type: Date, default: null },

  // Compatibility score
  compatibilityScore: { type: Number, default: 0 },

  // Distance when matched (meters)
  distanceAtMatch: { type: Number },

}, { timestamps: true });

// Trust percent (average of both)
MatchSchema.virtual('trustPercent').get(function() {
  const total = this.user1TrustPoints + this.user2TrustPoints;
  return Math.round((total / 20) * 100);
});

// Revealed info based on message count
MatchSchema.virtual('revealed').get(function() {
  return {
    firstName: this.messageCount >= 15,
    ageRegion: this.messageCount >= 30,
    photo: this.messageCount >= 50,
    interests: this.messageCount >= 75,
    fullProfile: this.trustPercent >= 90,
  };
});

module.exports = mongoose.model('Match', MatchSchema);