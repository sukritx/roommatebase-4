const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getRooms, createRoom, getRoomsFiltered } = require('../controllers/roomController');

router.get('/', getRooms); // Get rooms by location (city/area required)
router.get('/filtered', getRoomsFiltered); // Get filtered rooms for feed
router.post('/create', auth, createRoom);

module.exports = router;