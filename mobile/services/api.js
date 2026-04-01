import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_URL } from '../config';
const BASE_URL = API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
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
export const sendPreVerificationEmail = async (email, firstName) => {
  const res = await api.post('/auth/pre-verify', { email, firstName });
  return res.data;
};

export const checkPreVerificationCode = async (email, code) => {
  const res = await api.post('/auth/check-pre-verify', { email, code });
  return res.data;
};
export const sendPhoneOTP = async (phone) => {
  const res = await api.post('/auth/send-phone-otp', { phone });
  return res.data;
};

export const verifyPhoneOTP = async (phone, code) => {
  const res = await api.post('/auth/verify-phone-otp', { phone, code });
  return res.data;
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
export const verifyEmail = async (code) => {
  const res = await api.post('/auth/verify-email', { code });
  return res.data;
};

export const resendVerificationCode = async () => {
  const res = await api.post('/auth/resend-code');
  return res.data;
};
export const addToGallery = async (photoUrl) => {
  const res = await api.post('/users/gallery', { photoUrl });
  return res.data;
};

export const removeFromGallery = async (photoUrl) => {
  const res = await api.delete(`/users/gallery/${encodeURIComponent(photoUrl)}`);
  return res.data;
};

export const getUserGallery = async (userId) => {
  const res = await api.get(`/users/${userId}/gallery`);
  return res.data;
};
export default api;