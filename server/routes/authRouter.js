const express = require('express');
const router = express.Router();
const passport = require('passport'); // For Google OAuth
const { registerUser, loginUser, getProfile, loginWithGoogleCallback } = require('../controllers/userController'); // Assuming you'll add loginWithGoogleCallback
const auth = require('../middleware/auth'); // Your JWT auth middleware

// Standard Authentication
router.post('/register', registerUser);
router.post('/login', loginUser);

// Google OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: process.env.FRONTEND_URL + '/login' }), // Redirect on failure
  loginWithGoogleCallback // Custom handler to generate JWT and redirect
);

// Get user profile (requires JWT)
router.get('/profile', auth.verifyToken, getProfile);

module.exports = router;