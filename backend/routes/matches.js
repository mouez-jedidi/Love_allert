const express = require('express');
const router = express.Router();
const {
  checkNearby, respondToMatch,
  giveTrustPoint, getMyMatches,
} = require('../controllers/matchController');
const auth = require('../middleware/auth');

router.get('/my-matches', auth, getMyMatches);
router.post('/check-nearby', auth, checkNearby);
router.put('/:id/respond', auth, respondToMatch);
router.post('/:id/trust', auth, giveTrustPoint);

module.exports = router;