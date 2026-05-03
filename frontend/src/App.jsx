import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import CreateInvoice from "./pages/CreateInvoice";
import Customers from "./pages/Customers";
import InvoiceHistory from "./pages/InvoiceHistory";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-fade-in-up">
      <Routes location={location}>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-invoice"
          element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute>
              <InvoiceHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function AppLayout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {!isLoginPage && <Sidebar />}
      {isLoginPage ? (
        <AnimatedRoutes />
      ) : (
        <main
          className="min-h-screen p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8"
          style={{ marginLeft: "0px" }}
          id="main-content"
        >
          <AnimatedRoutes />
        </main>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#141414",
              color: "#e8e8e8",
              border: "1px solid rgba(212, 168, 16, 0.2)",
              borderRadius: "14px",
              fontSize: "13px",
              padding: "12px 16px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
            },
            success: {
              iconTheme: { primary: "#d4a810", secondary: "#0d0d0d" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#0d0d0d" },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
