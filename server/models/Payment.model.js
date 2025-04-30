const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  paymentType: { type: String, enum: ["User", "Landlord", "Adverstisement"], default: "User" },
  room: { type: Schema.Types.ObjectId, ref: "Room", required: false }, // if paymentType is "Adverstisement"
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  stripePaymentId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
