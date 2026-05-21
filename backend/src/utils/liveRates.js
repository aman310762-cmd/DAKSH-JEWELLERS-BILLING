/**
 * Live Precious Metal Rates Service
 * 
 * Fetches live gold, silver, platinum rates for Indian retail.
 * Includes import duty, MCX premium, RTGS charges.
 *
 * Sources tried in order:
 *  1. Fawaz Ahmed Currency API (free, no key, CDN-backed)
 *  2. GoldAPI.io (if API key set)
 *  3. Curated defaults (updated to current market)
 *
 * Cache: 5 minutes
 */

let rateCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 min

// Indian market premiums over international spot (per gram)
const INDIA_PREMIUM = {
  importDutyPct: 15,       // 15% customs duty on gold import
  dealerPremium: 150,      // ₹150/g dealer/refinery margin
  mcxPremium: 50,          // ₹50/g MCX basis premium
  rtgsCharges: 30,         // ₹30/g banking/RTGS charges
};

const TROY_OZ_TO_GRAM = 31.1035;

/**
 * Method 1: Fawaz Ahmed Currency API (free, no key, jsdelivr CDN)
 * Returns gold (XAU), silver (XAG), platinum (XPT) in INR per troy oz
 */
async function fetchFromCurrencyAPI() {
  try {
    // Fetch gold price in INR
    const goldRes = await fetch(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xau.min.json",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!goldRes.ok) return null;
    const goldData = await goldRes.json();

    // xau.inr = how many INR per 1 troy ounce of gold
    const goldINRperOz = goldData?.xau?.inr;
    if (!goldINRperOz || goldINRperOz < 100000) return null; // sanity check

    // Fetch silver
    let silverINRperOz = 0;
    try {
      const silverRes = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xag.min.json",
        { signal: AbortSignal.timeout(10000) }
      );
      if (silverRes.ok) {
        const silverData = await silverRes.json();
        silverINRperOz = silverData?.xag?.inr || 0;
      }
    } catch { /* fallback */ }

    // Fetch platinum
    let platinumINRperOz = 0;
    try {
      const ptRes = await fetch(
        "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/xpt.min.json",
        { signal: AbortSignal.timeout(10000) }
      );
      if (ptRes.ok) {
        const ptData = await ptRes.json();
        platinumINRperOz = ptData?.xpt?.inr || 0;
      }
    } catch { /* fallback */ }

    // Convert to per gram (international spot)
    const goldSpotPerGram = goldINRperOz / TROY_OZ_TO_GRAM;
    const silverSpotPerGram = silverINRperOz > 0 ? silverINRperOz / TROY_OZ_TO_GRAM : goldSpotPerGram / 85;
    const platinumSpotPerGram = platinumINRperOz > 0 ? platinumINRperOz / TROY_OZ_TO_GRAM : goldSpotPerGram * 0.35;

    return {
      goldSpotPerGram,
      silverSpotPerGram,
      platinumSpotPerGram,
      source: "live-market",
    };
  } catch (err) {
    console.log("Currency API fetch failed:", err.message);
    return null;
  }
}

/**
 * Method 2: GoldAPI.io (if API key set)
 */
async function fetchFromGoldAPI(apiKey) {
  if (!apiKey) return null;
  try {
    const res = await fetch("https://www.goldapi.io/api/XAU/INR", {
      headers: { "x-access-token": apiKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      goldSpotPerGram: data.price_gram_24k || 0,
      silverSpotPerGram: (data.price_gram_24k || 0) / 85,
      platinumSpotPerGram: (data.price_gram_24k || 0) * 0.35,
      source: "goldapi.io",
    };
  } catch { return null; }
}

/**
 * Calculate Indian retail rate from international spot
 * Adds import duty, MCX premium, RTGS, dealer margin
 */
function spotToRetail(spotPerGram) {
  // Add import duty (percentage)
  const withDuty = spotPerGram * (1 + INDIA_PREMIUM.importDutyPct / 100);
  // Add fixed premiums
  const retail = withDuty + INDIA_PREMIUM.dealerPremium + INDIA_PREMIUM.mcxPremium + INDIA_PREMIUM.rtgsCharges;
  return Math.round(retail);
}

function spotToRetailSilver(spotPerGram) {
  // Silver import duty in India: 15% (aligned with gold since Budget 2024)
  // Plus MCX premium + dealer margin
  const withDuty = spotPerGram * (1 + 15 / 100);
  return Math.round(withDuty + 10); // ₹10/g MCX + dealer premium
}

function spotToRetailPlatinum(spotPerGram) {
  // Platinum import duty: 15%
  const withDuty = spotPerGram * (1 + 15 / 100);
  return Math.round(withDuty + 250); // ₹250/g refinery + dealer premium
}

/**
 * Default rates — realistic current market (updated regularly)
 */
function getDefaultRates() {
  return {
    gold24K: 15500,
    gold22K: 14200,
    gold18K: 11625,
    silver: 280,
    platinum: 7200,
    gold24KSpot: 13400,
    gold22KSpot: 12275,
    gold18KSpot: 10050,
    silverSpot: 234,
    platinumSpot: 6000,
    premiums: {
      gold: {
        importDutyPct: INDIA_PREMIUM.importDutyPct,
        mcxPremium: INDIA_PREMIUM.mcxPremium,
        rtgsCharges: INDIA_PREMIUM.rtgsCharges,
        dealerPremium: INDIA_PREMIUM.dealerPremium,
        total: INDIA_PREMIUM.dealerPremium + INDIA_PREMIUM.mcxPremium + INDIA_PREMIUM.rtgsCharges,
      },
      silver: { total: 8 },
      platinum: { total: 600 },
    },
    source: "default",
    timestamp: new Date().toISOString(),
    cached: false,
  };
}

/**
 * Main function: Get live retail rates with caching
 */
async function getLiveRatesData() {
  // Check cache
  if (rateCache && (Date.now() - cacheTimestamp) < CACHE_TTL) {
    return { ...rateCache, cached: true };
  }

  const apiKey = process.env.GOLD_API_KEY;

  // Try sources in order
  let spot = await fetchFromCurrencyAPI();
  if (!spot) spot = await fetchFromGoldAPI(apiKey);

  if (!spot) {
    // Use defaults
    const defaults = getDefaultRates();
    rateCache = defaults;
    cacheTimestamp = Date.now();
    return defaults;
  }

  // Calculate retail rates from spot
  const gold24KRetail = spotToRetail(spot.goldSpotPerGram);
  const gold22KRetail = Math.round(gold24KRetail * 0.916);
  const gold18KRetail = Math.round(gold24KRetail * 0.75);
  const silverRetail = spotToRetailSilver(spot.silverSpotPerGram);
  const platinumRetail = spotToRetailPlatinum(spot.platinumSpotPerGram);

  const fixedPremium = INDIA_PREMIUM.dealerPremium + INDIA_PREMIUM.mcxPremium + INDIA_PREMIUM.rtgsCharges;

  const result = {
    gold24K: gold24KRetail,
    gold22K: gold22KRetail,
    gold18K: gold18KRetail,
    silver: silverRetail,
    platinum: platinumRetail,
    gold24KSpot: Math.round(spot.goldSpotPerGram),
    gold22KSpot: Math.round(spot.goldSpotPerGram * 0.916),
    gold18KSpot: Math.round(spot.goldSpotPerGram * 0.75),
    silverSpot: Math.round(spot.silverSpotPerGram),
    platinumSpot: Math.round(spot.platinumSpotPerGram),
    premiums: {
      gold: {
        importDutyPct: INDIA_PREMIUM.importDutyPct,
        mcxPremium: INDIA_PREMIUM.mcxPremium,
        rtgsCharges: INDIA_PREMIUM.rtgsCharges,
        dealerPremium: INDIA_PREMIUM.dealerPremium,
        total: fixedPremium,
      },
      silver: { total: 8 },
      platinum: { total: 600 },
    },
    source: spot.source,
    timestamp: new Date().toISOString(),
    cached: false,
  };

  rateCache = result;
  cacheTimestamp = Date.now();
  return result;
}

module.exports = { getLiveRatesData, getDefaultRates, INDIA_PREMIUM };
