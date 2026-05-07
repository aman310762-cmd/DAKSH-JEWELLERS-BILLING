import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Gem, User, Lock, Eye, EyeOff, LogIn, Shield, Phone, KeyRound, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { forgotPassword } from "../api";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, loginWithOTP } = useAuth();
  const navigate = useNavigate();

  // OTP Recovery state
  const [otpMode, setOtpMode] = useState(false); // false = login, true = OTP recovery
  const [otpStep, setOtpStep] = useState("phone"); // "phone" | "verify"
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!otpPhone || otpPhone.replace(/\D/g, "").length < 10) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    setOtpLoading(true);
    try {
      const { data } = await forgotPassword(otpPhone);
      toast.success(`OTP sent via ${data.method === "console" ? "console (dev mode)" : data.method}`);
      setOtpStep("verify");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }

    setOtpLoading(true);
    try {
      await loginWithOTP(otpPhone, otpCode);
      toast.success("OTP verified! Welcome back, Praveen Ji!");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const resetOTP = () => {
    setOtpMode(false);
    setOtpStep("phone");
    setOtpPhone("");
    setOtpCode("");
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
          <h1 className="font-display text-3xl font-bold text-gradient-gold" style={{ lineHeight: '1.35', marginTop: '20px', marginBottom: '8px' }}>
            Daksh Jewellers
          </h1>
          <p className="text-sm text-dark-500" style={{ lineHeight: '1.5' }}>Premium Billing System</p>
        </div>

        {/* Login Card */}
        <div className="glass rounded-2xl animate-scale-in" style={{ padding: '32px' }}>
          {!otpMode ? (
            /* ═══════════ NORMAL LOGIN ═══════════ */
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto" style={{ marginBottom: '12px' }}>
                  <Shield size={18} className="text-gold-400" />
                </div>
                <h2 className="text-lg font-bold text-white" style={{ lineHeight: '1.4', marginBottom: '4px' }}>Admin Login</h2>
                <p className="text-xs text-dark-500" style={{ lineHeight: '1.5' }}>Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="text-xs text-dark-400 font-medium" style={{ display: 'block', marginBottom: '8px', lineHeight: '1.5' }}>
                    USERNAME <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      id="login-username"
                      type="text"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="Enter username"
                      className="input-gold w-full rounded-xl text-sm"
                      style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-dark-400 font-medium" style={{ display: 'block', marginBottom: '8px', lineHeight: '1.5' }}>
                    PASSWORD <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="input-gold w-full rounded-xl text-sm"
                      style={{ paddingLeft: '40px', paddingRight: '48px', paddingTop: '12px', paddingBottom: '12px' }}
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
                  id="login-submit"
                  disabled={loading}
                  className="w-full btn-gold rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ paddingTop: '14px', paddingBottom: '14px', marginTop: '4px' }}
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

              {/* Forgot Password Link */}
              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  id="forgot-password-link"
                  onClick={() => setOtpMode(true)}
                  className="text-xs text-gold-500/70 hover:text-gold-400 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '3px' }}
                >
                  Forgot Password? Login with OTP
                </button>
              </div>
            </>
          ) : otpStep === "phone" ? (
            /* ═══════════ OTP: ENTER PHONE ═══════════ */
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto" style={{ marginBottom: '12px' }}>
                  <Phone size={18} className="text-gold-400" />
                </div>
                <h2 className="text-lg font-bold text-white" style={{ lineHeight: '1.4', marginBottom: '4px' }}>OTP Recovery</h2>
                <p className="text-xs text-dark-500" style={{ lineHeight: '1.5' }}>Enter the owner's registered phone number</p>
              </div>

              <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="text-xs text-dark-400 font-medium" style={{ display: 'block', marginBottom: '8px', lineHeight: '1.5' }}>
                    PHONE NUMBER <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      id="otp-phone"
                      type="tel"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="Enter 10-digit number"
                      className="input-gold w-full rounded-xl text-sm"
                      style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px' }}
                      maxLength={10}
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="send-otp-btn"
                  disabled={otpLoading}
                  className="w-full btn-gold rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ paddingTop: '14px', paddingBottom: '14px' }}
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={16} />
                      Send OTP
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <button
                  onClick={resetOTP}
                  className="text-xs text-dark-500 hover:text-gold-400 transition-colors flex items-center gap-1.5 mx-auto"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <ArrowLeft size={12} />
                  Back to Login
                </button>
              </div>
            </>
          ) : (
            /* ═══════════ OTP: VERIFY CODE ═══════════ */
            <>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center mx-auto" style={{ marginBottom: '12px' }}>
                  <KeyRound size={18} className="text-gold-400" />
                </div>
                <h2 className="text-lg font-bold text-white" style={{ lineHeight: '1.4', marginBottom: '4px' }}>Enter OTP</h2>
                <p className="text-xs text-dark-500" style={{ lineHeight: '1.5' }}>
                  OTP sent to +91 {otpPhone.slice(0, 2)}****{otpPhone.slice(-2)}
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label className="text-xs text-dark-400 font-medium" style={{ display: 'block', marginBottom: '8px', lineHeight: '1.5' }}>
                    6-DIGIT OTP <span className="text-gold-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                    <input
                      id="otp-code"
                      type="text"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="Enter 6-digit OTP"
                      className="input-gold w-full rounded-xl text-sm"
                      style={{ paddingLeft: '40px', paddingRight: '16px', paddingTop: '12px', paddingBottom: '12px', letterSpacing: '4px', fontFamily: 'monospace' }}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-dark-600" style={{ marginTop: '8px' }}>
                    OTP expires in 5 minutes. Max 5 attempts.
                  </p>
                </div>

                <button
                  type="submit"
                  id="verify-otp-btn"
                  disabled={otpLoading}
                  className="w-full btn-gold rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                  style={{ paddingTop: '14px', paddingBottom: '14px' }}
                >
                  {otpLoading ? (
                    <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn size={16} />
                      Verify & Login
                    </>
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <button
                  onClick={() => setOtpStep("phone")}
                  className="text-xs text-dark-500 hover:text-gold-400 transition-colors"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Resend OTP
                </button>
                <button
                  onClick={resetOTP}
                  className="text-xs text-dark-500 hover:text-gold-400 transition-colors flex items-center gap-1"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <ArrowLeft size={12} />
                  Back to Login
                </button>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-[10px] text-dark-600">Daksh Jewellers · Thada, Rajasthan</p>
          <p className="text-[9px] text-dark-700 mt-1">Proprietor: Praveen Kumar · 9896424648</p>
        </div>
      </div>
    </div>
  );
}
