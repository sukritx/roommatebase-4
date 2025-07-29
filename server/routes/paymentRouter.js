const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  getPaymentHistory,
  subscribe,
  cancelSubscription,
  getSubscriptionStatus,
  handleStripeWebhook // Note: Webhook often has its own separate public route
} = require('../controllers/paymentController'); // Assuming these methods exist

router.use(auth.verifyToken);

router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);
router.post('/subscribe', subscribe);
router.put('/subscribe/cancel', cancelSubscription);
router.get('/subscribe/status', getSubscriptionStatus);

// Stripe webhook should be a public route, handled separately if possible
// router.post('/webhook', express.raw({type: 'application/json'}), handleStripeWebhook);

module.exports = router;