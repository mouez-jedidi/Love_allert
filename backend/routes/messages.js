const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const auth = require('../middleware/auth');

router.get('/:matchId', auth, getMessages);
router.post('/:matchId', auth, sendMessage);

module.exports = router;