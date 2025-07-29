const mongoose = require('mongoose');
const Room = require('../models/Room.model');
const User = require('../models/User.model');

// Get rooms by location (city/area required)
exports.getRooms = async (req, res, next) => {
  try {
    const { location } = req.query;
    if (!location) {
      return res.status(400).json({ message: 'Location (city/area) is required.' });
    }
    // Case-insensitive match for location
    const rooms = await Room.find({ location: { $regex: new RegExp(location, 'i') } }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Get filtered rooms for feed
exports.getRoomsFiltered = async (req, res, next) => {
  try {
    const {
      category,
      price,
      sizeMin,
      sizeMax,
      roomsMin,
      roomsMax,
      rentalPeriod,
      takeoverDate,
      petFriendly,
      seniorFriendly,
      studentsOnly,
      shareable,
      socialHousing,
      parking,
      elevator,
      balcony,
      electricChargingStation,
      furnished,
      dishwasher,
      washingMachine,
      dryer
    } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (price) filter.price = { $lte: Number(price) };
    if (sizeMin || sizeMax) {
      filter.size = {};
      if (sizeMin) filter.size.$gte = Number(sizeMin);
      if (sizeMax) filter.size.$lte = Number(sizeMax);
    }
    if (roomsMin || roomsMax) {
      filter.rooms = {};
      if (roomsMin) filter.rooms.$gte = Number(roomsMin);
      if (roomsMax) filter.rooms.$lte = Number(roomsMax);
    }
    if (rentalPeriod) filter.rentalPeriod = rentalPeriod;
    if (takeoverDate) filter.availableDate = { $lte: new Date(takeoverDate) };
    // Lifestyle
    if (petFriendly === 'true') filter.petsAllowed = true;
    if (seniorFriendly === 'true') filter.seniorFriendly = true;
    if (studentsOnly === 'true') filter.studentsOnly = true;
    if (shareable === 'true') filter.shareable = true;
    if (socialHousing === 'true') filter.category = 'Housing Cooperative'; // Example mapping
    // Facilities
    if (parking === 'true') filter.parking = true;
    if (elevator === 'true') filter.elevator = true;
    if (balcony === 'true') filter.balcony = true;
    if (electricChargingStation === 'true') filter.electricChargingStation = true;
    // Inventory
    if (furnished === 'true') filter.furnished = true;
    if (dishwasher === 'true') filter.dishwasher = true;
    if (washingMachine === 'true') filter.washingMachine = true;
    if (dryer === 'true') filter.dryer = true;

    // Add location filter if present
    if (req.query.location) {
      filter.location = { $regex: new RegExp(req.query.location, 'i') };
    }
    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Returns city/area suggestions based on a partial query
exports.suggestLocations = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Query parameter must be at least 2 characters long' 
      });
    }

    // Sanitize the query to prevent regex injection
    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const suggestions = await Room.aggregate([
      { 
        $match: { 
          location: { 
            $regex: `^${sanitizedQuery}`, // Starts with query (case-insensitive)
            $options: 'i' 
          } 
        } 
      },
      { 
        $group: { 
          _id: { $toLower: "$location" }, // Case-insensitive grouping
          location: { $first: "$location" } // Keep original case for display
        } 
      },
      { $sort: { _id: 1 } }, // Sort alphabetically
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: '$location',
          value: '$_id'
        }
      }
    ]);

    res.json({
      success: true,
      data: suggestions
    });
  } catch (err) {
    console.error('Error in suggestLocations:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch location suggestions'
    });
  }
};

// Get room by ID with detailed information
exports.getRoomById = async (req, res, next) => {
  try {
    const roomId = req.params.id;
    
    // Input validation
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }

    // Increment view count
    await Room.findOneAndUpdate(
      { _id: roomId },
      { $inc: { viewCount: 1 } },
      { new: false }
    );

    // Get room with populated data
    const room = await Room.findById(roomId)
      .populate({
        path: 'owner',
        select: 'firstName lastName profilePicture email updatedAt listedRooms userType',
        transform: (doc) => {
          if (!doc) return null;
          return {
            _id: doc._id,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Anonymous',
            email: doc.email,
            profilePicture: doc.profilePicture || '',
            lastActive: doc.updatedAt,
            totalListings: doc.listedRooms?.length || 0,
            userType: doc.userType
          };
        }
      });
      
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Convert to plain object to modify the response
    const roomObj = room.toObject();
    
    // Get related rooms
    const relatedRooms = await Room.find({
      _id: { $ne: roomId },
      city: room.city, // Use city instead of location
      status: 'Available'
    })
    .limit(3)
    .select('title price images city size rooms')
    .lean();
    
    // Determine what user can see based on auth status
    const isAuthenticated = !!req.user;
    const userId = req.user?._id;
    
    // Base response for all users (anonymous + authenticated)
    const response = {
      ...roomObj,
      relatedRooms,
      isAuthenticated,
      metadata: {
        createdAt: room.createdAt,
        lastUpdated: room.lastUpdated,
        viewCount: (room.viewCount || 0) + 1
      }
    };

    // Additional data for authenticated users only
    if (isAuthenticated) {
      response.isFavorite = req.user.favoriteRooms?.includes(roomId) || false;
      response.canContact = true;
      response.canJoinParty = room.shareable;
      
      // Show contact info for paid users or room owner
      const user = await User.findById(userId);
      if ((user.isPaid && user.paidUntil > new Date()) || room.owner._id.toString() === userId) {
        response.contactInfo = {
          phone: room.contactOptions?.phoneNumber || room.owner.socialMedia?.[0]?.phoneNumber,
          canCallDirectly: room.contactOptions?.byPhone || false
        };
      }
    } else {
      // Anonymous users see limited info
      response.isFavorite = false;
      response.canContact = false;
      response.canJoinParty = false;
      response.authRequired = {
        forContact: true,
        forParties: room.shareable,
        forFavorites: true
      };
    }
    
    // Clean up sensitive data
    delete response.__v;
    delete response.singleTenantApplications;
    delete response.partyApplications;
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching room by ID:', err);
    next(err);
  }
};

// Add room to user's favorites
exports.favoriteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Add to user's favorites if not already favorited
    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { favoriteRooms: roomId } },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Room added to favorites',
      favorites: user.favoriteRooms 
    });
  } catch (err) {
    next(err);
  }
};

// Remove room from user's favorites
exports.unfavoriteRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    // Remove from user's favorites
    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { favoriteRooms: roomId } },
      { new: true }
    );

    res.json({ 
      success: true, 
      message: 'Room removed from favorites',
      favorites: user.favoriteRooms 
    });
  } catch (err) {
    next(err);
  }
};

// Get user's favorite rooms
exports.getFavoriteRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    // Find user with populated favorite rooms
    const user = await User.findById(userId).populate({
      path: 'favoriteRooms',
      select: 'title price location images size rooms bathrooms category',
      options: { sort: { createdAt: -1 } }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user.favoriteRooms);
  } catch (err) {
    next(err);
  }
};

// Check if a room is favorited by user
exports.checkFavoriteStatus = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;
    
    const user = await User.findOne({
      _id: userId,
      favoriteRooms: roomId
    });
    
    res.json({ isFavorited: !!user });
  } catch (err) {
    next(err);
  }
};

// Generate a shareable link for a room
exports.getRoomLink = (req, res, next) => {
  try {
    const { id } = req.params;
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareableLink = `${baseUrl}/rooms/${id}`;
    
    res.json({ 
      success: true, 
      link: shareableLink,
      message: 'Shareable link generated successfully'
    });
  } catch (err) {
    next(err);
  }
};
