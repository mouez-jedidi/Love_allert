import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SOCKET_URL } from '../config';

let socket = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('token');
  const userStr = await AsyncStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      if (user) socket.emit('join', user.id);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
    });
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const joinRoom = (matchId) => {
  if (socket) socket.emit('joinRoom', matchId);
};

export const sendSocketMessage = (matchId, senderId, text) => {
  if (socket) socket.emit('sendMessage', { matchId, senderId, text });
};

// Remplace ta fonction onReceiveMessage par celle-ci
export const onReceiveMessage = (callback) => {
  if (socket) {
    socket.off('receiveMessage'); // 👈 TRÈS IMPORTANT : on supprime l'écouteur précédent avant d'en créer un nouveau
    socket.on('receiveMessage', (data) => {
      console.log("📩 Message reçu par le socket");
      callback(data);
    });
  }
};

export const offReceiveMessage = () => {
  if (socket) socket.off('receiveMessage');
};

// --- GESTION DES MATCHS ---

export const onNewMatch = (callback) => {
  if (socket) {
    socket.off('newMatch'); // Nettoyer l'ancien écouteur
    socket.on('newMatch', callback);
  }
};

export const offNewMatch = () => {
  if (socket) socket.off('newMatch');
};

export const onMatchAccepted = (callback) => {
  if (socket) {
    socket.off('matchAccepted'); // Nettoyer l'ancien écouteur
    socket.on('matchAccepted', callback);
  }
};

export const offMatchAccepted = () => {
  if (socket) socket.off('matchAccepted');
};

// --- TYPING ---
export const emitTyping = (matchId, userId) => {
  if (socket) socket.emit('typing', { matchId, userId });
};

export const emitStopTyping = (matchId) => {
  if (socket) socket.emit('stopTyping', { matchId });
};

export const onUserTyping = (callback) => {
  if (socket) socket.on('userTyping', callback);
};

export const onUserStopTyping = (callback) => {
  if (socket) socket.on('userStopTyping', callback);
};