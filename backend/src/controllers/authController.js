const User = require("../models/User");
const { generateToken } = require("../middleware/auth");

// Fixed admin credentials — ONLY this user can login
const ADMIN_EMAIL = "parveen@123";
const ADMIN_PASSWORD = "Focused123";
const ADMIN_NAME = "Praveen Kumar";

/**
 * POST /api/auth/register
 * DISABLED — only the pre-seeded admin can login
 */
exports.register = async (req, res) => {
  return res.status(403).json({ error: "Registration is disabled. Please use the admin credentials." });
};

/**
 * POST /api/auth/login
 * Only allows the fixed admin credentials
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Check against fixed credentials
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Find or create admin user in DB
    let user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (!user) {
      user = new User({ name: ADMIN_NAME, email: ADMIN_EMAIL.toLowerCase(), password: ADMIN_PASSWORD, role: "admin" });
      await user.save();
    }

    const token = generateToken(user);

    res.json({
      message: "Login successful",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires auth)
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: user.toJSON() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
