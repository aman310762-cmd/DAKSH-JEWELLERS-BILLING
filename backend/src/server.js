require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB, getDbMode } = require("./config/db");
const mongoose = require("mongoose");

const customerRoutes = require("./routes/customerRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const authRoutes = require("./routes/authRoutes");
const { optionalAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 10000;
const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

// Middleware
app.use(cors({
  origin: isProduction
    ? [
        "https://daksh-jewellers.vercel.app",
        "https://dakshjewellersbilling.in",
        "https://www.dakshjewellersbilling.in",
        "http://localhost",
        "capacitor://localhost",
        /\.vercel\.app$/,
        /dakshjewellersbilling\.in$/,
      ]
    : true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(optionalAuth); // Attach user if token present, but don't block

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "Daksh Jewellers Backend API",
    version: "2.1.0",
    status: "running",
    environment: isProduction ? "production" : "development",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/invoice", invoiceRoutes);

// ═══════════════════════════════════════════════
// Enhanced Health Check Endpoint
// ═══════════════════════════════════════════════
app.get("/api/health", (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStateMap = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  res.json({
    status: "ok",
    database: dbStateMap[dbState] || "unknown",
    dbMode: getDbMode(),
    environment: isProduction ? "production" : "development",
    version: "2.1.0",
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()) + "s",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// ═══════════════════════════════════════════════
// Connect to DB, seed admin, and start server
// ═══════════════════════════════════════════════
async function seedAdmin() {
  try {
    const User = require("./models/User");
    const adminEmail = (process.env.ADMIN_USERNAME || "Parveen@123").toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || "Focused123";

    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const admin = new User({
        name: "Praveen Kumar",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
      });
      await admin.save();
      console.log(`✅ Admin user seeded: ${adminEmail}`);
    } else {
      console.log(`✅ Admin user exists: ${adminEmail}`);
    }
  } catch (err) {
    console.warn("⚠️  Could not seed admin:", err.message);
  }
}

connectDB().then(async () => {
  // Seed admin only if a real DB is connected
  if (getDbMode() !== "none") {
    await seedAdmin();
  }

  app.listen(PORT, () => {
    console.log(`\n💎 ═══════════════════════════════════════`);
    console.log(`   Daksh Jewellers Backend · v2.1.0`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   📡 Server:     http://localhost:${PORT}`);
    console.log(`   🌍 Env:        ${isProduction ? "PRODUCTION" : "development"}`);
    console.log(`   🗄️  Database:   ${getDbMode().toUpperCase()}`);
    console.log(`   📋 APIs:`);
    console.log(`      POST /api/auth/login`);
    console.log(`      POST /api/auth/forgot-password`);
    console.log(`      POST /api/auth/verify-otp`);
    console.log(`      GET  /api/auth/me`);
    console.log(`      POST /api/customer`);
    console.log(`      GET  /api/customer`);
    console.log(`      GET  /api/customer/phone/:phone`);
    console.log(`      POST /api/invoice`);
    console.log(`      GET  /api/invoice`);
    console.log(`      GET  /api/invoice/dashboard`);
    console.log(`      GET  /api/health`);
    console.log(`   ═══════════════════════════════════════\n`);
  });
});
