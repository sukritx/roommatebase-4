// middleware/paywall.js
const User = require('../models/User.model');

// Check if user can browse more rooms (3 free views for logged-in users)
exports.checkBrowsingLimit = async (req, res, next) => {
  try {
    // Anonymous users can browse freely (no limit)
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user._id);
    
    // Paid users have unlimited access
    if (user.isPaid && user.paidUntil > new Date()) {
      return next();
    }

    // Check free quota for logged-in free users
    if (user.freeQuotaUsed >= 3) {
      return res.status(402).json({
        success: false,
        message: 'You have reached your free browsing limit (3 rooms). Please upgrade to continue.',
        requiresPayment: true,
        quotaUsed: user.freeQuotaUsed,
        quotaLimit: 3
      });
    }

    // Increment quota for logged-in users
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { freeQuotaUsed: 1 }
    });

    next();
  } catch (err) {
    next(err);
  }
};

// Check if user can access party features (requires login)
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

// Check if user can contact landlord (requires login)
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

// Check if landlord can create more rooms (1 free listing)
exports.checkListingLimit = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('listedRooms');
    
    // Paid landlords have unlimited listings
    if (user.isPaid && user.paidUntil > new Date()) {
      return next();
    }

    // Check free listing limit
    const activeListings = user.listedRooms.filter(room => 
      room.status === 'Available' || room.status === 'Pending'
    ).length;

    if (activeListings >= 1) {
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