const User = require("../models/User");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../middleware/auth");

// Fixed admin credentials — ONLY this user can login
const ADMIN_EMAIL = (process.env.ADMIN_USERNAME || "Parveen@123").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Focused123";
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

    // Check against fixed credentials (case-insensitive username)
    if (email.toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Try to find admin user in DB
    let user;
    try {
      user = await User.findOne({ email: ADMIN_EMAIL });
      if (!user) {
        // Create admin if doesn't exist
        user = new User({
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
          role: "admin",
        });
        await user.save();
        console.log("✅ Admin user created during login");
      }
    } catch (dbErr) {
      // MongoDB is not connected — use a synthetic user object for JWT
      console.warn("⚠️  DB unavailable during login, using fallback user:", dbErr.message);
      user = {
        _id: "admin-fallback-id",
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
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
 * POST /api/auth/logout
 * Client-side logout (JWT is stateless, but we acknowledge the request)
 */
exports.logout = async (req, res) => {
  res.json({ message: "Logged out successfully" });
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
