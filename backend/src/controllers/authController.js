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
 * Only allows the fixed admin credentials.
 * Works even if MongoDB is not connected — falls back to a synthetic user object.
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

    // Try to find or create admin user in DB
    let user;
    try {
      user = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
      if (!user) {
        user = new User({
          name: ADMIN_NAME,
          email: ADMIN_EMAIL.toLowerCase(),
          password: ADMIN_PASSWORD,
          role: "admin",
        });
        await user.save();
      }
    } catch (dbErr) {
      // MongoDB is not connected — use a synthetic user object for JWT
      console.warn("⚠️  DB unavailable during login, using fallback user:", dbErr.message);
      user = {
        _id: "admin-fallback-id",
        name: ADMIN_NAME,
        email: ADMIN_EMAIL.toLowerCase(),
        role: "admin",
        toJSON() {
          return { _id: this._id, name: this.name, email: this.email, role: this.role };
        },
      };
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
 * Get current user profile (requires auth).
 * Falls back gracefully if DB is unavailable.
 */
exports.getProfile = async (req, res) => {
  try {
    // If using fallback ID, return profile from JWT data
    if (req.user.id === "admin-fallback-id") {
      return res.json({
        user: {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      // User might have been in a previous in-memory DB session
      // Return profile from JWT data instead of 404
      return res.json({
        user: {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    }
    res.json({ user: user.toJSON() });
  } catch (error) {
    // If DB is down, fall back to JWT-based profile
    if (req.user) {
      return res.json({
        user: {
          _id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
      });
    }
    res.status(500).json({ error: error.message });
  }
};
