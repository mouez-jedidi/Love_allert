import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { updateProfile } from './api';

// How notifications appear when app is in foreground
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
      console.log('Must use physical device for notifications');
      return null;
    }

    // Check existing permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'love-alert-14173',
    });

    console.log('📱 FCM Token:', token.data);

    // Save token to backend
    await updateProfile({ fcmToken: token.data });

    // Android channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Love Alert',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF3366',
      });
    }

    return token.data;
  } catch (err) {
    console.log('Notification setup error:', err.message);
    return null;
  }
};

export const onNotificationReceived = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

export const onNotificationResponse = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};