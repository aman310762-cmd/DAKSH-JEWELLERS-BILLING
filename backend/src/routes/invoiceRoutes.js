const express = require("express");
const router = express.Router();
const {
  createInvoice,
  getInvoices,
  getInvoiceById,
  sendWhatsApp,
  getBusinessConfig,
  getDashboardStats,
} = require("../controllers/invoiceController");

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/business", getBusinessConfig);
router.get("/dashboard", getDashboardStats);
router.get("/:id", getInvoiceById);
router.post("/:id/whatsapp", sendWhatsApp);

module.exports = router;
