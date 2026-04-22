require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");

const customerRoutes = require("./routes/customerRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Routes
app.use("/api/customer", customerRoutes);
app.use("/api/invoice", invoiceRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Connect to DB and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n💎 ═══════════════════════════════════════`);
    console.log(`   Daksh Jewellers Backend · v2.0`);
    console.log(`   ═══════════════════════════════════════`);
    console.log(`   📡 Server:  http://localhost:${PORT}`);
    console.log(`   🗄️  Database: MongoDB (embedded)`);
    console.log(`   📋 APIs:`);
    console.log(`      POST /api/customer`);
    console.log(`      GET  /api/customer`);
    console.log(`      GET  /api/customer/phone/:phone`);
    console.log(`      POST /api/invoice`);
    console.log(`      GET  /api/invoice`);
    console.log(`      GET  /api/invoice/dashboard`);
    console.log(`      POST /api/invoice/:id/whatsapp`);
    console.log(`   ═══════════════════════════════════════\n`);
  });
});
