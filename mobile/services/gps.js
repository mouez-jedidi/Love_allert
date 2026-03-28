import * as Location from 'expo-location';
import { updateLocation, checkNearby } from './api';

let locationInterval = null;

export const startGPS = async (onMatchFound) => {
  // Request permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('❌ GPS permission denied');
    return false;
  }

  // Send location every 30 seconds
  locationInterval = setInterval(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      // Update location on server
      await updateLocation(latitude, longitude);

      // Check for nearby matches
      const { matches } = await checkNearby();

      if (matches && matches.length > 0) {
        onMatchFound(matches[0]);
      }

    } catch (err) {
      console.log('GPS Error:', err.message);
    }
  }, 30000); // every 30 seconds

  return true;
};

export const stopGPS = () => {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
  }
};

export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return location.coords;
};