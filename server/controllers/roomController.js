const mongoose = require('mongoose');
const Room = require('../models/Room.model');
const User = require('../models/User.model');
const Party = require('../models/Party.model');
const { ErrorHandler } = require('../middleware/errorHandler');

// Get rooms by location (city/area required)
exports.getRooms = async (req, res, next) => {
  try {
    const { city, state, zipCode, country } = req.query; // Destructure new fields
    const filter = {};

    if (!city && !state && !zipCode && !country) {
        return res.status(400).json({ message: 'At least one location parameter (city, state, zipCode, or country) is required.' });
    }

    // Build the filter object based on provided location parameters
    if (city) filter.city = { $regex: new RegExp(city, 'i') };
    if (state) filter.state = { $regex: new RegExp(state, 'i') };
    if (zipCode) filter.zipCode = { $regex: new RegExp(zipCode, 'i') };
    if (country) filter.country = { $regex: new RegExp(country, 'i') };

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Get filtered rooms for feed
// Get filtered rooms for feed
exports.getRoomsFiltered = async (req, res, next) => {
  try {
    const {
      city, // New filter field
      state, // New filter field
      zipCode, // New filter field
      country, // New filter field
      category,
      priceMax, // Renamed from 'price' to 'priceMax' to be consistent with frontend
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
      socialHousing, // This maps to 'Housing Cooperative' in schema
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

    // Apply location filters
    if (city) filter.city = { $regex: new RegExp(city, 'i') };
    if (state) filter.state = { $regex: new RegExp(state, 'i') };
    if (zipCode) filter.zipCode = { $regex: new RegExp(zipCode, 'i') };
    if (country) filter.country = { $regex: new RegExp(country, 'i') };

    if (category) filter.category = category;
    if (priceMax) filter.price = { $lte: Number(priceMax) }; // Use priceMax
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

    const rooms = await Room.find(filter).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Returns city/area suggestions based on a partial query
exports.suggestLocations = async (req, res, next) => {
  try {
    const { query, type } = req.query; // Added 'type' to specify which field to query

    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter must be at least 2 characters long'
      });
    }

    const sanitizedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let fieldToSearch = 'city'; // Default to city
    if (type === 'state') fieldToSearch = 'state';
    if (type === 'zipCode') fieldToSearch = 'zipCode';
    if (type === 'country') fieldToSearch = 'country';


    const suggestions = await Room.aggregate([
      {
        $match: {
          [fieldToSearch]: {
            $regex: `^${sanitizedQuery}`, // Starts with query (case-insensitive)
            $options: 'i'
          }
        }
      },
      {
        $group: {
          _id: { $toLower: `$${fieldToSearch}` }, // Case-insensitive grouping by the selected field
          location: { $first: `$${fieldToSearch}` } // Keep original case for display
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

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return next(new ErrorHandler(400, 'Invalid room ID format')); // Use ErrorHandler
    }

    // Increment view count (using findOneAndUpdate for atomic increment)
    // This will happen regardless of auth status or payment, which is fine for view tracking.
    await Room.findOneAndUpdate(
      { _id: roomId },
      { $inc: { viewCount: 1 } },
      { new: false } // We don't need the updated document here
    );

    // Get room with populated data. We populate partyApplications here
    // because the backend might use it for internal logic/landlord views.
    // We will strip it out for anonymous users later.
    const room = await Room.findById(roomId)
      .populate({
        path: 'owner',
        select: 'firstName lastName profilePicture email updatedAt listedRooms userType isPaid paidUntil socialMedia', // Added socialMedia to owner for phone number
        transform: (doc) => {
          if (!doc) return null;
          return {
            _id: doc._id,
            name: `${doc.firstName || ''} ${doc.lastName || ''}`.trim() || doc.username || 'Anonymous', // Use username as fallback
            email: doc.email,
            profilePicture: doc.profilePicture || '',
            lastActive: doc.updatedAt,
            totalListings: doc.listedRooms?.length || 0,
            userType: doc.userType,
            // Include landlord contact options here for use below IF OWNER IS PAID
            socialMedia: doc.socialMedia,
            isPaid: doc.isPaid,
            paidUntil: doc.paidUntil
          };
        }
      })
      .populate('partyApplications'); // Populate this to count parties for authenticated users.

    if (!room) {
      return next(new ErrorHandler(404, 'Room not found'));
    }

    // Convert to plain object to modify the response
    const roomObj = room.toObject();

    // Get 3 other rooms from the same city for recommendations
    const relatedRooms = await Room.find({
      _id: { $ne: roomId },
      city: room.city, // Use city for related rooms
      status: 'Available'
    })
    .limit(3)
    .select('title price images city size rooms category currency') // Add currency
    .lean();


    // --- Core Logic for Anonymous vs. Authenticated/Paid Access ---
    const isAuthenticated = !!req.user;
    const userId = req.user?._id;
    let currentUser = null; // To fetch user details for paywall check

    if (isAuthenticated) {
      currentUser = await User.findById(userId).select('isPaid paidUntil freeQuotaUsed');
    }

    const isPaidUser = currentUser && currentUser.isPaid && currentUser.paidUntil && currentUser.paidUntil > new Date();
    const isRoomOwner = isAuthenticated && room.owner._id.toString() === userId.toString();

    // Sanitize partyApplications based on user status
    if (!isAuthenticated) {
        // For ANONYMOUS users, do NOT send party applications data
        roomObj.partyApplications = []; // Send empty array
        roomObj.shareable = false; // Disable shareable for anonymous to hide "join party" button
    }
    // For authenticated but unpaid users, you might still want to show party count
    // but not full party details or "join" button unless they pay for that feature.
    // The frontend handleJoinPartyClick already checks for isAuthenticated and user.isPaid for join.


    // Build the response object dynamically
    const response = {
      ...roomObj,
      relatedRooms,
      isFavorite: isAuthenticated && (await User.findById(userId).select('favoriteRooms'))?.favoriteRooms?.includes(roomId) || false, // Check favorite status
      canContact: isAuthenticated, // Assume any logged-in user can initiate contact
      canJoinParty: isAuthenticated && room.shareable, // Can join party if logged in and room is shareable

      // Determine contact info visibility
      contactInfo: {
        phone: null,
        canCallDirectly: false,
      },
      // If user is paid, or is the room owner, display the phone number
      // Assuming landlord's phone number is on the owner's socialMedia array
      // or directly on room.contactOptions.phoneNumber
      contactOptionDisplayed: false, // Flag to tell frontend if contact info is shown
    };

    if (isAuthenticated) {
        // For authenticated users:
        response.canContact = true;
        response.canJoinParty = room.shareable;

        // Paid users or room owners can see phone number
        if (isPaidUser || isRoomOwner) {
            response.contactInfo.phone = room.contactOptions?.phoneNumber || room.owner?.socialMedia?.[0]?.phoneNumber || null;
            response.contactInfo.canCallDirectly = room.contactOptions?.byPhone || false;
            if (response.contactInfo.phone) {
                response.contactOptionDisplayed = true;
            }
        }
    } else {
        // For ANONYMOUS users
        response.isFavorite = false;
        response.canContact = false;
        response.canJoinParty = false;
        // Explicitly remove party data from response for anonymous
        response.partyApplications = [];
        response.shareable = false; // Frontend should read this flag

        response.authRequired = { // Frontend can use this to show "Login to X" messages
            forContact: true,
            forParties: true,
            forFavorites: true,
            forDetailedParties: true // For full party details beyond count
        };
    }


    // Frontend metadata for display (e.g., how many views)
    response.metadata = {
      createdAt: room.createdAt,
      lastUpdated: room.lastUpdated,
      viewCount: (room.viewCount || 0) // Already incremented above, no +1 needed here
    };

    // Clean up sensitive or unnecessary data before sending
    delete response.__v;
    delete response.singleTenantApplications; // Usually not sent to frontend

    // IMPORTANT: If `partyApplications` contains full Party objects from `.populate`,
    // you might want to simplify it to just `partyApplicationsCount` for authenticated non-paid users.
    // For now, if populated, it will send full objects, which might be okay for party page,
    // but on room detail, only count should be displayed to control access.
    // If room.partyApplications are indeed populated Party documents, then for authenticated, non-paid:
    if (response.partyApplications && Array.isArray(response.partyApplications) && !isPaidUser && !isRoomOwner) {
        // Remove ': any' from the parameter type annotation
        response.partyApplications = response.partyApplications.map((party) => ({
            _id: party._id,
            title: party.title,
            maxMembers: party.maxMembers,
            membersCount: party.members ? party.members.length : 0,
            status: party.status
        }));
    }


    res.json(response);
  } catch (err) {
    console.error('Error fetching room by ID:', err);
    if (err.name === 'CastError') {
      return next(new ErrorHandler(400, 'Invalid room ID format'));
    }
    next(err); // Pass any other errors to central error handler
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
