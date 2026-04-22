const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let useInMemory = false;
let mongoServer = null;

const connectDB = async () => {
  const externalUri = process.env.MONGODB_URI;

  // 1. Try external MongoDB (Atlas or local) if URI is set explicitly
  if (externalUri && externalUri !== "mongodb://localhost:27017/daksh-jewellers") {
    try {
      await mongoose.connect(externalUri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);
      return;
    } catch (err) {
      console.warn(`⚠️  External MongoDB failed: ${err.message}`);
    }
  }

  // 2. Try local MongoDB
  try {
    await mongoose.connect("mongodb://localhost:27017/daksh-jewellers", {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`✅ MongoDB Connected: localhost`);
    return;
  } catch {
    console.log("📦 Local MongoDB not available, starting embedded MongoDB...");
  }

  // 3. Use mongodb-memory-server (embedded MongoDB - full Mongoose support)
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Embedded MongoDB started at: ${uri}`);
    console.log("   ⚠️  Data will persist during this server session only");
    console.log("   💡 For permanent data, set MONGODB_URI in .env to a MongoDB Atlas URL\n");
  } catch (err) {
    console.warn(`⚠️  Embedded MongoDB also failed: ${err.message}`);
    console.warn("📦 Falling back to basic in-memory storage (no aggregation support)\n");
    useInMemory = true;
  }
};

const isInMemory = () => useInMemory;

module.exports = { connectDB, isInMemory };
