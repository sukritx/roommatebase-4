const Room = require('../models/Room.model');
const User = require('../models/User.model');
const Party = require('../models/Party.model');
const { ErrorHandler } = require('../middleware/errorHandler');

// Helper function to check if user is room owner
const isRoomOwner = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  return room && room.owner.toString() === userId;
};

// Join a party for a room
exports.joinParty = async (req, res, next) => {
  try {
    const { roomId, partyId } = req.body;
    const userId = req.user._id;
    
    // Check if room exists and is shareable
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ErrorHandler(404, 'Room not found');
    }
    
    if (!room.shareable) {
      throw new ErrorHandler(400, 'This room is not available for sharing');
    }
    
    // Find the party
    const party = await Party.findOne({
      _id: partyId,
      room: roomId,
      status: 'Open'
    });
    
    if (!party) {
      throw new ErrorHandler(404, 'Party not found or not accepting new members');
    }
    
    // Check if party is full
    if (party.members.length >= party.maxMembers) {
      throw new ErrorHandler(400, 'This party is already full');
    }
    
    // Check if user is already in this party
    if (party.members.some(member => member.toString() === userId)) {
      throw new ErrorHandler(400, 'You are already a member of this party');
    }
    
    // Check if user is already in another party for this room
    const existingParty = await Party.findOne({
      room: roomId,
      members: userId,
      status: 'Open'
    });
    
    if (existingParty) {
      throw new ErrorHandler(400, 'You are already in another party for this room');
    }
    
    // Add user to party's member applications
    party.memberApplication.push(userId);
    await party.save();
    
    // Notify party leader about the new application
    // (You can implement a notification system here)
    
    res.status(200).json({
      success: true,
      message: 'Application submitted to join the party',
      party: await party.populate(['members', 'memberApplication'], 'firstName lastName email profilePicture')
    });
    
  } catch (err) {
    next(err);
  }
};

// Get all parties for a specific room
exports.getPartiesByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?._id;
    
    // Get room details
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ErrorHandler(404, 'Room not found');
    }
    
    const isOwner = userId && room.owner.toString() === userId;
    
    // Get all active parties for this room
    const parties = await Party.find({ 
      room: roomId,
      status: { $in: ['Open', 'Full'] }
    })
    .populate('leader', 'firstName lastName email profilePicture')
    .populate('members', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });
    
    // For room owner, include all parties
    // For others, only show parties with available slots
    const filteredParties = isOwner 
      ? parties 
      : parties.filter(party => party.status === 'Open');
    
    res.json({
      success: true,
      isRoomOwner: isOwner,
      room: {
        _id: room._id,
        title: room.title,
        maxPartyMembers: room.maxPartyMembers || 4 // Default to 4 if not set
      },
      parties: filteredParties.map(party => ({
        ...party.toObject(),
        availableSlots: party.maxMembers - party.members.length
      }))
    });
    
  } catch (err) {
    next(err);
  }
};

// Create a new party for a room
exports.createParty = async (req, res, next) => {
  try {
    const { roomId, title, description, maxMembers } = req.body;
    const userId = req.user._id;
    
    // Validate input
    if (!title || !description) {
      throw new ErrorHandler(400, 'Title and description are required');
    }
    
    // Check if room exists and is shareable
    const room = await Room.findById(roomId);
    if (!room) {
      throw new ErrorHandler(404, 'Room not found');
    }
    
    if (!room.shareable) {
      throw new ErrorHandler(400, 'This room is not available for sharing');
    }
    
    // Set default max members if not provided
    const maxPartyMembers = maxMembers || (room.maxPartyMembers || 4);
    
    // Create new party
    const party = new Party({
      room: roomId,
      leader: userId,
      title,
      description,
      maxMembers: maxPartyMembers,
      members: [userId],
      status: 'Open',
      memberApplication: []
    });
    
    await party.save();
    
    // Add party to user's createdParties
    await User.findByIdAndUpdate(userId, {
      $addToSet: { createdParties: party._id }
    });
    
    res.status(201).json({
      success: true,
      message: 'Party created successfully',
      party: await party.populate('members', 'firstName lastName email profilePicture')
    });
    
  } catch (err) {
    next(err);
  }
};

// Accept or reject party member application
exports.handleApplication = async (req, res, next) => {
  try {
    const { partyId, userId, action } = req.body; // action: 'accept' or 'reject'
    const leaderId = req.user._id;
    
    const party = await Party.findById(partyId)
      .populate('room', 'owner maxPartyMembers');
    
    if (!party) {
      throw new ErrorHandler(404, 'Party not found');
    }
    
    // Check if the requester is the party leader
    if (party.leader.toString() !== leaderId) {
      throw new ErrorHandler(403, 'Only the party leader can manage applications');
    }
    
    // Check if user has applied to join
    const applicationIndex = party.memberApplication.indexOf(userId);
    if (applicationIndex === -1) {
      throw new ErrorHandler(400, 'User has not applied to join this party');
    }
    
    // Remove from applications
    party.memberApplication.splice(applicationIndex, 1);
    
    if (action === 'accept') {
      // Check if party is full
      if (party.members.length >= party.maxMembers) {
        throw new ErrorHandler(400, 'Party is already full');
      }
      
      // Add to members
      if (!party.members.includes(userId)) {
        party.members.push(userId);
      }
      
      // Update party status if full
      if (party.members.length >= party.maxMembers) {
        party.status = 'Full';
      }
      
      // Add party to user's joinedParties
      await User.findByIdAndUpdate(userId, {
        $addToSet: { joinedParties: party._id }
      });
      
      // Notify user about acceptance
      // (Implement notification system here)
    }
    
    await party.save();
    
    res.json({
      success: true,
      message: `Application ${action}ed successfully`,
      party: await party.populate(['members', 'memberApplication'], 'firstName lastName email profilePicture')
    });
    
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

// Get party details by ID
exports.getPartyById = async (req, res, next) => {
  try {
    const { partyId } = req.params;
    const userId = req.user?._id;
    
    const party = await Party.findById(partyId)
      .populate('leader', 'firstName lastName email profilePicture')
      .populate('members', 'firstName lastName email profilePicture')
      .populate('memberApplication', 'firstName lastName email profilePicture')
      .populate('room', 'title price location images owner maxPartyMembers');
    
    if (!party) {
      throw new ErrorHandler(404, 'Party not found');
    }
    
    // Check if user is the room owner or a party member
    const isRoomOwner = userId && party.room.owner.toString() === userId;
    const isPartyMember = userId && (
      party.leader._id.toString() === userId ||
      party.members.some(member => member._id.toString() === userId)
    );
    
    if (!isRoomOwner && !isPartyMember) {
      throw new ErrorHandler(403, 'Access denied');
    }
    
    res.json({
      success: true,
      isLeader: userId && party.leader._id.toString() === userId,
      isRoomOwner,
      party: {
        ...party.toObject(),
        availableSlots: party.maxMembers - party.members.length
      }
    });
    
  } catch (err) {
    next(err);
  }
};
