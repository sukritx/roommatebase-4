const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new mongoose.Schema({
  owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  ownerType: { type: String, enum: ["Tenant", "Landlord"], default: "Landlord" },
  // Property Information
  category: { type: String, enum: ["Apartment", "City house", "Club room", "Condominium", "Detached Single Family House", "Double house", "Half double house", "Housing Cooperative", "Multi family house", "Parcel house", "Small house", "Summer house", "Townhouse", "Villa", "Youth Housing"], required: true },
  images: [{ type: String }],
  title: { type: String, required: true },
  description: { type: String, required: true },
  streetAddress: { type: String, required: true }, // e.g., "123 Main St"
  buildingName: { type: String }, // e.g., "Park Towers" for apartments, or "The Old Mill House" for a detached house
  apartmentDetails: { type: String}, // e.g., "Apt 201", "Unit 5B", "Building C, Penthouse"
  city: { type: String, required: true },
  state: { type: String },
  zipCode: { type: String, required: true },
  country: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ["Point"], default: "Point", required: true },
    coordinates: {
      type: [Number],
      index: "2dsphere",
      required: true, // Make coordinates array itself required
      validate: {
        validator: function(v) { return Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' && typeof v[1] === 'number'; },
        message: 'Coordinates must be an array of two numbers [longitude, latitude]'
      }
    }
  },
  size: { type: Number, required: true }, // Size in square meters
  rooms: { type: Number, required: true }, // Number of rooms
  bathrooms: { type: Number, required: true }, // Number of bathrooms
  floor: { type: Number }, // Floor number
  furnished: { type: Boolean, default: false },
  shareable: { type: Boolean, default: false },
  
  // Rental Information
  rentalPeriod: { 
      type: String, 
      enum: ["1-11 months", "12-23 months", "24+ months", "Unlimited"], 
      required: true 
  },
  availableFrom: { 
      type: String, 
      enum: ["Specific Date", "As soon as possible"], 
      required: true 
  },
  availableDate: { type: Date }, // Used when "Specific Date" is selected
  price: { type: Number, required: true },
  utilities: { type: Number, default: 0 }, // Additional utility costs
  deposit: { type: Number, required: true },
  prepaidRent: { type: Number, required: true },
  currency: {
    type: String,
    enum: ["USD", "EUR", "NOK", "THB", "GBP", "JPY", /* ...add more as needed */],
    required: true,
    default: "USD"
  },
  
  // Lifestyle & Facilities
  petsAllowed: { type: Boolean, default: false },
  elevator: { type: Boolean, default: false },
  seniorFriendly: { type: Boolean, default: false },
  studentsOnly: { type: Boolean, default: false },
  balcony: { type: Boolean, default: false },
  parking: { type: Boolean, default: false },
  dishwasher: { type: Boolean, default: false },
  washingMachine: { type: Boolean, default: false },
  electricChargingStation: { type: Boolean, default: false },
  dryer: { type: Boolean, default: false },
  energyRating: {
    type: String,
    enum: ["A", "B", "C", "D", "E", "F", "G", "Not Applicable", "-"], // Example values, adjust as needed
    default: "-"
  },
  
  // Applications based on room type
  singleTenantApplications: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  partyApplications: [{ type: Schema.Types.ObjectId, ref: "Party", default: [] }], // If shareable is true
  maxPartyMembers: { type: Number },
  existingRoommate: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  status: { type: String, enum: ["Available", "Pending", "Taken"], default: "Available" },
  lastUpdated: { type: Date, default: Date.now },
  
  // Contact & Digital Showing
  contactOptions: {
      byMessage: { type: Boolean, default: true },
      byPhone: { type: Boolean, default: false },
      phoneNumber: { type: String }
  },
  digitalShowing: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 }, // Track number of views
  
  createdAt: { type: Date, default: Date.now }
});

RoomSchema.index({ city: 1 }); // For city searches
RoomSchema.index({ zipCode: 1 }); // For zip code searches
RoomSchema.index({ country: 1 }); // If you offer multi-country search/filtering
RoomSchema.index({ coordinates: "2dsphere" }); // Already there, good!
// ... and other indexes like price, category, owner, status, createdAt

RoomSchema.virtual('calculatedMoveInPrice').get(function() {
  return this.price + this.deposit + this.prepaidRent;
});

// To include virtuals in JSON/object output
RoomSchema.set('toJSON', { virtuals: true });
RoomSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Room', RoomSchema);
