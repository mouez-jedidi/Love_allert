const Message = require('../models/Message');
const Match = require('../models/Match');
const User = require('../models/User'); // Import du modèle User nécessaire
const { sendPushNotification } = require('../services/notificationService');
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
    const match = await Match.findById(req.params.matchId).populate('users');

    if (!match || match.status !== 'active') {
      return res.status(400).json({ message: 'Chat non disponible' });
    }

    // 1. Créer le message en DB
    const message = await Message.create({
      matchId: req.params.matchId,
      sender: req.user.id,
      text,
    });

    // 2. Mise à jour du compteur
    match.messageCount += 1;
    await match.save();

    // 3. LOGIQUE DE NOTIFICATION PUSH
    // Trouver le destinataire (celui qui n'est pas l'expéditeur actuel)
    const recipientId = match.users.find(id => id.toString() !== req.user.id.toString());
    const recipient = await User.findById(recipientId);

    if (recipient && recipient.fcmToken) {
      // On récupère le nom de l'expéditeur pour la notification
      const senderUser = await User.findById(req.user.id);
      
      // Envoi de la notification
      await sendPushNotification(
        recipient.fcmToken,
        `Nouveau message de ${senderUser.firstName}`,
        text, // Le contenu du message
        { matchId: req.params.matchId, type: 'MESSAGE' } // Données pour l'ouverture de l'app
      );
    }

    res.status(201).json({
      message,
      messageCount: match.messageCount,
      revealed: match.revealed,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};