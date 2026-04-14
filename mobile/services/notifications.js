import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import Constants from 'expo-constants'; // Importation recommandée

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Les notifications push nécessitent un vrai appareil');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée');
      return null;
    }

    // ✅ Android channel FIRST, before getting the token
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3366',
      });
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '725569d6-cbf3-4969-bee4-27379991cf71';
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log('📱 Expo Push Token:', token.data);

    const authToken = await AsyncStorage.getItem('token');
    if (authToken) {
      // ✅ Correct URL and correct key
      const response = await fetch(`${API_URL}/users/update-fcm-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken: token.data }),
      });
      if (response.ok) {
        console.log('✅ Token sauvegardé sur le serveur');
      } else {
        console.log('❌ Erreur HTTP:', response.status);
      }
    }

    return token.data;
  } catch (err) {
    console.log('❌ Erreur registerForNotifications:', err.message);
    return null;
  }
};

// Écouter les notifications reçues quand l'app est au premier plan
export const onNotificationReceived = (callback) => {
  const subscription = Notifications.addNotificationReceivedListener(callback);
  return () => subscription.remove();
};

// Écouter les réponses aux notifications (clic sur la notification)
export const onNotificationResponse = (callback) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(callback);
  return () => subscription.remove();
};