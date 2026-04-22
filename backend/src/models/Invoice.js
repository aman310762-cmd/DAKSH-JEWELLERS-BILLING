const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, default: "" },
  weight: { type: Number, required: true },
  purity: {
    type: String,
    enum: ["24K", "22K", "18K", "Silver", "SterlingSilver"],
    required: true,
  },
  ratePerGram: { type: Number, required: true },
  basePrice: { type: Number, required: true },
  adjustedPrice: { type: Number, required: true },
});

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, default: "" },
    items: [invoiceItemSchema],
    subtotal: { type: Number, required: true },
    makingCharges: { type: Number, default: 0 },
    makingChargesType: {
      type: String,
      enum: ["fixed", "percentage"],
      default: "fixed",
    },
    makingChargesValue: { type: Number, default: 0 },
    taxableAmount: { type: Number, required: true },
    gstRate: { type: Number, default: 3 },
    gstAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["draft", "finalized", "sent"],
      default: "finalized",
    },
    whatsappSent: { type: Boolean, default: false },
    whatsappSentAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Auto-generate invoice number: DJ-YYYY-XXXX
invoiceSchema.pre("validate", async function (next) {
  if (!this.invoiceNumber) {
    const count = await mongoose.model("Invoice").countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `DJ-${year}-${(count + 1)
      .toString()
      .padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Invoice", invoiceSchema);
