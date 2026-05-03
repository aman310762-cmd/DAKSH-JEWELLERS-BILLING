import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gem, User, Lock, Eye, EyeOff, LogIn, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error("Username and password are required");
      return;
    }

    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success("Welcome back, Praveen Ji!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 login-bg relative overflow-hidden">
      {/* Soft background gradients — non-overlapping */}
      <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] bg-gold-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-200px] right-[-100px] w-[400px] h-[400px] bg-gold-500/[0.02] rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-[400px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-10 animate-fade-in-down">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center mx-auto shadow-2xl shadow-gold-500/20 relative">
            <Gem size={36} className="text-dark-900" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gradient-gold mt-6">
            Daksh Jewellers
          </h1>
          <p className="text-sm text-dark-500 mt-2">Premium Billing System</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl p-8 animate-scale-in">
          <div className="text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto mb-3">
              <Shield size={18} className="text-gold-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Admin Login</h2>
            <p className="text-xs text-dark-500 mt-1">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                USERNAME <span className="text-gold-500">*</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Enter username"
                  className="input-gold w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                PASSWORD <span className="text-gold-500">*</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  className="input-gold w-full pl-10 pr-12 py-3 rounded-xl text-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-gold-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-gold py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] text-dark-600">Daksh Jewellers · Thada, Rajasthan</p>
          <p className="text-[9px] text-dark-700 mt-1">Proprietor: Praveen Kumar · 9896424648</p>
        </div>
      </div>
    </div>
  );
}
