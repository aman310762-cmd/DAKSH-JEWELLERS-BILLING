const mongoose = require("mongoose");

let dbMode = "none"; // "atlas", "local", "embedded", "none"

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER === "true";

  // Support both MONGO_URI and MONGODB_URI (Render uses MONGODB_URI by default)
  const externalUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  // ═══════════════════════════════════════════════════════════
  // PRODUCTION: ONLY Atlas allowed — no fallback to embedded DB
  // ═══════════════════════════════════════════════════════════
  if (isProduction) {
    if (!externalUri) {
      console.error("🚨 FATAL: No MONGO_URI or MONGODB_URI set in production!");
      console.error("   Set MONGO_URI in Render environment variables.");
      process.exit(1);
    }

    try {
      await mongoose.connect(externalUri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        retryWrites: true,
      });
      dbMode = "atlas";
      console.log(`✅ MongoDB Atlas Connected: ${mongoose.connection.host}`);
      console.log(`   Database: ${mongoose.connection.name}`);
      return;
    } catch (err) {
      console.error(`🚨 FATAL: Cannot connect to MongoDB Atlas in production!`);
      console.error(`   Error: ${err.message}`);
      console.error(`   URI host: ${externalUri.replace(/\/\/.*@/, "//***@")}`);
      process.exit(1);
    }
  }

  // ═══════════════════════════════════════════════════════════
  // DEVELOPMENT: Try Atlas → Local → Embedded (in that order)
  // ═══════════════════════════════════════════════════════════

  // 1. Try external MongoDB (Atlas) if URI is set
  if (externalUri && !externalUri.includes("localhost")) {
    try {
      await mongoose.connect(externalUri, { serverSelectionTimeoutMS: 8000 });
      dbMode = "atlas";
      console.log(`✅ MongoDB Atlas Connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(`⚠️  Atlas connection failed in dev: ${err.message}`);
    }
  }

  // 2. Try local MongoDB
  try {
    await mongoose.connect("mongodb://localhost:27017/daksh-jewellers", {
      serverSelectionTimeoutMS: 3000,
    });
    dbMode = "local";
    console.log(`✅ MongoDB Connected: localhost`);
    return;
  } catch {
    console.log("📦 Local MongoDB not available, trying embedded...");
  }

  // 3. Use mongodb-memory-server (embedded — dev only)
  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    dbMode = "embedded";
    console.log(`✅ Embedded MongoDB started at: ${uri}`);
    console.log("   ⚠️  Data will persist during this server session only");
    console.log("   💡 For permanent data, set MONGO_URI in .env to a MongoDB Atlas URL\n");
  } catch (err) {
    console.warn(`⚠️  Embedded MongoDB also failed: ${err.message}`);
    console.warn("📦 Running without database — only login (with fixed creds) will work.\n");
    dbMode = "none";
  }
};

/**
 * Returns the current database mode.
 * "atlas" | "local" | "embedded" | "none"
 */
const getDbMode = () => dbMode;

/**
 * Legacy compatibility — returns true only when NO database is available at all.
 * The in-memory store should ONLY be used in this case.
 */
const isInMemory = () => dbMode === "none";

module.exports = { connectDB, isInMemory, getDbMode };
