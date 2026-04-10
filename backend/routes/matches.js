const express = require('express');
const router = express.Router();
const {
  checkNearby,
  respondToMatch,
  giveTrustPoint,
  getMyMatches,
  getUnlockedInfo,  // This is the correct function name
} = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/my-matches', auth, getMyMatches);
router.post('/check-nearby', auth, checkNearby);
router.put('/:id/respond', auth, respondToMatch);
router.post('/:id/trust', auth, giveTrustPoint);
router.get('/:id/unlocked-info', auth, getUnlockedInfo);  // Use correct route name

module.exports = router;