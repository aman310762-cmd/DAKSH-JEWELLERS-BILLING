import axios from "axios";

const api = axios.create({
  baseURL: "https://daksh-jewellers-billing.onrender.com/api",
  headers: { "Content-Type": "application/json" },
});

// Customer APIs
export const createCustomer = (data) => api.post("/customer", data);
export const getCustomers = (search = "") =>
  api.get(`/customer${search ? `?search=${search}` : ""}`);
export const getCustomerById = (id) => api.get(`/customer/${id}`);
export const getCustomerByPhone = (phone) => api.get(`/customer/phone/${phone}`);

// Invoice APIs
export const createInvoice = (data) => api.post("/invoice", data);
export const getInvoices = (params = {}) => api.get("/invoice", { params });
export const getInvoiceById = (id) => api.get(`/invoice/${id}`);
export const sendWhatsApp = (id) => api.post(`/invoice/${id}/whatsapp`);

// Dashboard
export const getDashboardStats = () => api.get("/invoice/dashboard");
export const getBusinessConfig = () => api.get("/invoice/business");

export default api;
