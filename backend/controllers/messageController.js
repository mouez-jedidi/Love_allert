const Message = require('../models/Message');
const Match = require('../models/Match');

// @route GET /api/messages/:matchId
exports.getMessages = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    
    // Mark all messages from other user as read
    await Message.updateMany(
      { matchId, sender: { $ne: req.user.id }, read: false },
      { $set: { read: true } }
    );
    
    const messages = await Message.find({ matchId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// @route POST /api/messages/:matchId
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const match = await Match.findById(req.params.matchId);

    if (!match || match.status !== 'active') {
      return res.status(400).json({ message: 'Chat non disponible' });
    }

    const message = await Message.create({
      matchId: req.params.matchId,
      sender: req.user.id,
      text,
    });

    // Increment message count
    match.messageCount += 1;
    await match.save();

    res.status(201).json({
      message,
      messageCount: match.messageCount,
      revealed: match.revealed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};