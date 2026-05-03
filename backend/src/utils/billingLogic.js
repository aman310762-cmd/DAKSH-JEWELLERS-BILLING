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
 * HSN Code Mapping for Jewellery
 * Gold Jewellery → 7113
 * Silver Jewellery → 7114
 * Diamond Jewellery → 7102
 */
const HSN_CODES = {
  Gold: "7113",
  Silver: "7114",
  Diamond: "7102",
};

// Map purity key to metal type for HSN lookup
const PURITY_TO_METAL = {
  "24K": "Gold",
  "22K": "Gold",
  "18K": "Gold",
  Silver: "Silver",
  SterlingSilver: "Silver",
};

/**
 * Get HSN code for a purity type
 */
function getHSNCode(purity, category) {
  if (category === "Diamond") return HSN_CODES.Diamond;
  const metal = PURITY_TO_METAL[purity];
  return HSN_CODES[metal] || "7113";
}

/**
 * Calculate billing for a single item
 */
function calculateItemPrice(item) {
  const { weight, ratePerGram, purity, stoneCharges = 0 } = item;

  const purityFactor = PURITY_FACTORS[purity];
  if (!purityFactor) {
    throw new Error(
      `Invalid purity: ${purity}. Use 24K, 22K, 18K, Silver, or SterlingSilver`
    );
  }

  const basePrice = weight * ratePerGram;
  const adjustedPrice = basePrice * purityFactor;
  const hsnCode = getHSNCode(purity, item.category);

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
    stoneCharges: Math.round((parseFloat(stoneCharges) || 0) * 100) / 100,
    purityFactor,
    hsnCode,
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
    const { basePrice, adjustedPrice, purityFactor, stoneCharges, hsnCode } =
      calculateItemPrice(item);
    return {
      ...item,
      basePrice,
      adjustedPrice,
      stoneCharges,
      hsnCode,
      purityFactor,
    };
  });

  const subtotal = calculatedItems.reduce(
    (sum, item) => sum + item.adjustedPrice,
    0
  );

  // Total stone charges across all items
  const totalStoneCharges = calculatedItems.reduce(
    (sum, item) => sum + (item.stoneCharges || 0),
    0
  );

  let makingCharges = 0;
  if (makingChargesType === "percentage") {
    makingCharges = subtotal * (makingChargesValue / 100);
  } else {
    makingCharges = makingChargesValue;
  }

  // Formula: Final = (weight × rate × purity) + making + stone + GST
  const taxableAmount = subtotal + makingCharges + totalStoneCharges;
  const gstAmount = taxableAmount * (GST_RATE / 100);
  const totalAmount = taxableAmount + gstAmount;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    makingCharges: Math.round(makingCharges * 100) / 100,
    stoneCharges: Math.round(totalStoneCharges * 100) / 100,
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
  HSN_CODES,
  PURITY_TO_METAL,
  getHSNCode,
};
