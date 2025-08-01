const User = require('../models/User.model');
const { ErrorHandler } = require('./errorHandler'); // Ensure ErrorHandler is imported

// Check if user can browse more rooms (3 free views for logged-in users, unlimited for anonymous)
exports.checkBrowsingLimit = async (req, res, next) => {
  try {
    // If user is NOT authenticated (anonymous), allow them to view details without limit.
    // They won't be able to access features requiring login (parties, contact, favorites).
    if (!req.user) {
      return next();
    }

    // If authenticated, find the user to check their paid status and free quota.
    const user = await User.findById(req.user._id);

    // If user somehow doesn't exist after authentication, or is invalid.
    if (!user) {
        return next(new ErrorHandler(401, 'User not found for session. Please log in again.'));
    }
    
    // If user is paid and their subscription is active, allow unlimited browsing.
    if (user.isPaid && user.paidUntil && user.paidUntil > new Date()) {
      return next();
    }

    // If user is logged in, but not paid, check their free quota.
    if (user.freeQuotaUsed >= 3) { // Adjust this limit as needed (e.g., 3, 5, etc.)
      return res.status(402).json({
        success: false,
        message: 'You have reached your free browsing limit (3 room views). Please upgrade to continue viewing rooms.',
        requiresPayment: true,
        quotaUsed: user.freeQuotaUsed,
        quotaLimit: 3
      });
    }

    // If logged in, not paid, and within quota: increment quota and proceed.
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { freeQuotaUsed: 1 }
    });

    next(); // Allow access
  } catch (err) {
    // Ensure you pass errors to your central error handler
    next(err);
  }
};


// requireAuthForParties, requireAuthForContact, checkListingLimit remain unchanged:
exports.requireAuthForParties = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to view and join parties',
      requiresAuth: true,
      feature: 'parties'
    });
  }
  next();
};

exports.requireAuthForContact = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Please login to contact the landlord',
      requiresAuth: true,
      feature: 'contact'
    });
  }
  next();
};

exports.checkListingLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('listedRooms');
    
    if (!user) {
        return next(new ErrorHandler(401, 'User not found for session. Please log in again.'));
    }

    // Paid landlords have unlimited listings
    if (user.isPaid && user.paidUntil && user.paidUntil > new Date()) {
      return next();
    }

    // Check free listing limit
    const activeListings = user.listedRooms.filter(room => 
      room.status === 'Available' || room.status === 'Pending'
    ).length;

    if (activeListings >= 1) { // 1 free listing
      return res.status(402).json({
        success: false,
        message: 'You have reached your free listing limit (1 room). Please upgrade to list more properties.',
        requiresPayment: true,
        currentListings: activeListings,
        listingLimit: 1
      });
    }

    next();
  } catch (err) {
    next(err);
  }
};