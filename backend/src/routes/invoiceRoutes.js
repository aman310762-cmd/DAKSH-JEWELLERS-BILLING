const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  sendWhatsApp,
  getBusinessConfig,
  getDashboardStats,
  getMonthlyTrend,
  getLiveRates,
  deleteInvoice,
  getDailyTrend,
  getAdvancedStats,
} = require("../controllers/invoiceController");

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/business", getBusinessConfig);
router.get("/dashboard", getDashboardStats);
router.get("/trend", getMonthlyTrend);
router.get("/daily-trend", getDailyTrend);
router.get("/advanced-stats", getAdvancedStats);
router.get("/rates", getLiveRates);
router.get("/:id", getInvoiceById);
router.post("/:id/whatsapp", sendWhatsApp);
router.delete("/:id", deleteInvoice);

module.exports = router;
