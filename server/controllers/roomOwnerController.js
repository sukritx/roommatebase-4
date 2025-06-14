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