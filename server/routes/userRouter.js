const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  updateProfile, 
  updatePreferences, 
  updateSocialMedia,
  deleteAccount,
  getDashboardStats // Example
} = require('../controllers/userController'); // Assuming these methods exist

// All routes here require authentication
router.use(auth.verifyToken);

router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.put('/social-media', updateSocialMedia);
router.delete('/account', deleteAccount);
router.get('/dashboard-stats', getDashboardStats); // Example

module.exports = router;