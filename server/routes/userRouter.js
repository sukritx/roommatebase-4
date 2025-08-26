const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { 
  updateProfile, 
  updatePreferences, 
  updateContact,
  deleteAccount,
  getDashboardStats // Example
} = require('../controllers/userController'); // Assuming these methods exist

// All routes here require authentication
router.use(auth.verifyToken);

router.put('/profile', updateProfile);
router.put('/preferences', updatePreferences);
router.put('/social-media', updateContact);
router.delete('/account', deleteAccount);
router.get('/dashboard-stats', getDashboardStats); // Example

module.exports = router;