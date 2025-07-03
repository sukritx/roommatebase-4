const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomChatSchema = new mongoose.Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  senderId: {
    type: Schema.Types.ObjectId, ref: 'User',
    required: true
  },
  chatContent: {
    type: String,
    required: true
  },
  replyParentMessage: {
    type: Schema.Types.ObjectId, ref: 'RoomChat',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('RoomChat', RoomChatSchema);
