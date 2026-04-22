/**
 * Jewellery Billing Logic - Domain Expert Module
 *
 * Purity Standards:
 *   24K = 99.9% pure gold
 *   22K = 91.6% pure gold (Hallmark)
 *   18K = 75.0% pure gold
 *   Silver = 99.9% pure silver
 *   SterlingSilver = 92.5% pure silver
 *
 * Billing Formula:
 *   1. Base Price = Weight × Rate per gram
 *   2. Adjusted Price = Base Price × Purity Factor
 *   3. Making Charges (fixed ₹ or % of adjusted price)
 *   4. Taxable Amount = Adjusted Price + Making Charges
 *   5. GST = 3% of Taxable Amount
 *   6. Total = Taxable Amount + GST
 */

const PURITY_FACTORS = {
  "24K": 0.999,
  "22K": 0.916,
  "18K": 0.75,
  Silver: 0.999,
  SterlingSilver: 0.925,
};

const PURITY_LABELS = {
  "24K": "24K Gold (99.9%)",
  "22K": "22K Gold (91.6%)",
  "18K": "18K Gold (75.0%)",
  Silver: "Silver",
  SterlingSilver: "Sterling Silver",
};

const GST_RATE = 3; // 3% GST on jewellery

/**
 * Calculate billing for a single item
 */
function calculateItemPrice(item) {
  const { weight, ratePerGram, purity } = item;

  const purityFactor = PURITY_FACTORS[purity];
  if (!purityFactor) {
    throw new Error(
      `Invalid purity: ${purity}. Use 24K, 22K, 18K, Silver, or SterlingSilver`
    );
  }

  const basePrice = weight * ratePerGram;
  const adjustedPrice = basePrice * purityFactor;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
    purityFactor,
  };
}

/**
 * Calculate full invoice totals
 */
function calculateInvoice(
  items,
  makingChargesValue = 0,
  makingChargesType = "fixed"
) {
  const calculatedItems = items.map((item) => {
    const { basePrice, adjustedPrice, purityFactor } =
      calculateItemPrice(item);
    return {
      ...item,
      basePrice,
      adjustedPrice,
      purityFactor,
    };
  });

  const subtotal = calculatedItems.reduce(
    (sum, item) => sum + item.adjustedPrice,
    0
  );

  let makingCharges = 0;
  if (makingChargesType === "percentage") {
    makingCharges = subtotal * (makingChargesValue / 100);
  } else {
    makingCharges = makingChargesValue;
  }

  const taxableAmount = subtotal + makingCharges;
  const gstAmount = taxableAmount * (GST_RATE / 100);
  const totalAmount = taxableAmount + gstAmount;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    makingCharges: Math.round(makingCharges * 100) / 100,
    makingChargesType,
    makingChargesValue,
    taxableAmount: Math.round(taxableAmount * 100) / 100,
    gstRate: GST_RATE,
    gstAmount: Math.round(gstAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
  };
}

module.exports = {
  calculateItemPrice,
  calculateInvoice,
  PURITY_FACTORS,
  PURITY_LABELS,
  GST_RATE,
};
