import * as Location from 'expo-location';
import { updateLocation, checkNearby } from './api';

let locationInterval = null;

export const startGPS = async (onMatchFound) => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('❌ GPS permission denied');
      return false;
    }

    console.log('✅ GPS started');

    // Send location immediately first time
    await sendLocationAndCheck(onMatchFound);

    // Then every 30 seconds
    locationInterval = setInterval(async () => {
      await sendLocationAndCheck(onMatchFound);
    }, 30000);

    return true;
  } catch (err) {
    console.log('GPS start error:', err.message);
    return false;
  }
};

const sendLocationAndCheck = async (onMatchFound) => {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;
    console.log('📍 Sending location:', latitude, longitude);

    // Update location on server
    await updateLocation(latitude, longitude);

    // Check for nearby matches
    const { matches } = await checkNearby();
    console.log('🔍 Nearby matches:', matches?.length || 0);

    if (matches && matches.length > 0) {
      console.log('💘 Match found!', matches[0]);
      onMatchFound(matches[0]);
    }

  } catch (err) {
    console.log('GPS Error:', err.message);
  }
};

export const stopGPS = () => {
  if (locationInterval) {
    clearInterval(locationInterval);
    locationInterval = null;
    console.log('🛑 GPS stopped');
  }
};

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return location.coords;
  } catch (err) {
    console.log('Get location error:', err.message);
    return null;
  }
};