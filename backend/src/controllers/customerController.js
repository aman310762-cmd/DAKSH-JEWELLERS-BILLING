const Customer = require("../models/Customer");
const { isInMemory } = require("../config/db");
const store = require("../utils/inMemoryStore");

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and phone are required" });
    }

    // Validate phone: must be 10 digits
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return res.status(400).json({ error: "Phone must be 10 digits" });
    }

    if (isInMemory()) {
      const { customer, isNew } = store.createCustomer({ name, phone: cleanPhone, address });
      return res.status(isNew ? 201 : 200).json({
        message: isNew ? "Customer created" : "Customer updated",
        customer,
      });
    }

    let customer = await Customer.findOne({ phone: cleanPhone });
    if (customer) {
      customer.name = name;
      customer.address = address || customer.address;
      await customer.save();
      return res.status(200).json({ message: "Customer updated", customer });
    }

    customer = new Customer({ name, phone: cleanPhone, address });
    await customer.save();
    res.status(201).json({ message: "Customer created", customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all customers (with search)
exports.getCustomers = async (req, res) => {
  try {
    const { search } = req.query;

    if (isInMemory()) {
      return res.json(store.getCustomers(search || ""));
    }

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { phone: { $regex: search, $options: "i" } },
        ],
      };
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    if (isInMemory()) {
      const customer = store.getCustomerById(req.params.id);
      if (!customer) return res.status(404).json({ error: "Customer not found" });
      return res.json(customer);
    }

    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ error: "Customer not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lookup customer by phone number (for auto-fill)
exports.getCustomerByPhone = async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\D/g, "").slice(-10);
    if (phone.length !== 10) {
      return res.status(400).json({ error: "Invalid phone" });
    }

    if (isInMemory()) {
      const customer = store.getCustomerByPhone(phone);
      if (!customer) return res.status(404).json({ error: "Not found" });
      return res.json(customer);
    }

    const customer = await Customer.findOne({ phone });
    if (!customer) return res.status(404).json({ error: "Not found" });
    res.json(customer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
