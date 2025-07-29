const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Your JWT auth middleware
const { requireAuthForParties } = require('../middleware/paywall'); // New middleware for party access

const {
  createParty,
  joinParty,
  getPartiesByRoom,
  handleApplication,
  getPartyById,
  // ... other party related functions e.g., select winner party
} = require('../controllers/partyController'); // Assuming these methods exist

// All party routes require authentication
router.use(auth.verifyToken);
router.use(requireAuthForParties); // Ensures user is logged in to interact with parties

// Create a new party for a room
router.post('/create', createParty);

// Join a party (submit application)
router.post('/join', joinParty);

// Get all parties for a specific room (requires auth)
router.get('/room/:roomId', getPartiesByRoom);

// Get party details by ID (requires auth)
router.get('/:partyId', getPartyById);

// Handle party member application (accept/reject)
router.post('/:partyId/application', handleApplication);

module.exports = router;