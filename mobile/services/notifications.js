import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';

// Configuration du handler de notification (quand l'app est au premier plan)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Enregistrer l'appareil pour recevoir les notifications
export const registerForNotifications = async () => {
  try {
    // Vérifier si c'est un vrai appareil (pas émulateur)
    if (!Device.isDevice) {
      console.log('⚠️ Les notifications push nécessitent un vrai appareil');
      return null;
    }

    // Demander la permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Permission refusée pour les notifications');
      return null;
    }

    // Obtenir le token Expo
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '5e62d22d-7e18-40a7-9fc6-a7f593cc8a94', // À remplacer par votre project ID Expo
    });
    
    console.log('📱 Expo Push Token:', token.data);
    
    // Sauvegarder le token dans le backend
    const authToken = await AsyncStorage.getItem('token');
    if (authToken) {
      const response = await fetch(`${API_URL}/users/update-fcm-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ fcmToken: token.data }),
      });
      
      if (response.ok) {
        console.log('✅ Token FCM sauvegardé sur le serveur');
      } else {
        console.log('❌ Erreur sauvegarde token');
      }
    }
    
    // Configuration spécifique Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3366',
      });
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