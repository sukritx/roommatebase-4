const mongoose = require('mongoose');
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