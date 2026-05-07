import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser, getProfile, logoutUser, verifyOTP as verifyOTPApi } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem("daksh_token");
    if (token) {
      getProfile()
        .then(({ data }) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem("daksh_token");
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await loginUser({ email, password });
    localStorage.setItem("daksh_token", data.token);
    setUser(data.user);
    return data;
  };

  const loginWithOTP = async (phone, otp) => {
    const { data } = await verifyOTPApi(phone, otp);
    localStorage.setItem("daksh_token", data.token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await registerUser({ name, email, password });
    localStorage.setItem("daksh_token", data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch {
      // Ignore errors — still clear local state
    }
    localStorage.removeItem("daksh_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOTP, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
