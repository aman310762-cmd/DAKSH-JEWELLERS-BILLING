import { useState, useEffect } from "react";
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setSidebarCollapsed(document.body.classList.contains("sidebar-collapsed"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Track viewport size
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mainMarginLeft = isLoginPage ? 0 : isDesktop ? (sidebarCollapsed ? 80 : 268) : 0;

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {!isLoginPage && <Sidebar />}
      {isLoginPage ? (
        <AnimatedRoutes />
      ) : (
        <main
          className="min-h-screen"
          id="main-content"
          style={{
            marginLeft: `${mainMarginLeft}px`,
            padding: isDesktop ? '32px' : '16px',
            paddingTop: isDesktop ? '32px' : '64px',
            transition: 'margin-left 0.3s ease',
          }}
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
