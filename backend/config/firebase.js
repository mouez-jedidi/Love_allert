const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (fcmToken, title, body, data = {}) => {
  try {
    const message = {
      notification: { title, body },
      data,
      token: fcmToken,
    };
    const response = await admin.messaging().send(message);
    console.log('✅ Notification sent:', response);
    return response;
  } catch (err) {
    console.log('❌ Notification error:', err.message);
  }
};

const sendMatchNotification = async (fcmToken, matchId) => {
  return sendNotification(
    fcmToken,
    '💘 Love Alert !',
    'Une personne compatible est proche de vous !',
    { matchId, type: 'match' }
  );
};

module.exports = { admin, sendNotification, sendMatchNotification };