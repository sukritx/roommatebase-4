const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PaymentSchema = new mongoose.Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  paymentType: { type: String, enum: ["User", "Landlord"], default: "User" },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "Completed", "Failed"], default: "Pending" },
  stripePaymentId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
