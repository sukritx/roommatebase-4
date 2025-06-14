const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createRoom } = require('../controllers/roomOwnerController');

router.post('/create', auth, createRoom);

module.exports = router;
