const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { checkBrowsingLimit } = require('../middleware/paywall'); // Only applies to logged-in free users

const {
  getRooms,
  getRoomsFiltered,
  suggestLocations,
  getRoomById,
  favoriteRoom,
  unfavoriteRoom,
  getFavoriteRooms,
  checkFavoriteStatus,
  getRoomLink,
} = require('../controllers/roomController');

// Public routes (accessible by everyone, including anonymous users)
router.get('/suggest-locations', suggestLocations); // For search bar suggestions
router.get('/filtered', getRoomsFiltered);         // For general browsing feed
router.get('/', getRooms);                        // Get rooms by location

// Semi-public route: Get room details by ID
// Anyone can view the details, but logged-in free users consume quota.
// User object is attached if token is present, otherwise req.user is null.
router.get('/:id', (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      req.user = null;
      console.warn('Invalid token for room details, proceeding as anonymous.');
    }
  } else {
    req.user = null;
  }
  // Apply the browsing limit (only if req.user is present)
  // checkBrowsingLimit(req, res, next);
  next();
}, getRoomById);


// Protected routes (require a valid JWT token)
router.use(auth.verifyToken); // All routes below this will require auth.verifyToken

router.post('/:roomId/favorite', favoriteRoom);
router.delete('/:roomId/favorite', unfavoriteRoom);
router.get('/favorites/list', getFavoriteRooms);
router.get('/:roomId/status', checkFavoriteStatus);
router.get('/:id/share-link', getRoomLink);

module.exports = router;