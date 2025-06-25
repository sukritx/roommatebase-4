const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ["User", "Institution"], default: "User" },
  institutionLogo: { type: String, default: "" },
  firstName: { type: String },
  lastName: { type: String },
  profilePicture: { type: String, default: "" },
  age: { type: Number },
  gender: { type: String, enum: ["Male", "Female", "Other"] },
  location: { type: String },
  bio: { type: String },
  budget: { type: Number },
  preferredRoommateGender: { type: String, enum: ["Male", "Female", "Other", "Any"], default: "Any" },
  interests: { type: [String] },
  isSmoker: { type: Boolean, default: false },
  hasPet: { type: Boolean, default: false },
  occupation: { type: String },
  isRoomOwner: { type: Boolean, default: false },
  listedRooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  favoriteRooms: [{ type: Schema.Types.ObjectId, ref: "Room" }],
  joinedParty: { type: Schema.Types.ObjectId, ref: "Party" },
  socialMedia: [{
    facebook: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    phoneNumber: { type: String, default: "" }, // For contact as a landlord
  }],
  isPaid: { type: Boolean, default: false },
  paidUntil: { type: Date, default: null },
  freeQuotaUsed: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
