const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  createParty,
  joinParty,
  getPartiesByRoom,
  handleApplication,
  selectWinningParty,
  getPartyById
} = require('../controllers/partyController');

// Apply auth middleware to all routes
router.use(auth);

// Create a new party for a room
router.post('/create', createParty);

// Join a party (submit application)
router.post('/join', joinParty);

// Get all parties for a specific room
router.get('/room/:roomId', getPartiesByRoom);

// Get party details by ID
router.get('/:partyId', getPartyById);

// Handle party member application (accept/reject)
router.post('/:partyId/application', handleApplication);

// Select winning party (room owner only)
router.post('/select-winner', selectWinningParty);

module.exports = router;