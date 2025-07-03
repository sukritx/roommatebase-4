const mongoose = require('mongoose');
const Room = require('../models/Room.model');
const User = require('../models/User.model');
const Party = require('../models/Party.model');

exports.createRoom = async (req, res, next) => {
  try {
    // You may get the user id from req.user (if using auth middleware) or req.body.owner
    const ownerId = req.user ? req.user._id : req.body.owner;
    if (!ownerId) {
      return res.status(400).json({ message: 'Owner (user) ID is required.' });
    }

    // Prepare room data, enforce owner
    if (!req.body.currency) {
      return res.status(400).json({ error: "Currency is required." });
    }
    const roomData = { ...req.body, owner: ownerId, currency: req.body.currency };
    const room = new Room(roomData);
    await room.save();

    // Add room to user's listedRooms
    await User.findByIdAndUpdate(ownerId, { $push: { listedRooms: room._id } });

    res.status(201).json(room);
  } catch (err) {
    next(err);
  }
};

// Select winning party (for room owner)
exports.selectWinningParty = async (req, res, next) => {
  try {
    const { partyId } = req.body;
    const userId = req.user._id;
    
    const party = await Party.findById(partyId)
      .populate('room', 'owner')
      .populate('members', 'email');
    
    if (!party) {
      throw new ErrorHandler(404, 'Party not found');
    }
    
    // Check if user is the room owner
    if (party.room.owner.toString() !== userId) {
      throw new ErrorHandler(403, 'Only the room owner can select the winning party');
    }
    
    // Close all other parties for this room
    await Party.updateMany(
      { 
        room: party.room._id, 
        _id: { $ne: party._id },
        status: { $in: ['Open', 'Full'] } 
      },
      { $set: { status: 'Closed' } }
    );
    
    // Mark this party as the winner
    party.status = 'Winner';
    await party.save();
    
    // Update room status to indicate it's taken
    await Room.findByIdAndUpdate(party.room._id, { 
      status: 'Taken',
      $push: { selectedParty: party._id }
    });
    
    // Notify all party members
    // (Implement notification system here)
    
    res.json({
      success: true,
      message: 'Party selected successfully',
      party: await party.populate('members', 'firstName lastName email profilePicture')
    });
    
  } catch (err) {
    next(err);
  }
};

// get all rooms of that landlord
exports.getAllRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const rooms = await Room.find({ owner: userId });
    res.json(rooms);
  } catch (err) {
    next(err);
  }
};

// Room owner can add user as an existing roommate by username
// POST /api/landlord/add-roommate
exports.addExistingRoommate = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { roomId, username } = req.body;
    const ownerId = req.user._id;

    if (!roomId || !username) {
      return res.status(400).json({ message: 'Room ID and username are required' });
    }

    // 1. Find the room and verify ownership
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Room not found' });
    }

    if (room.owner.toString() !== ownerId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Only the room owner can add roommates' });
    }

    // 2. Find the user by username
    const userToAdd = await User.findOne({ username }).session(session);
    if (!userToAdd) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'User not found' });
    }

    // 3. Check if user is already a roommate
    if (room.existingRoommate.includes(userToAdd._id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'User is already a roommate in this room' });
    }

    // 4. Add user to room's existingRoommate array
    room.existingRoommate.push(userToAdd._id);
    
    // 5. Update room status to taken if this is the first roommate
    if (room.status === 'Available') {
      room.status = 'Taken';
    }
    
    await room.save({ session });
    
    // 6. Add room to user's rooms array
    userToAdd.rooms.push(room._id);
    await userToAdd.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    // Populate the user details for the response
    await room.populate('existingRoommate', 'username email profilePicture');
    
    res.status(200).json({
      success: true,
      message: 'Roommate added successfully',
      room
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
}

/*
DASHBOARD
*/
// get all submitted parties  
exports.getAllSubmittedParties = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const parties = await Party.find({ owner: userId });
    res.json(parties);
  } catch (err) {
    next(err);
  }
};