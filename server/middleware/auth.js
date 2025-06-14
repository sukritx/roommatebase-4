const jwt = require('jsonwebtoken');

const auth = {};

// Regular auth middleware
auth.verifyToken = function (req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No authentication token, access denied' 
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

/**
 * Middleware to verify if user is a landlord
 * Must be used after the regular auth middleware
 */
auth.landlordAuth = async function (req, res, next) {
  try {
    // First verify the token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No authentication token, access denied' 
      });
    }

    // Verify token and get user
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data from database
    const User = require('../models/User.model');
    const user = await User.findById(decoded.id).select('isRoomOwner');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Check if user is a landlord
    if (!user.isRoomOwner) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Landlord privileges required' 
      });
    }

    // Attach user to request object
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Landlord auth error:', err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// For backward compatibility
const authMiddleware = function(req, res, next) {
  return auth.verifyToken(req, res, next);
};

// Export all middleware functions
module.exports = {
  // Default export (for backward compatibility)
  ...auth,
  // Named exports
  verifyToken: auth.verifyToken,
  landlordAuth: auth.landlordAuth
};
