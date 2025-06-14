const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createRoom, selectWinningParty } = require('../controllers/roomOwnerController');

router.post('/create', auth.landlordAuth, createRoom);
// Select winning party (room owner only)
router.post('/select-winner-party', auth.landlordAuth, selectWinningParty);

module.exports = router;
