import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "#060606" }}>
        <div className="text-center">
          <div className="w-16 h-16 border-[3px] border-gold-500/20 border-t-gold-500 rounded-full animate-spin mx-auto" />
          <p className="text-dark-500 text-xs mt-5 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
