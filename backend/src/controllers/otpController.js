const OtpSession = require("../models/OtpSession");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");

const OWNER_PHONE = (process.env.OWNER_PHONE || "6375625863").replace(/\D/g, "").slice(-10);
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;
const MAX_REQUESTS_PER_HOUR = 5;

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via Twilio SMS
 * Falls back to console.log in dev if Twilio not configured
 */
async function sendOTPViaSMS(phone, otp) {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_SMS_NUMBER,
    TWILIO_WHATSAPP_NUMBER,
  } = process.env;

  // Try Twilio SMS first
  if (
    TWILIO_ACCOUNT_SID &&
    TWILIO_AUTH_TOKEN &&
    TWILIO_ACCOUNT_SID !== "your_twilio_account_sid"
  ) {
    const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    // Try SMS first, then WhatsApp
    if (TWILIO_SMS_NUMBER && TWILIO_SMS_NUMBER !== "+1234567890") {
      const message = await twilio.messages.create({
        body: `Daksh Jewellers: Your OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
        from: TWILIO_SMS_NUMBER,
        to: `+91${phone}`,
      });
      return { method: "sms", sid: message.sid };
    }

    // Fallback to WhatsApp
    if (TWILIO_WHATSAPP_NUMBER) {
      const message = await twilio.messages.create({
        body: `Daksh Jewellers: Your OTP is ${otp}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:+91${phone}`,
      });
      return { method: "whatsapp", sid: message.sid };
    }
  }

  // Dev fallback: log OTP to console
  console.log(`\n📱 ═══════════════════════════════════════`);
  console.log(`   OTP for +91${phone}: ${otp}`);
  console.log(`   (Twilio not configured — showing in console)`);
  console.log(`   ═══════════════════════════════════════\n`);
  return { method: "console", sid: null };
}

/**
 * POST /api/auth/forgot-password
 * Send OTP to owner's phone number
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    // Only allow OTP for the owner's phone
    if (cleanPhone !== OWNER_PHONE) {
      return res.status(403).json({ error: "This phone number is not authorized for recovery" });
    }

    // Rate limit: max 5 OTP requests per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentRequests = await OtpSession.countDocuments({
      phone: cleanPhone,
      createdAt: { $gte: oneHourAgo },
    });

    if (recentRequests >= MAX_REQUESTS_PER_HOUR) {
      return res.status(429).json({
        error: "Too many OTP requests. Please try again later.",
        retryAfter: "1 hour",
      });
    }

    // Generate OTP and hash it
    const otp = generateOTP();
    const otpHash = await bcrypt.hash(otp, 10);

    // Delete any existing OTP sessions for this phone
    await OtpSession.deleteMany({ phone: cleanPhone });

    // Create new OTP session
    const session = new OtpSession({
      phone: cleanPhone,
      otpHash,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    });
    await session.save();

    // Send OTP
    const sendResult = await sendOTPViaSMS(cleanPhone, otp);

    res.json({
      message: "OTP sent successfully",
      method: sendResult.method,
      expiresIn: `${OTP_EXPIRY_MINUTES} minutes`,
      // Only include OTP in dev mode for testing
      ...(process.env.NODE_ENV !== "production" &&
        sendResult.method === "console" && { devOtp: otp }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Failed to send OTP. Please try again." });
  }
};

/**
 * POST /api/auth/verify-otp
 * Verify OTP and generate JWT token
 */
exports.verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: "Phone and OTP are required" });
    }

    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    // Find the OTP session
    const session = await OtpSession.findOne({
      phone: cleanPhone,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!session) {
      return res.status(400).json({ error: "OTP expired or not found. Please request a new one." });
    }

    // Check attempt limit
    if (session.attempts >= MAX_ATTEMPTS) {
      await OtpSession.deleteOne({ _id: session._id });
      return res.status(429).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp.toString(), session.otpHash);

    if (!isValid) {
      session.attempts += 1;
      await session.save();
      const remaining = MAX_ATTEMPTS - session.attempts;
      return res.status(401).json({
        error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
      });
    }

    // Mark as verified
    session.verified = true;
    await session.save();

    // Find or create admin user
    const adminEmail = (process.env.ADMIN_USERNAME || "Parveen@123").toLowerCase();
    let user = await User.findOne({ email: adminEmail });

    if (!user) {
      user = new User({
        name: "Praveen Kumar",
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || "Focused123",
        role: "admin",
      });
      await user.save();
    }

    const token = generateToken(user);

    // Clean up used OTP
    await OtpSession.deleteOne({ _id: session._id });

    res.json({
      message: "OTP verified. Login successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ error: "Verification failed. Please try again." });
  }
};
