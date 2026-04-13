const express = require('express');
const router = express.Router();
const {
  updateProfile, updateLocation, getNearbyUsers, blockUser,
  deleteAccount, reportUser, addToGallery, removeFromGallery,
  getUserGallery, getBlockedUsers, unblockUser, getUserById, updateFcmToken,
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// --- ROUTES ---
router.put('/profile', auth, updateProfile);
router.put('/location', auth, updateLocation);
router.get('/nearby', auth, getNearbyUsers);
router.post('/block/:id', auth, blockUser);
router.delete('/account', auth, deleteAccount);
router.post('/report', auth, reportUser);
router.post('/gallery', auth, addToGallery);
router.delete('/gallery/:photoUrl', auth, removeFromGallery);
router.get('/:id/gallery', auth, getUserGallery);
router.get('/blocked', auth, getBlockedUsers);
router.post('/unblock/:id', auth, unblockUser);
router.get('/:id', auth, getUserById);

// UNE SEULE FOIS ICI :
router.put('/update-fcm-token', auth, updateFcmToken); 

module.exports = router;