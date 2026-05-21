/**
 * In-memory data store fallback when MongoDB is not available.
 * Data persists only during server runtime.
 */

class InMemoryStore {
  constructor() {
    this.customers = [];
    this.invoices = [];
    this.invoiceCount = 0;
  }

  _id() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  // ========== Customer Methods ==========

  createCustomer({ name, phone, address }) {
    const existing = this.customers.find((c) => c.phone === phone);
    if (existing) {
      existing.name = name;
      existing.address = address || existing.address;
      return { customer: existing, isNew: false };
    }
    const customer = {
      _id: this._id(),
      name,
      phone,
      address: address || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.customers.push(customer);
    return { customer, isNew: true };
  }

  getCustomers(search = "") {
    if (!search) return [...this.customers].reverse();
    const q = search.toLowerCase();
    return this.customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) || c.phone.includes(q)
      )
      .reverse();
  }

  getCustomerByPhone(phone) {
    return this.customers.find((c) => c.phone === phone) || null;
  }

  getCustomerById(id) {
    return this.customers.find((c) => c._id === id) || null;
  }

  // ========== Invoice Methods ==========

  createInvoice(data) {
    this.invoiceCount++;
    const year = new Date().getFullYear();
    const invoiceNumber = `DJ-${year}-${this.invoiceCount
      .toString()
      .padStart(4, "0")}`;

    const invoice = {
      _id: this._id(),
      invoiceNumber,
      ...data,
      whatsappSent: false,
      whatsappSentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.invoices.push(invoice);
    return invoice;
  }

  getInvoices(search = "") {
    if (!search) return [...this.invoices].reverse();
    const q = search.toLowerCase();
    return this.invoices
      .filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          inv.customerName.toLowerCase().includes(q) ||
          inv.customerPhone.includes(q)
      )
      .reverse();
  }

  getInvoiceById(id) {
    return this.invoices.find((inv) => inv._id === id) || null;
  }

  updateInvoice(id, updates) {
    const inv = this.invoices.find((inv) => inv._id === id);
    if (inv) {
      Object.assign(inv, updates, { updatedAt: new Date().toISOString() });
    }
    return inv;
  }

  deleteInvoice(id) {
    const index = this.invoices.findIndex((inv) => inv._id === id);
    if (index === -1) return false;
    this.invoices.splice(index, 1);
    return true;
  }

  // ========== Dashboard Stats ==========

  getDashboardStats() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // First day of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const todayInvoices = this.invoices.filter(
      (inv) => new Date(inv.createdAt) >= today
    );

    const monthInvoices = this.invoices.filter(
      (inv) => new Date(inv.createdAt) >= monthStart
    );

    // Top customer by total spend
    const customerSpend = {};
    this.invoices.forEach((inv) => {
      const key = inv.customerPhone || inv.customerName;
      if (!customerSpend[key]) {
        customerSpend[key] = { name: inv.customerName, phone: inv.customerPhone, total: 0, count: 0 };
      }
      customerSpend[key].total += inv.totalAmount || 0;
      customerSpend[key].count++;
    });
    const topCustomer = Object.values(customerSpend).sort((a, b) => b.total - a.total)[0] || null;

    return {
      totalCustomers: this.customers.length,
      totalInvoices: this.invoices.length,
      todayInvoices: todayInvoices.length,
      todaySales: todayInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
      monthlyInvoices: monthInvoices.length,
      monthlySales: monthInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
      totalRevenue: this.invoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
      todayRevenue: todayInvoices.reduce((s, inv) => s + (inv.totalAmount || 0), 0),
      topCustomer,
      recentInvoices: [...this.invoices].reverse().slice(0, 8),
    };
  }
}

const store = new InMemoryStore();
module.exports = store;
