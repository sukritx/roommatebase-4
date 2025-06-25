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
  location: { type: String, required: true }, // City name for search (e.g., "Oslo")
  address: { type: String }, // Exact address (optional)
  coordinates: { // Enables location-based filtering
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], index: "2dsphere" } // [longitude, latitude]
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
  moveInPrice: { type: Number, required: true }, // Calculated (price + deposit + prepaidRent)
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
  energyRating: { type: String, default: "-" }, // Can be A, B, C, D, etc.
  
  // Applications based on room type
  singleTenantApplications: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
  partyApplications: [{ type: Schema.Types.ObjectId, ref: "Party", default: [] }], // If shareable is true
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

module.exports = mongoose.model('Room', RoomSchema);
