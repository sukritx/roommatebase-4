const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT auth middleware
const { checkListingLimit } = require('../middleware/paywall'); // For landlord listing paywall

const {
  createRoom,
  getAllRooms,
  addExistingRoommate,
  selectWinningParty,
  getAllSubmittedParties // Added for dashboard
} = require('../controllers/roomOwnerController'); // Assuming these methods exist

// All routes in this router require landlord authentication
router.use(auth.landlordAuth); // Ensures user is logged in AND is a landlord

// Room creation and management
router.post('/create', checkListingLimit, createRoom); // Apply listing limit here
router.get('/my-listings', getAllRooms); // Get all rooms owned by the landlord

// Roommate management
router.post('/add-roommate', addExistingRoommate);

// Party management
router.post('/select-winner-party', selectWinningParty);
router.get('/submitted-parties', getAllSubmittedParties); // Get all party applications related to landlord's rooms

module.exports = router;