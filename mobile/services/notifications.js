import { Platform } from 'react-native';

// expo-notifications removed from Expo Go SDK 53+
// Will be re-enabled in production build

export const registerForNotifications = async () => {
  console.log('⚠️ Notifications disabled in Expo Go - will work in production build');
  return null;
};

export const onNotificationReceived = (callback) => {
  return null;
};

export const onNotificationResponse = (callback) => {
  return null;
};