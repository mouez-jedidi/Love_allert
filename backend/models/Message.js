const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match', required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true,
  },
  text: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);