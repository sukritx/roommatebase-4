const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getRoomChat,
  postRoomChatMessage,
  editRoomChatMessage,
  deleteRoomChatMessage,
  replyToRoomChatMessage
} = require('../controllers/roomChatController'); // Assuming these methods exist

// Get chat history for a room (public view, but can be restricted if desired)
router.get('/:roomId', getRoomChat);

// All actions that modify the chat require authentication
router.use(auth.verifyToken);

router.post('/:roomId/message', postRoomChatMessage);
router.put('/:messageId', editRoomChatMessage); // For editing one's own message
router.delete('/:messageId', deleteRoomChatMessage); // For soft deleting (by owner/moderator)
router.post('/:messageId/reply', replyToRoomChatMessage);

module.exports = router;