const { Expo } = require('expo-server-sdk');
let expo = new Expo();

exports.sendPushNotification = async (targetToken, title, body, data = {}) => {
  // Vérifier si le token est valide pour Expo
  if (!Expo.isExpoPushToken(targetToken)) {
    console.error(`❌ Token de notification invalide : ${targetToken}`);
    return;
  }

  // Préparer le message
  const messages = [{
    to: targetToken,
    sound: 'default',
    title: title,
    body: body,
    data: data, // Utile pour rediriger l'utilisateur vers le bon chat au clic
    priority: 'high',
  }];

  try {
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log('🔔 Notification envoyée avec succès:', ticketChunk);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
  }
};