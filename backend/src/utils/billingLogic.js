/**
 * Jewellery Billing Logic - Domain Expert Module
 *
 * COMPOSITE SCHEME: Shop pays 1% GST internally.
 * Customer invoices do NOT include GST (Bill of Supply).
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
 *   4. Gross = Adjusted Price + Making + Stone
 *   5. Discount (fixed ₹ or % of Gross)
 *   6. Total = Gross - Discount (No GST under composite scheme)
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

// Composite scheme: 0% GST to customer
const GST_RATE = 0;

/**
 * HSN Code Mapping for Jewellery
 */
const HSN_CODES = {
  Gold: "7113",
  Silver: "7114",
  Diamond: "7102",
};

const PURITY_TO_METAL = {
  "24K": "Gold",
  "22K": "Gold",
  "18K": "Gold",
  Silver: "Silver",
  SterlingSilver: "Silver",
};

function getHSNCode(purity, category) {
  if (category === "Diamond") return HSN_CODES.Diamond;
  const metal = PURITY_TO_METAL[purity];
  return HSN_CODES[metal] || "7113";
}

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

function calculateInvoice(
  items,
  makingChargesValue = 0,
  makingChargesType = "fixed",
  discountValue = 0,
  discountType = "fixed"
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

  // Calculate discount
  let discount = 0;
  const grossAmount = subtotal + makingCharges + totalStoneCharges;
  if (discountType === "percentage") {
    discount = grossAmount * (discountValue / 100);
  } else {
    discount = discountValue;
  }

  // Composite scheme: No GST charged to customer
  const taxableAmount = grossAmount - discount;
  const gstAmount = 0;
  const totalAmount = taxableAmount;

  return {
    items: calculatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    makingCharges: Math.round(makingCharges * 100) / 100,
    stoneCharges: Math.round(totalStoneCharges * 100) / 100,
    makingChargesType,
    makingChargesValue,
    discount: Math.round(discount * 100) / 100,
    discountType,
    discountValue,
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
