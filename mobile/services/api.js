import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Auto attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ═══════════════════════════════
// AUTH
// ═══════════════════════════════
export const register = async (userData) => {
  try {
    const res = await api.post('/auth/register', userData);
    await AsyncStorage.setItem('token', res.data.token);
    await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    console.log('API register error:', err.response?.data || err.message);
    throw err;
  }
};

export const login = async (email, password) => {
  const res = await api.post('/auth/login', { email, password });
  await AsyncStorage.setItem('token', res.data.token);
  await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};

// ═══════════════════════════════
// USER
// ═══════════════════════════════
export const updateProfile = async (profileData) => {
  const res = await api.put('/users/profile', profileData);
  return res.data;
};

export const updateLocation = async (latitude, longitude) => {
  const res = await api.put('/users/location', { latitude, longitude });
  return res.data;
};

export const blockUser = async (userId) => {
  const res = await api.post(`/users/block/${userId}`);
  return res.data;
};

// ═══════════════════════════════
// MATCHES
// ═══════════════════════════════
export const checkNearby = async () => {
  const res = await api.post('/matches/check-nearby');
  return res.data;
};

export const respondToMatch = async (matchId, accepted) => {
  const res = await api.put(`/matches/${matchId}/respond`, { accepted });
  return res.data;
};

export const giveTrustPoint = async (matchId) => {
  const res = await api.post(`/matches/${matchId}/trust`);
  return res.data;
};

export const getMyMatches = async () => {
  const res = await api.get('/matches/my-matches');
  return res.data;
};

// ═══════════════════════════════
// MESSAGES
// ═══════════════════════════════
export const getMessages = async (matchId) => {
  const res = await api.get(`/messages/${matchId}`);
  return res.data;
};

export const sendMessage = async (matchId, text) => {
  const res = await api.post(`/messages/${matchId}`, { text });
  return res.data;
};

export default api;