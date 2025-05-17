const Room = require('../models/Room.model');
const User = require('../models/User.model');

exports.createRoom = async (req, res, next) => {
  try {
    // You may get the user id from req.user (if using auth middleware) or req.body.owner
    const ownerId = req.user ? req.user._id : req.body.owner;
    if (!ownerId) {
      return res.status(400).json({ message: 'Owner (user) ID is required.' });
    }

    // Prepare room data, enforce owner
    const roomData = { ...req.body, owner: ownerId };
    const room = new Room(roomData);
    await room.save();

    // Add room to user's listedRooms
    await User.findByIdAndUpdate(ownerId, { $push: { listedRooms: room._id } });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

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
    if (!query) return res.json([]);
    const suggestions = await Room.aggregate([
      { $match: { location: { $regex: query, $options: "i" } } },
      { $group: { _id: "$location" } },
      { $limit: 10 }
    ]);
    res.json(suggestions.map(s => s._id));
  } catch (err) {
    next(err);
  }
};