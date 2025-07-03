const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomChatSchema = new mongoose.Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  sender: {
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
  },
  chatContent: {
    type: String,
    required: true
  },
  replyParentMessage: {
    type: Schema.Types.ObjectId, ref: 'RoomChat',
    default: null
  },
  isDeleted: { type: Boolean, default: false, index: true }, // Soft delete
  deletedBy: { type: Schema.Types.ObjectId, ref: 'User' }, // Moderator ID
  deletionReason: { type: String },
}, { timestamps: true });

RoomChatSchema.index({ room: 1, createdAt: 1 });

module.exports = mongoose.model('RoomChat', RoomChatSchema);
