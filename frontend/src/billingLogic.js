/**
 * Jewellery Billing Logic (Frontend Mirror)
 * Must match backend calculations exactly
 */

export const PURITY_FACTORS = {
  "24K": 0.999,
  "22K": 0.916,
  "18K": 0.75,
  Silver: 0.999,
  SterlingSilver: 0.925,
};

export const PURITY_LABELS = {
  "24K": "24K Gold (99.9%)",
  "22K": "22K Gold (91.6%)",
  "18K": "18K Gold (75.0%)",
  Silver: "Silver",
  SterlingSilver: "Sterling Silver",
};

// Maps purity key to "Gold" or "Silver" metal type for daily rate auto-fill
export const PURITY_METAL = {
  "24K": "gold",
  "22K": "gold",
  "18K": "gold",
  Silver: "silver",
  SterlingSilver: "silver",
};

export const GST_RATE = 3;

export function calculateItemPrice(item) {
  const { weight, ratePerGram, purity } = item;
  const purityFactor = PURITY_FACTORS[purity] || 1;
  const basePrice = weight * ratePerGram;
  const adjustedPrice = basePrice * purityFactor;
  return {
    basePrice: Math.round(basePrice * 100) / 100,
    adjustedPrice: Math.round(adjustedPrice * 100) / 100,
  };
}

export function calculateInvoice(
  items,
  makingChargesValue = 0,
  makingChargesType = "fixed"
) {
  const calculatedItems = items.map((item) => {
    const { basePrice, adjustedPrice } = calculateItemPrice(item);
    return { ...item, basePrice, adjustedPrice };
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

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount || 0);
}
