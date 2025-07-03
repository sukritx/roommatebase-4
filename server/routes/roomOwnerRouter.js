const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createRoom, 
  getAllRooms,
  getAllSubmittedParties,
  selectWinningParty, 
  addExistingRoommate 
} = require('../controllers/roomOwnerController');

// Room creation and management
router.post('/create', auth.landlordAuth, createRoom);

// get all rooms of that landlord
router.get('/all-rooms', auth.landlordAuth, getAllRooms);

// Roommate management
router.post('/add-roommate', auth.landlordAuth, addExistingRoommate);

// Party management
router.post('/select-winner-party', auth.landlordAuth, selectWinningParty);

module.exports = router;
