const Payment = require('../models/Payment.model');
const User = require('../models/User.model');
const Room = require('../models/Room.model'); // If PaymentType "Advertisement" needs Room
const { ErrorHandler } = require('../middleware/errorHandler');

// You would typically initialize Stripe here with your secret key
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create a Payment Intent (for one-time payments or subscriptions initial payment)
exports.createPaymentIntent = async (req, res, next) => {
  try {
    const { amount, currency, paymentType, roomId } = req.body; // paymentType e.g., "User", "Advertisement"
    const userId = req.user._id;

    if (!amount || !currency || !paymentType) {
      return next(new ErrorHandler(400, 'Amount, currency, and payment type are required.'));
    }

    // --- Stripe Integration Placeholder ---
    // In a real app, you would create a Stripe PaymentIntent here
    // const paymentIntent = await stripe.paymentIntents.create({
    //   amount: amount * 100, // Stripe expects amount in cents
    //   currency: currency,
    //   metadata: { userId: userId.toString(), paymentType, ...(roomId && { roomId: roomId.toString() }) },
    // });
    // const clientSecret = paymentIntent.client_secret;

    // For now, mock a client secret
    const clientSecret = `mock_client_secret_${Date.now()}`;
    const stripePaymentId = `pi_mock_${Date.now()}`; // Mock Stripe Payment ID

    // Create a new Payment record in your DB as 'Pending'
    const newPayment = new Payment({
      user: userId,
      paymentType: paymentType,
      room: roomId || null, // Only if paymentType is 'Advertisement'
      amount: amount,
      currency: currency, // Add currency to the schema if not there
      status: 'Pending', // Will update to 'Completed' on webhook/confirmation
      stripePaymentId: stripePaymentId, // Store the Stripe ID
    });
    await newPayment.save();

    res.status(200).json({
      success: true,
      clientSecret: clientSecret, // Send this to frontend for client-side confirmation
      paymentId: newPayment._id, // Your DB's payment record ID
      message: 'Payment intent created successfully. Awaiting confirmation.',
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    next(new ErrorHandler(500, 'Failed to create payment intent.'));
  }
};

// Confirm a Payment (usually called by your backend after client-side confirmation)
exports.confirmPayment = async (req, res, next) => {
  try {
    const { paymentId, stripePaymentId } = req.body; // Your internal paymentId and Stripe's ID
    const userId = req.user._id;

    if (!paymentId || !stripePaymentId) {
      return next(new ErrorHandler(400, 'Payment ID and Stripe Payment ID are required.'));
    }

    const paymentRecord = await Payment.findById(paymentId);

    if (!paymentRecord || paymentRecord.user.toString() !== userId.toString()) {
      return next(new ErrorHandler(404, 'Payment record not found or unauthorized.'));
    }

    if (paymentRecord.status === 'Completed') {
      return next(new ErrorHandler(400, 'Payment already completed.'));
    }

    // --- Stripe Integration Placeholder ---
    // In a real app, you would retrieve the PaymentIntent from Stripe
    // const stripeIntent = await stripe.paymentIntents.retrieve(stripePaymentId);

    // // Check if the Stripe intent status is 'succeeded'
    // if (stripeIntent.status === 'succeeded') {
    //   paymentRecord.status = 'Completed';
    //   // Update user's paid status / paidUntil for "User" payments
    //   // For "Advertisement" payments, mark room as "paid" or provide quota
    // } else {
    //   paymentRecord.status = 'Failed';
    // }

    // Mock success for now
    paymentRecord.status = 'Completed';
    const user = await User.findById(userId);

    // Apply paid status based on paymentType
    if (paymentRecord.paymentType === 'User') {
      user.isPaid = true;
      // Example: Set paidUntil to one month from now
      user.paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      user.freeQuotaUsed = 0; // Reset free quota
      await user.save();
    } else if (paymentRecord.paymentType === 'Adverstisement' && paymentRecord.room) {
      // Logic for advertisement payment, e.g., activate premium listing
      await Room.findByIdAndUpdate(paymentRecord.room, { isPromoted: true }); // Example
    }


    await paymentRecord.save();

    res.status(200).json({
      success: true,
      message: `Payment ${paymentRecord.status.toLowerCase()} successfully.`,
      payment: paymentRecord,
    });
  } catch (err) {
    console.error('Error confirming payment:', err);
    next(new ErrorHandler(500, 'Failed to confirm payment.'));
  }
};

// Get payment history for the current user
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const payments = await Payment.find({ user: userId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, payments });
  } catch (err) {
    next(new ErrorHandler(500, 'Failed to fetch payment history.'));
  }
};

// Initiate a subscription
exports.subscribe = async (req, res, next) => {
  try {
    const { planId, paymentMethodId } = req.body; // Assume planId identifies your Stripe Product/Price
    const userId = req.user._id;

    // --- Stripe Integration Placeholder ---
    // 1. Create a Stripe Customer if one doesn't exist for the user
    // 2. Attach paymentMethodId to the customer
    // 3. Create a Stripe Subscription using the customer ID and planId (Price ID)

    // For now, mock success and update user's subscription status
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler(404, 'User not found.'));
    }

    user.isPaid = true;
    user.paidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 month from now
    user.freeQuotaUsed = 0; // Reset free quota upon subscription
    await user.save();

    // Create a payment record for the subscription
    const newPayment = new Payment({
      user: userId,
      paymentType: 'User', // This could be 'Subscription' as a specific type
      amount: 100, // Mock amount for subscription
      status: 'Completed',
      stripePaymentId: 'sub_mock_' + Date.now(), // Mock subscription ID
      // You might add a 'subscriptionId' field to your Payment model
    });
    await newPayment.save();

    res.status(200).json({
      success: true,
      message: 'Subscription successful!',
      userStatus: { isPaid: user.isPaid, paidUntil: user.paidUntil },
    });
  } catch (err) {
    console.error('Error subscribing:', err);
    next(new ErrorHandler(500, 'Failed to process subscription.'));
  }
};

// Cancel a subscription
exports.cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // --- Stripe Integration Placeholder ---
    // 1. Retrieve the user's active Stripe subscription ID
    // 2. Call Stripe API to cancel the subscription

    // For now, mock cancellation
    const user = await User.findById(userId);
    if (!user) {
      return next(new ErrorHandler(404, 'User not found.'));
    }

    user.isPaid = false;
    user.paidUntil = null; // Or set to end of current billing period
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully.',
      userStatus: { isPaid: user.isPaid, paidUntil: user.paidUntil },
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    next(new ErrorHandler(500, 'Failed to cancel subscription.'));
  }
};

// Get current user's subscription status
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select('isPaid paidUntil freeQuotaUsed');

    if (!user) {
      return next(new ErrorHandler(404, 'User not found.'));
    }

    res.status(200).json({
      success: true,
      status: {
        isPaid: user.isPaid,
        paidUntil: user.paidUntil,
        freeQuotaUsed: user.freeQuotaUsed,
      },
    });
  } catch (err) {
    next(new ErrorHandler(500, 'Failed to retrieve subscription status.'));
  }
};

// Stripe Webhook Handler (This often needs to be a separate, public route in index.js)
// Make sure this route is not protected by auth middleware.
exports.handleStripeWebhook = async (req, res) => {
  // This is a complex function and requires careful implementation
  // involving verifying the webhook signature, and handling different
  // Stripe event types (e.g., payment_intent.succeeded, customer.subscription.updated)
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // event = stripe.webhooks.constructEvent(req.rawBody, signature, endpointSecret);
    // For now, use req.body directly for mock events
    event = req.body;
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.sendStatus(400);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
      // Update your DB: Find payment record by paymentIntent.id and set status to 'Completed'
      // Also, apply user paid status based on metadata (userId, paymentType)
      break;
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      console.log(`Subscription ${subscription.id} updated!`);
      // Update your DB: Find user by customer ID, update isPaid, paidUntil based on subscription status
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.sendStatus(200);
};