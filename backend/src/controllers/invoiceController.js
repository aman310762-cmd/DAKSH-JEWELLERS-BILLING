const Invoice = require("../models/Invoice");
const Customer = require("../models/Customer");
const { calculateInvoice } = require("../utils/billingLogic");
const businessConfig = require("../config/business");
const { isInMemory } = require("../config/db");
const store = require("../utils/inMemoryStore");

// Create invoice
exports.createInvoice = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      makingChargesValue,
      makingChargesType,
    } = req.body;

    // ===== VALIDATION =====
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    if (!customerPhone || !customerPhone.trim()) {
      return res.status(400).json({ error: "Customer phone is required" });
    }
    const cleanPhone = customerPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Mobile number must be exactly 10 digits" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }
    // Validate each item
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.name.trim()) {
        return res.status(400).json({ error: `Item ${i + 1}: Name is required` });
      }
      if (!item.weight || item.weight <= 0) {
        return res.status(400).json({ error: `Item ${i + 1}: Weight must be > 0` });
      }
      if (!item.ratePerGram || item.ratePerGram <= 0) {
        return res.status(400).json({ error: `Item ${i + 1}: Rate must be > 0` });
      }
    }

    // Calculate billing
    const billing = calculateInvoice(
      items,
      makingChargesValue || 0,
      makingChargesType || "fixed"
    );

    if (isInMemory()) {
      const { customer } = store.createCustomer({
        name: customerName.trim(),
        phone: cleanPhone,
        address: customerAddress,
      });

      const invoice = store.createInvoice({
        customerId: customer._id,
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        customerAddress: customerAddress || "",
        items: billing.items.map((item) => ({
          name: item.name,
          code: item.code || "",
          category: item.category || "Gold",
          weight: item.weight,
          purity: item.purity,
          ratePerGram: item.ratePerGram,
          basePrice: item.basePrice,
          adjustedPrice: item.adjustedPrice,
          stoneCharges: item.stoneCharges || 0,
          hsnCode: item.hsnCode || "7113",
        })),
        subtotal: billing.subtotal,
        makingCharges: billing.makingCharges,
        stoneCharges: billing.stoneCharges || 0,
        makingChargesType: billing.makingChargesType,
        makingChargesValue: billing.makingChargesValue,
        taxableAmount: billing.taxableAmount,
        gstRate: billing.gstRate,
        gstAmount: billing.gstAmount,
        totalAmount: billing.totalAmount,
        status: "finalized",
      });

      return res.status(201).json({
        message: "Invoice created successfully",
        invoice,
        business: businessConfig,
      });
    }

    // MongoDB mode
    let customer;
    if (customerId) {
      customer = await Customer.findById(customerId);
    }
    if (!customer) {
      customer = await Customer.findOne({ phone: cleanPhone });
      if (!customer) {
        customer = new Customer({
          name: customerName.trim(),
          phone: cleanPhone,
          address: customerAddress,
        });
        await customer.save();
      }
    }

    const invoice = new Invoice({
      customerId: customer._id,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      customerAddress: customerAddress || "",
      items: billing.items.map((item) => ({
        name: item.name,
        code: item.code || "",
        category: item.category || "Gold",
        weight: item.weight,
        purity: item.purity,
        ratePerGram: item.ratePerGram,
        basePrice: item.basePrice,
        adjustedPrice: item.adjustedPrice,
        stoneCharges: item.stoneCharges || 0,
        hsnCode: item.hsnCode || "7113",
      })),
      subtotal: billing.subtotal,
      makingCharges: billing.makingCharges,
      stoneCharges: billing.stoneCharges || 0,
      makingChargesType: billing.makingChargesType,
      makingChargesValue: billing.makingChargesValue,
      taxableAmount: billing.taxableAmount,
      gstRate: billing.gstRate,
      gstAmount: billing.gstAmount,
      totalAmount: billing.totalAmount,
    });

    await invoice.save();

    res.status(201).json({
      message: "Invoice created successfully",
      invoice,
      business: businessConfig,
    });
  } catch (error) {
    console.error("Invoice creation error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const { search } = req.query;

    if (isInMemory()) {
      return res.json(store.getInvoices(search || ""));
    }

    let query = {};
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { customerPhone: { $regex: search, $options: "i" } },
      ];
    }

    const invoices = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get invoice by ID
exports.getInvoiceById = async (req, res) => {
  try {
    if (isInMemory()) {
      const invoice = store.getInvoiceById(req.params.id);
      if (!invoice) return res.status(404).json({ error: "Invoice not found" });
      return res.json({ invoice, business: businessConfig });
    }
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ invoice, business: businessConfig });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send WhatsApp - improved message format
exports.sendWhatsApp = async (req, res) => {
  try {
    let invoice;
    if (isInMemory()) {
      invoice = store.getInvoiceById(req.params.id);
    } else {
      invoice = await Invoice.findById(req.params.id);
    }

    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    // Format amount nicely
    const formattedAmount = new Intl.NumberFormat("en-IN").format(invoice.totalAmount);

    // Improved WhatsApp message format as specified
    const messageText = `Hello ${invoice.customerName},\nThank you for shopping with Daksh Jewellers.\nYour invoice #${invoice.invoiceNumber} is attached.\nTotal Amount: ₹${formattedAmount}\n\n— Daksh Jewellers\n${businessConfig.address}`;

    // Try Twilio if configured
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER } = process.env;

    if (
      TWILIO_ACCOUNT_SID &&
      TWILIO_AUTH_TOKEN &&
      TWILIO_ACCOUNT_SID !== "your_twilio_account_sid"
    ) {
      const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const message = await twilio.messages.create({
        body: messageText,
        from: TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:+91${invoice.customerPhone.replace(/\D/g, "").slice(-10)}`,
      });

      if (isInMemory()) {
        store.updateInvoice(req.params.id, { whatsappSent: true, whatsappSentAt: new Date().toISOString() });
      } else {
        invoice.whatsappSent = true;
        invoice.whatsappSentAt = new Date();
        await invoice.save();
      }

      return res.json({ message: "WhatsApp message sent", sid: message.sid });
    }

    // Fallback: wa.me link
    const phone = invoice.customerPhone.replace(/\D/g, "");
    const phoneNumber = phone.startsWith("91") ? phone : `91${phone}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(messageText)}`;

    if (isInMemory()) {
      store.updateInvoice(req.params.id, { whatsappSent: true, whatsappSentAt: new Date().toISOString() });
    } else {
      invoice.whatsappSent = true;
      invoice.whatsappSentAt = new Date();
      await invoice.save();
    }

    res.json({ message: "WhatsApp link generated", whatsappUrl, method: "wa.me" });
  } catch (error) {
    console.error("WhatsApp error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get business config
exports.getBusinessConfig = (req, res) => {
  res.json(businessConfig);
};

// Enhanced dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    if (isInMemory()) {
      const stats = store.getDashboardStats();
      return res.json({ ...stats, business: businessConfig });
    }

    const totalCustomers = await Customer.countDocuments();
    const totalInvoices = await Invoice.countDocuments();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const todayInvoices = await Invoice.countDocuments({ createdAt: { $gte: today } });

    const todaySalesAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const monthlySalesAgg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);

    const totalRevenueAgg = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    // Top customer
    const topCustomerAgg = await Invoice.aggregate([
      { $group: { _id: "$customerPhone", name: { $first: "$customerName" }, phone: { $first: "$customerPhone" }, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 1 },
    ]);

    const recentInvoices = await Invoice.find().sort({ createdAt: -1 }).limit(8);

    res.json({
      totalCustomers,
      totalInvoices,
      todayInvoices,
      todaySales: todaySalesAgg[0]?.total || 0,
      monthlyInvoices: monthlySalesAgg[0]?.count || 0,
      monthlySales: monthlySalesAgg[0]?.total || 0,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      todayRevenue: todaySalesAgg[0]?.total || 0,
      topCustomer: topCustomerAgg[0] || null,
      recentInvoices,
      business: businessConfig,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Monthly trend data for analytics charts
exports.getMonthlyTrend = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;

    if (isInMemory()) {
      // Build trend from in-memory data
      const trend = [];
      const now = new Date();
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
        const monthInvoices = store.getInvoices().filter((inv) => {
          const dt = new Date(inv.createdAt);
          return dt >= d && dt <= end;
        });
        trend.push({
          month: d.toLocaleString("en-IN", { month: "short" }),
          year: d.getFullYear(),
          revenue: monthInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
          invoices: monthInvoices.length,
          customers: new Set(monthInvoices.map((inv) => inv.customerPhone)).size,
        });
      }
      return res.json(trend);
    }

    // MongoDB aggregation for monthly trend
    const pipeline = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - months)),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          invoices: { $sum: 1 },
          customers: { $addToSet: "$customerPhone" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ];

    const results = await Invoice.aggregate(pipeline);
    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const trend = results.map((r) => ({
      month: monthNames[r._id.month],
      year: r._id.year,
      revenue: Math.round(r.revenue * 100) / 100,
      invoices: r.invoices,
      customers: r.customers.length,
    }));

    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Live gold/silver rate proxy (Phase 5)
exports.getLiveRates = async (req, res) => {
  try {
    // Try fetching from a public API
    const response = await fetch("https://www.goldapi.io/api/XAU/INR", {
      headers: { "x-access-token": process.env.GOLD_API_KEY || "" },
    });

    if (response.ok) {
      const data = await response.json();
      return res.json({
        gold24K: Math.round(data.price_gram_24k || 0),
        gold22K: Math.round(data.price_gram_22k || 0),
        gold18K: Math.round(data.price_gram_18k || 0),
        silver: Math.round(data.price_gram_24k ? data.price_gram_24k / 80 : 0), // approximate
        timestamp: new Date().toISOString(),
        source: "goldapi.io",
      });
    }

    // Fallback: return reasonable defaults
    res.json({
      gold24K: 7200,
      gold22K: 6600,
      gold18K: 5400,
      silver: 95,
      timestamp: new Date().toISOString(),
      source: "default",
    });
  } catch {
    res.json({
      gold24K: 7200,
      gold22K: 6600,
      gold18K: 5400,
      silver: 95,
      timestamp: new Date().toISOString(),
      source: "default",
    });
  }
};
