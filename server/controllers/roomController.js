const mongoose = require('mongoose');
const Room = require('../models/Room.model');
const User = require('../models/User.model');
const Party = require('../models/Party.model');
const { ErrorHandler } = require('../middleware/errorHandler');

// Get rooms by location (city/area required)
exports.getRooms = async (req, res, next) => {
  try {
    const { locationSearch, zipCode, country } = req.query; // Updated to locationSearch

    const filter = {};

    // For locationSearch, use an $or query to check both city and state
    if (locationSearch) {
        const regex = new RegExp(locationSearch, 'i');
        filter.$or = [{ city: regex }, { state: regex }];
    }
    // Zip Code and Country remain specific
    if (zipCode) filter.zipCode = { $regex: new RegExp(zipCode, 'i') };
    if (country) filter.country = { $regex: new RegExp(country, 'i') };

    // If no location parameters are provided at all, maybe return an error or all rooms
    // For now, let's assume if no locationSearch/zipCode/country, it implies a broader search
    // If you always require *some* location info, add:
    // if (!locationSearch && !zipCode && !country) {
    //   return res.status(400).json({ message: 'At least one location parameter (city/region, zipCode, or country) is required.' });
    // }

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Get filtered rooms for feed
exports.getRoomsFiltered = async (req, res, next) => {
  try {
    const {
      locationSearch, // New combined field
      zipCode,
      country,
      category,
      priceMax,
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

    // Apply combined location search (city OR state)
    if (locationSearch) {
      const regex = new RegExp(locationSearch, 'i');
      filter.$or = [
          { city: regex },
          { state: regex }
      ];
    }
    // Apply specific location filters if present
    if (zipCode) filter.zipCode = { $regex: new RegExp(zipCode, 'i') };
    if (country) filter.country = { $regex: new RegExp(country, 'i') };


    if (category) filter.category = category;
    if (priceMax) filter.price = { $lte: Number(priceMax) };
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
    if (socialHousing === 'true') filter.category = 'Housing Cooperative';
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

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Returns city/area suggestions based on a partial query
exports.suggestLocations = async (req, res, next) => {
  try {
    const { query } = req.query; // Only query is needed now

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter must be at least 2 characters long'
      });
    }

    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${sanitizedQuery}`, 'i');

    const suggestions = await Room.aggregate([
      {
        $match: {
          $or: [
            { city: regex },
            { state: regex }
            // Add zipCode if you want it included in the 'general' suggestion box
            // { zipCode: regex }
          ]
        }
      },
      {
        $group: {
          _id: { $toLower: { $concat: ["$city", ", ", "$state"] } }, // Group by city, state combination
          city: { $first: "$city" },
          state: { $first: "$state" }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          name: {
            $cond: {
              if: "$state", // If state exists, show City, State
              then: { $concat: ["$city", ", ", "$state"] },
              else: "$city" // Otherwise, just show City
            }
          },
          value: "$_id" // Use the grouped _id as value
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

    // 1. Validate Room ID format
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return next(new ErrorHandler(400, 'Invalid room ID format'));
    }

    // 2. Increment View Count (for tracking, not for paywall)
    await Room.findOneAndUpdate(
      { _id: roomId },
      { $inc: { viewCount: 1 } },
      { new: false }
    );

    // 3. Fetch Room Details with Populated Data
    const room = await Room.findById(roomId)
      .populate({
        path: 'owner',
        // ADD isVerifyLandlord, createdAt, and ensure listedRooms is available for length
        select: 'firstName lastName profilePicture email updatedAt listedRooms userType isPaid paidUntil contact isVerifyLandlord createdAt', // MODIFIED SELECT
        transform: (doc) => {
          if (!doc) return null;
          return {
            _id: doc._id,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.username || 'Anonymous',
            email: doc.email,
            profilePicture: doc.profilePicture || '',
            lastActive: doc.updatedAt,
            totalListings: doc.listedRooms?.length || 0, // This is good, uses the populated array's length
            userType: doc.userType,
            contact: doc.contact,
            isPaid: doc.isPaid,
            paidUntil: doc.paidUntil,
            isVerifyLandlord: doc.isVerifyLandlord, // ADDED
            createdAt: doc.createdAt, // ADDED (from timestamps)
          };
        }
      })
      .populate('partyApplications');

    // 4. Handle Room Not Found
    if (!room) {
      return next(new ErrorHandler(404, 'Room not found'));
    }

    const roomObj = room.toObject();

    // 5. Fetch Related Rooms
    const relatedRooms = await Room.find({
      _id: { $ne: roomId },
      city: room.city,
      status: 'Available'
    })
    .limit(3)
    .select('title price images city size rooms category currency')
    .lean();

    // 6. Determine User's Authentication and Payment Status
    const isAuthenticated = !!req.user;
    const userId = req.user?._id;
    let currentUser = null;

    if (isAuthenticated) {
      currentUser = await User.findById(userId).select('isPaid paidUntil');
    }

    const isPaidUser = currentUser && currentUser.isPaid && currentUser.paidUntil && currentUser.paidUntil > new Date();
    const isRoomOwner = isAuthenticated && room.owner?._id?.toString() === userId?.toString();


    // 7. Sanitize Party Application Data for Anonymous Users
    if (!isAuthenticated) {
        roomObj.partyApplications = [];
        roomObj.shareable = false;
    }

    // 8. Construct the Response Object
    const response = {
      ...roomObj,
      relatedRooms,
      isFavorite: isAuthenticated && (await User.findById(userId).select('favoriteRooms'))?.favoriteRooms?.includes(roomId) || false,
      canContact: isAuthenticated,
      canJoinParty: isAuthenticated && room.shareable,
      contactInfo: {
        phone: null,
        canCallDirectly: false,
      },
      contactOptionDisplayed: false,
    };

    // 9. Logic for Displaying Landlord Contact Information
    if (isAuthenticated) {
        response.canContact = true;
        response.canJoinParty = room.shareable;

        if (isPaidUser || isRoomOwner) {
            // Robustly find the phone number from the owner's `contact` array or room's `contactOptions`
            // CHANGED: from room.owner?.socialMedia to room.owner?.contact
            const ownerPhoneNumberFromContact = room.owner?.contact?.find(
                (item) => item.phoneNumber && item.phoneNumber !== ""
            )?.phoneNumber;

            response.contactInfo.phone = room.contactOptions?.phoneNumber || ownerPhoneNumberFromContact || null;
            response.contactInfo.canCallDirectly = room.contactOptions?.byPhone || false;

            if (response.contactInfo.phone) {
                response.contactOptionDisplayed = true;
            }
        }
    } else {
        response.isFavorite = false;
        response.canContact = false;
        response.canJoinParty = false;
        response.partyApplications = [];
        response.shareable = false;

        response.authRequired = {
            forContact: true,
            forParties: true,
            forFavorites: true,
            forDetailedParties: true
        };
    }

    // 10. Add Frontend Metadata
    response.metadata = {
      createdAt: room.createdAt,
      lastUpdated: room.lastUpdated,
      viewCount: (room.viewCount || 0)
    };

    // 11. Clean Up Sensitive or Unnecessary Data
    delete response.__v;
    delete response.singleTenantApplications;

    // 12. Simplify Party Applications
    if (response.partyApplications && Array.isArray(response.partyApplications) && !isPaidUser && !isRoomOwner) {
        response.partyApplications = response.partyApplications.map((party) => ({
            _id: party._id,
            title: party.title,
            maxMembers: party.maxMembers,
            membersCount: party.members ? party.members.length : 0,
            status: party.status
        }));
    }

    // 13. Send the Final Response
    res.json(response);

  } catch (err) {
    console.error('Error fetching room by ID:', err);
    if (err.name === 'CastError') {
      return next(new ErrorHandler(400, 'Invalid room ID format'));
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
