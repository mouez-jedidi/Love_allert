import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Erreur TaskManager:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    const { latitude, longitude } = locations[0].coords;

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;

      // 1. Mettre à jour la position sur le serveur
      await fetch(`${API_URL}/users/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude }),
      });

      // 2. Lancer la vérification de match à proximité
      await fetch(`${API_URL}/matches/check-nearby`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

    } catch (err) {
      console.log("Erreur lors de l'envoi background location:", err);
    }
  }
});