import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SOCKET_URL } from '../config';

let socket = null;

export const connectSocket = async () => {
  const token = await AsyncStorage.getItem('token');
  const user = JSON.parse(await AsyncStorage.getItem('user'));

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

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};

export const joinRoom = (matchId) => {
  if (socket) socket.emit('joinRoom', matchId);
};

export const sendSocketMessage = (matchId, senderId, text) => {
  if (socket) socket.emit('sendMessage', { matchId, senderId, text });
};

export const onReceiveMessage = (callback) => {
  if (socket) socket.on('receiveMessage', callback);
};

export const offReceiveMessage = () => {
  if (socket) socket.off('receiveMessage');
};

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

// NEW: Real-time match acceptance
export const onMatchAccepted = (callback) => {
  if (socket) socket.on('matchAccepted', callback);
};

export const offMatchAccepted = () => {
  if (socket) socket.off('matchAccepted');
};
export const onNewMatch = (callback) => {
  if (socket) {
    socket.on('newMatch', callback);
  }
};

export const offNewMatch = () => {
  if (socket) socket.off('newMatch');
};