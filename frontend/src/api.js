import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000, // 30s timeout for slow Render cold starts
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("daksh_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect
      const currentPath = window.location.pathname;
      if (currentPath !== "/login") {
        localStorage.removeItem("daksh_token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const loginUser = (data) => api.post("/auth/login", data);
export const registerUser = (data) => api.post("/auth/register", data);
export const logoutUser = () => api.post("/auth/logout");
export const getProfile = () => api.get("/auth/me");

// OTP Recovery APIs
export const forgotPassword = (phone) => api.post("/auth/forgot-password", { phone });
export const verifyOTP = (phone, otp) => api.post("/auth/verify-otp", { phone, otp });

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
export const getMonthlyTrend = (months = 6) => api.get(`/invoice/trend?months=${months}`);
export const getLiveRates = () => api.get("/invoice/rates");

// Health Check
export const getHealthStatus = () => api.get("/health");

export default api;
