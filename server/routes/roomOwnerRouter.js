const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createRoom, 
  selectWinningParty, 
  addExistingRoommate 
} = require('../controllers/roomOwnerController');

// Room creation and management
router.post('/create', auth.landlordAuth, createRoom);

// Roommate management
router.post('/add-roommate', auth.landlordAuth, addExistingRoommate);

// Party management
router.post('/select-winner-party', auth.landlordAuth, selectWinningParty);

module.exports = router;
