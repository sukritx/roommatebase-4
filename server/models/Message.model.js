const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new mongoose.Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  messageType: { type: String, enum: ["Text", "Image", "File"], default: "Text" },
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  status: { type: String, enum: ["Sent", "Delivered", "Read"], default: "Sent" },
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
