const { Expo } = require('expo-server-sdk'); // ✅ correct named import
const expo = new Expo();

exports.sendPushNotification = async (targetToken, title, body, data = {}) => {
  if (!Expo.isExpoPushToken(targetToken)) { // ✅ Expo not __Expo__
    console.error(`❌ Token invalide : ${targetToken}`);
    return;
  }

  const messages = [{
    to: targetToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  }];

  try {
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log('🔔 Ticket:', tickets);
      // Log errors per ticket
      tickets.forEach(ticket => {
        if (ticket.status === 'error') {
          console.error('❌ Ticket error:', ticket.message, ticket.details);
        }
      });
    }
  } catch (error) {
    console.error('❌ Erreur envoi notification:', error);
  }
};