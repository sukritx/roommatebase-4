const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  getRooms, 
  createRoom, 
  getRoomsFiltered, 
  suggestLocations, 
  getRoomById,
  favoriteRoom,
  unfavoriteRoom,
  getFavoriteRooms,
  checkFavoriteStatus,
  getRoomLink,
} = require('../controllers/roomController');

// Public routes
router.get('/suggest-locations', suggestLocations); // Get city/area suggestions
router.get('/:id', getRoomById);
router.get('/', getRooms); // Get rooms by location (city/area required)
router.get('/filtered', getRoomsFiltered); // Get filtered rooms for feed

// Protected routes (require authentication)
router.use(auth);
router.post('/:roomId/favorite', favoriteRoom);
router.delete('/:roomId/favorite', unfavoriteRoom);
router.get('/favorites/list', getFavoriteRooms);
router.get('/:roomId/status', checkFavoriteStatus);
router.get('/:id/share-link', getRoomLink);

module.exports = router;