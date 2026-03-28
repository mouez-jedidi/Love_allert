const express = require('express');
const router = express.Router();
const {
  updateProfile, updateLocation,
  getNearbyUsers, blockUser,
} = require('../controllers/userController');
const auth = require('../middleware/auth');

router.put('/profile', auth, updateProfile);
router.put('/location', auth, updateLocation);
router.get('/nearby', auth, getNearbyUsers);
router.post('/block/:id', auth, blockUser);

module.exports = router;