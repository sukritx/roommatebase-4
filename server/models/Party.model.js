const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PartySchema = new mongoose.Schema({
  room: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  leader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  memberApplication: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  members: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }], // Accepted by leader
  maxMembers: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["Open", "Full", "Closed"],
    default: "Open"
  },
}, { timestamps: true });

module.exports = mongoose.model('Party', PartySchema);
