const RoomChat = require('../models/RoomChat.model');
const Room = require('../models/Room.model');
const User = require('../models/User.model');
const { ErrorHandler } = require('../middleware/errorHandler'); // Make sure this is correctly implemented

// Helper function to format chat message sender info
const formatChatMessageSender = (message) => {
  const senderId = message.sender.senderId;
  const username = message.sender.username;

  let formattedSender = { _id: senderId, username: username };

  // If senderId was populated, use the populated details
  if (senderId && typeof senderId === 'object' && senderId.username) {
    formattedSender = {
      _id: senderId._id,
      username: senderId.username || username,
      firstName: senderId.firstName || '',
      lastName: senderId.lastName || '',
      profilePicture: senderId.profilePicture || '',
      name: `${senderId.firstName || ''} ${senderId.lastName || ''}`.trim() || username // Combine for display
    };
  }
  return formattedSender;
};


// Get chat history for a specific room
exports.getRoomChat = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    // Optional: Check if the room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorHandler(404, 'Room not found.'));
    }

    // Fetch chat messages for the room, sorted by creation date
    const chatMessages = await RoomChat.find({
      room: roomId,
      isDeleted: false // Only fetch non-deleted messages
    })
    .populate('sender.senderId', 'username firstName lastName profilePicture')
    .populate('replyParentMessage', 'chatContent sender.username createdAt')
    .sort({ createdAt: 1 })
    .lean();

    // Format sender info for all messages
    const formattedMessages = chatMessages.map(message => ({
      ...message,
      sender: formatChatMessageSender(message),
      // If replyParentMessage is populated, format its sender as well
      replyParentMessage: message.replyParentMessage ? {
        ...message.replyParentMessage,
        sender: formatChatMessageSender(message.replyParentMessage) // Pass parent message to formatter
      } : null
    }));

    res.status(200).json({
      success: true,
      roomId,
      messages: formattedMessages
    });
  } catch (err) {
    console.error('Error fetching room chat:', err);
    next(new ErrorHandler(500, 'Failed to fetch room chat.'));
  }
};

// Post a new chat message to a room
exports.postRoomChatMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { chatContent, replyParentMessageId } = req.body; // Renamed for clarity on client
    const userId = req.user._id;

    if (!chatContent || chatContent.trim() === '') {
      return next(new ErrorHandler(400, 'Chat content cannot be empty.'));
    }

    const user = await User.findById(userId).select('username firstName lastName profilePicture');
    if (!user) {
      return next(new ErrorHandler(404, 'User not found.'));
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return next(new ErrorHandler(404, 'Room not found.'));
    }

    const newChatMessage = new RoomChat({
      room: roomId,
      sender: {
        senderId: userId,
        username: user.username, // Store username at the time of sending for historical accuracy
      },
      chatContent,
      replyParentMessage: replyParentMessageId || null,
    });

    await newChatMessage.save();

    // Re-populate the sender and parent message for the real-time event
    const populatedMessage = await RoomChat.findById(newChatMessage._id)
      .populate('sender.senderId', 'username firstName lastName profilePicture')
      .populate('replyParentMessage', 'chatContent sender.username createdAt')
      .lean();

    // Format the message before emitting
    const formattedMessageForEmit = {
      ...populatedMessage,
      sender: formatChatMessageSender(populatedMessage),
      replyParentMessage: populatedMessage.replyParentMessage ? {
        ...populatedMessage.replyParentMessage,
        sender: formatChatMessageSender(populatedMessage.replyParentMessage)
      } : null
    };

    // Emit event for real-time updates via Socket.IO
    req.io.to(roomId).emit('newRoomChatMessage', formattedMessageForEmit);

    res.status(201).json({
      success: true,
      message: 'Message posted successfully.',
      chatMessage: formattedMessageForEmit
    });
  } catch (err) {
    console.error('Error posting room chat message:', err);
    next(new ErrorHandler(500, 'Failed to post message.'));
  }
};

// Edit an existing chat message
exports.editRoomChatMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { chatContent } = req.body;
    const userId = req.user._id;

    if (!chatContent || chatContent.trim() === '') {
      return next(new ErrorHandler(400, 'Chat content cannot be empty.'));
    }

    const chatMessage = await RoomChat.findById(messageId);

    if (!chatMessage) {
      return next(new ErrorHandler(404, 'Message not found.'));
    }

    if (chatMessage.sender.senderId.toString() !== userId.toString()) {
      return next(new ErrorHandler(403, 'You are not authorized to edit this message.'));
    }

    if (chatMessage.isDeleted) {
      return next(new ErrorHandler(400, 'Cannot edit a deleted message.'));
    }

    chatMessage.chatContent = chatContent;
    await chatMessage.save();

    // Re-populate and emit updated message
    const populatedMessage = await RoomChat.findById(chatMessage._id)
      .populate('sender.senderId', 'username firstName lastName profilePicture')
      .populate('replyParentMessage', 'chatContent sender.username createdAt')
      .lean();

    const formattedMessageForEmit = {
      ...populatedMessage,
      sender: formatChatMessageSender(populatedMessage),
      replyParentMessage: populatedMessage.replyParentMessage ? {
        ...populatedMessage.replyParentMessage,
        sender: formatChatMessageSender(populatedMessage.replyParentMessage)
      } : null
    };

    req.io.to(chatMessage.room.toString()).emit('updateRoomChatMessage', formattedMessageForEmit);

    res.status(200).json({
      success: true,
      message: 'Message updated successfully.',
      chatMessage: formattedMessageForEmit
    });
  } catch (err) {
    console.error('Error editing room chat message:', err);
    next(new ErrorHandler(500, 'Failed to update message.'));
  }
};

// Soft delete a chat message (by sender or moderator)
exports.deleteRoomChatMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    // userType might be 'User', 'Institution', 'Admin' based on your schema
    // Assuming req.user.userType is set by your JWT decoding or a preceding middleware
    const user = await User.findById(userId).select('userType');
    const userType = user ? user.userType : 'User'; // Default to 'User' if not found/provided

    const chatMessage = await RoomChat.findById(messageId);

    if (!chatMessage) {
      return next(new ErrorHandler(404, 'Message not found.'));
    }

    const isSender = chatMessage.sender.senderId.toString() === userId.toString();
    const isModerator = userType === 'Admin' || userType === 'Institution'; // Assuming 'Institution' can moderate in rooms they own

    // Additionally, check if the user is the owner of the room the chat belongs to
    const room = await Room.findById(chatMessage.room);
    const isRoomOwner = room && room.owner.toString() === userId.toString();

    if (!isSender && !isModerator && !isRoomOwner) {
      return next(new ErrorHandler(403, 'You are not authorized to delete this message.'));
    }

    chatMessage.isDeleted = true;
    chatMessage.deletedBy = userId;
    chatMessage.deletionReason = req.body.reason || 'No reason provided.';
    await chatMessage.save();

    // Emit deletion event
    req.io.to(chatMessage.room.toString()).emit('deleteRoomChatMessage', { messageId: messageId, roomId: chatMessage.room.toString() });

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully (soft delete).',
      chatMessage
    });
  } catch (err) {
    console.error('Error deleting room chat message:', err);
    next(new ErrorHandler(500, 'Failed to delete message.'));
  }
};

// Reply to a specific chat message
exports.replyToRoomChatMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params; // This is the ID of the message being replied to
    const { chatContent, roomId } = req.body; // roomId is crucial to ensure reply is in correct room
    const userId = req.user._id;

    if (!chatContent || chatContent.trim() === '') {
      return next(new ErrorHandler(400, 'Reply content cannot be empty.'));
    }

    const parentMessage = await RoomChat.findOne({ _id: messageId, room: roomId }); // Verify parent belongs to room
    if (!parentMessage) {
      return next(new ErrorHandler(404, 'Parent message not found or does not belong to this room.'));
    }

    const user = await User.findById(userId).select('username firstName lastName profilePicture');
    if (!user) {
      return next(new ErrorHandler(404, 'User not found.'));
    }

    const newReply = new RoomChat({
      room: roomId,
      sender: {
        senderId: userId,
        username: user.username,
      },
      chatContent,
      replyParentMessage: messageId,
    });

    await newReply.save();

    // Re-populate and emit new reply
    const populatedReply = await RoomChat.findById(newReply._id)
      .populate('sender.senderId', 'username firstName lastName profilePicture')
      .populate('replyParentMessage', 'chatContent sender.username createdAt')
      .lean();

    const formattedReplyForEmit = {
      ...populatedReply,
      sender: formatChatMessageSender(populatedReply),
      replyParentMessage: populatedReply.replyParentMessage ? {
        ...populatedReply.replyParentMessage,
        sender: formatChatMessageSender(populatedReply.replyParentMessage)
      } : null
    };

    req.io.to(roomId).emit('newRoomChatMessage', formattedReplyForEmit);

    res.status(201).json({
      success: true,
      message: 'Reply posted successfully.',
      chatMessage: formattedReplyForEmit
    });

  } catch (err) {
    console.error('Error replying to room chat message:', err);
    next(new ErrorHandler(500, 'Failed to post reply.'));
  }
};