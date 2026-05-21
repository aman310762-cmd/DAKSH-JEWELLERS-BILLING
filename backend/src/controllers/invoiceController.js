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
      discountValue,
      discountType,
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

    // Calculate billing (Composite Scheme - no GST to customer)
    const billing = calculateInvoice(
      items,
      makingChargesValue || 0,
      makingChargesType || "fixed",
      discountValue || 0,
      discountType || "fixed"
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
        discount: billing.discount || 0,
        discountType: billing.discountType || "fixed",
        discountValue: billing.discountValue || 0,
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
      discount: billing.discount || 0,
      discountType: billing.discountType || "fixed",
      discountValue: billing.discountValue || 0,
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

// Delete invoice with password verification
exports.deleteInvoice = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required to delete an invoice" });
    }

    // Verify against fixed admin credentials
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "Focused123";
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Invalid password. Only admin can delete invoices." });
    }

    if (isInMemory()) {
      const deleted = store.deleteInvoice(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Invoice not found" });
      return res.json({ message: "Invoice deleted successfully" });
    }

    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });

    res.json({ message: "Invoice deleted successfully", invoiceNumber: invoice.invoiceNumber });
  } catch (error) {
    console.error("Delete invoice error:", error);
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

// Live gold/silver/platinum rate with MCX + RTGS premiums
exports.getLiveRates = async (req, res) => {
  try {
    const { getLiveRatesData } = require("../utils/liveRates");
    const rates = await getLiveRatesData();
    res.json(rates);
  } catch (err) {
    console.error("Live rates error:", err.message);
    // Return safe defaults
    res.json({
      gold24K: 7900,
      gold22K: 7250,
      gold18K: 5950,
      silver: 101,
      platinum: 3400,
      source: "default",
      timestamp: new Date().toISOString(),
    });
  }
};

// Daily trend data for analytics
exports.getDailyTrend = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;

    if (isInMemory()) {
      const trend = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        const dayInvoices = store.getInvoices().filter((inv) => {
          const dt = new Date(inv.createdAt);
          return dt >= d && dt <= end;
        });
        trend.push({
          date: d.toISOString().split("T")[0],
          day: d.toLocaleDateString("en-IN", { weekday: "short" }),
          dayOfMonth: d.getDate(),
          month: d.toLocaleDateString("en-IN", { month: "short" }),
          revenue: dayInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
          invoices: dayInvoices.length,
          customers: new Set(dayInvoices.map((inv) => inv.customerPhone)).size,
        });
      }
      return res.json(trend);
    }

    // MongoDB aggregation for daily trend
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const pipeline = [
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          invoices: { $sum: 1 },
          customers: { $addToSet: "$customerPhone" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ];

    const results = await Invoice.aggregate(pipeline);

    // Fill in missing days with zero values
    const trend = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const match = results.find(
        (r) => r._id.year === d.getFullYear() && r._id.month === d.getMonth() + 1 && r._id.day === d.getDate()
      );
      trend.push({
        date: d.toISOString().split("T")[0],
        day: d.toLocaleDateString("en-IN", { weekday: "short" }),
        dayOfMonth: d.getDate(),
        month: d.toLocaleDateString("en-IN", { month: "short" }),
        revenue: match ? Math.round(match.revenue * 100) / 100 : 0,
        invoices: match ? match.invoices : 0,
        customers: match ? match.customers.length : 0,
      });
    }

    res.json(trend);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Advanced analytics stats
exports.getAdvancedStats = async (req, res) => {
  try {
    if (isInMemory()) {
      const invoices = store.getInvoices();
      const now = new Date();

      // This week vs last week
      const thisWeekStart = new Date(now);
      thisWeekStart.setDate(now.getDate() - now.getDay());
      thisWeekStart.setHours(0, 0, 0, 0);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const thisWeekInvoices = invoices.filter((inv) => new Date(inv.createdAt) >= thisWeekStart);
      const lastWeekInvoices = invoices.filter((inv) => {
        const d = new Date(inv.createdAt);
        return d >= lastWeekStart && d < thisWeekStart;
      });

      const thisWeekRevenue = thisWeekInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
      const lastWeekRevenue = lastWeekInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);

      // Category breakdown
      const categoryBreakdown = {};
      invoices.forEach((inv) => {
        (inv.items || []).forEach((item) => {
          const cat = item.category || "Gold";
          if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { revenue: 0, count: 0 };
          categoryBreakdown[cat].revenue += item.adjustedPrice || 0;
          categoryBreakdown[cat].count++;
        });
      });

      // Top 5 customers
      const customerMap = {};
      invoices.forEach((inv) => {
        const key = inv.customerPhone;
        if (!customerMap[key]) customerMap[key] = { name: inv.customerName, phone: inv.customerPhone, total: 0, count: 0 };
        customerMap[key].total += inv.totalAmount || 0;
        customerMap[key].count++;
      });
      const top5Customers = Object.values(customerMap).sort((a, b) => b.total - a.total).slice(0, 5);

      // Best day
      const dayMap = {};
      invoices.forEach((inv) => {
        const dateKey = new Date(inv.createdAt).toISOString().split("T")[0];
        if (!dayMap[dateKey]) dayMap[dateKey] = { date: dateKey, revenue: 0, invoices: 0 };
        dayMap[dateKey].revenue += inv.totalAmount || 0;
        dayMap[dateKey].invoices++;
      });
      const bestDay = Object.values(dayMap).sort((a, b) => b.revenue - a.revenue)[0] || null;

      // Average daily revenue (last 30 days)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const last30Invoices = invoices.filter((inv) => new Date(inv.createdAt) >= thirtyDaysAgo);
      const last30Revenue = last30Invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0);
      const avgDailyRevenue = last30Revenue / 30;

      return res.json({
        weeklyComparison: {
          thisWeek: { revenue: thisWeekRevenue, invoices: thisWeekInvoices.length },
          lastWeek: { revenue: lastWeekRevenue, invoices: lastWeekInvoices.length },
          changePercent: lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0,
        },
        categoryBreakdown: Object.entries(categoryBreakdown).map(([name, data]) => ({ name, ...data })),
        top5Customers,
        bestDay,
        avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
      });
    }

    // MongoDB version
    const now = new Date();

    // This week vs last week
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(now.getDate() - now.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const [thisWeekAgg, lastWeekAgg] = await Promise.all([
      Invoice.aggregate([
        { $match: { createdAt: { $gte: thisWeekStart } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, invoices: { $sum: 1 } } },
      ]),
      Invoice.aggregate([
        { $match: { createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } } },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, invoices: { $sum: 1 } } },
      ]),
    ]);

    const thisWeekRevenue = thisWeekAgg[0]?.revenue || 0;
    const lastWeekRevenue = lastWeekAgg[0]?.revenue || 0;

    // Category breakdown
    const categoryAgg = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: { $ifNull: ["$items.category", "Gold"] },
          revenue: { $sum: "$items.adjustedPrice" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Top 5 customers
    const topCustomersAgg = await Invoice.aggregate([
      {
        $group: {
          _id: "$customerPhone",
          name: { $first: "$customerName" },
          phone: { $first: "$customerPhone" },
          total: { $sum: "$totalAmount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]);

    // Best day
    const bestDayAgg = await Invoice.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          invoices: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 1 },
    ]);

    // Average daily revenue (last 30 days)
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Agg = await Invoice.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, revenue: { $sum: "$totalAmount" } } },
    ]);
    const avgDailyRevenue = (last30Agg[0]?.revenue || 0) / 30;

    res.json({
      weeklyComparison: {
        thisWeek: { revenue: thisWeekRevenue, invoices: thisWeekAgg[0]?.invoices || 0 },
        lastWeek: { revenue: lastWeekRevenue, invoices: lastWeekAgg[0]?.invoices || 0 },
        changePercent: lastWeekRevenue > 0 ? Math.round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : 0,
      },
      categoryBreakdown: categoryAgg.map((c) => ({ name: c._id, revenue: Math.round(c.revenue * 100) / 100, count: c.count })),
      top5Customers: topCustomersAgg.map((c) => ({ name: c.name, phone: c.phone, total: Math.round(c.total * 100) / 100, count: c.count })),
      bestDay: bestDayAgg[0] ? { date: bestDayAgg[0]._id, revenue: Math.round(bestDayAgg[0].revenue * 100) / 100, invoices: bestDayAgg[0].invoices } : null,
      avgDailyRevenue: Math.round(avgDailyRevenue * 100) / 100,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
