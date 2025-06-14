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

    // Increment view count (using findOneAndUpdate for atomic increment)
    await Room.findOneAndUpdate(
      { _id: roomId },
      { $inc: { viewCount: 1 } },
      { new: false } // We don't need the updated document here
    );

    // Get room with populated data
    const room = await Room.findById(roomId)
      .populate({
        path: 'owner',
        select: 'firstName lastName profilePicture email updatedAt listedRooms',
        transform: (doc) => {
          if (!doc) return null;
          return {
            _id: doc._id,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || 'Anonymous',
            email: doc.email,
            profilePicture: doc.profilePicture || '',
            lastActive: doc.updatedAt,
            totalListings: doc.listedRooms?.length || 0
          };
        }
      })
      .populate({
        path: 'partyApplications',
        select: 'name members',
        populate: {
          path: 'members',
          select: 'firstName lastName profilePicture'
        }
      });
      
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Convert to plain object to modify the response
    const roomObj = room.toObject();
    
    // Get 3 other rooms from the same location for recommendations
    const relatedRooms = await Room.find({
      _id: { $ne: roomId },
      location: room.location,
      status: 'Available'
    })
    .limit(3)
    .select('title price images location size rooms')
    .lean();
    
    // Format the response
    const response = {
      ...roomObj,
      relatedRooms,
      isFavorite: req.user ? req.user.favoriteRooms?.includes(roomId) : false,
      metadata: {
        createdAt: room.createdAt,
        lastUpdated: room.lastUpdated,
        viewCount: (room.viewCount || 0) + 1 // Increment by 1 for the current view
      }
    };
    
    // If owner was populated, extract it for cleaner response
    if (response.owner) {
      response.owner = {
        _id: response.owner._id,
        name: response.owner.name,
        email: response.owner.email,
        profilePicture: response.owner.profilePicture,
        lastActive: response.owner.lastActive,
        totalListings: response.owner.totalListings
      };
    }
    
    // Clean up sensitive or unnecessary data
    delete response.__v;
    delete response.singleTenantApplications;
    delete response.partyApplications;
    
    res.json(response);
  } catch (err) {
    console.error('Error fetching room by ID:', err);
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid room ID format' });
    }
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
