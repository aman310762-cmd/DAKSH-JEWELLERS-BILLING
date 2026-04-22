const express = require("express");
const router = express.Router();
const {
  createCustomer,
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
} = require("../controllers/customerController");

router.post("/", createCustomer);
router.get("/", getCustomers);
router.get("/phone/:phone", getCustomerByPhone);
router.get("/:id", getCustomerById);

module.exports = router;
