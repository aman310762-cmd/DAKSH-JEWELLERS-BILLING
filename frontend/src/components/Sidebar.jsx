import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  Users,
  FileText,
  BarChart3,
  Menu,
  X,
  Gem,
  ChevronRight,
  ChevronLeft,
  Zap,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", description: "Overview & analytics" },
  { to: "/create-invoice", icon: FilePlus, label: "Create Invoice", description: "Generate new bill" },
  { to: "/customers", icon: Users, label: "Customers", description: "Manage contacts" },
  { to: "/invoices", icon: FileText, label: "Invoice History", description: "Past transactions" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", description: "Charts & insights" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("daksh-theme");
    return saved ? saved === "dark" : true;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Sync collapsed state with body class for CSS layout offset
  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
    return () => document.body.classList.remove("sidebar-collapsed");
  }, [isCollapsed]);

  // Theme toggle
  useEffect(() => {
    document.body.classList.toggle("light-mode", !isDark);
    localStorage.setItem("daksh-theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const sidebarWidth = isCollapsed ? "w-[72px]" : "w-[260px]";

  return (
    <>
      {/* Mobile toggle button */}
      <button
        id="sidebar-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2.5 rounded-xl glass text-gold-400 hover:text-gold-300 transition-colors"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Backdrop overlay for mobile */}
      <div
        className={cn(
          "lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        id="sidebar"
        className={cn(
          "fixed top-0 left-0 h-full z-50 flex flex-col transition-all duration-300 ease-out",
          "bg-[#080808] border-r border-gold-500/[0.07]",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarWidth
        )}
      >
        {/* Logo Section */}
        <div className={cn("p-5 pb-4 border-b border-gold-500/[0.07]", isCollapsed && "px-3")}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20 animate-glow shrink-0 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <Gem size={20} className="text-dark-900 relative z-10" />
            </div>
            {!isCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-display text-xl font-bold text-gradient-gold" style={{ lineHeight: '1.35', marginBottom: '2px' }}>
                  Daksh
                </h1>
                <p className="text-[9px] text-gold-400/50 tracking-[0.25em] uppercase" style={{ lineHeight: '1.3' }}>
                  Jewellers
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn("flex-1 py-4 px-2 space-y-1 overflow-y-auto", isCollapsed && "px-1.5")}>
          {!isCollapsed && (
            <p className="text-[9px] text-dark-600 uppercase tracking-[0.2em] px-3 mb-2 font-medium">
              Menu
            </p>
          )}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "group flex items-center rounded-xl transition-all duration-300 relative",
                  isCollapsed ? "justify-center p-3" : "gap-3 px-3 py-2.5",
                  isActive
                    ? "bg-gradient-to-r from-gold-500/15 to-gold-500/5 text-gold-400"
                    : "text-dark-400 hover:text-gold-300 hover:bg-white/[0.03]"
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b from-gold-400 to-gold-600 shadow-[0_0_8px_rgba(212,168,16,0.4)]" />
                  )}
                  <div className={cn(
                    "flex items-center justify-center rounded-lg transition-all duration-300",
                    isCollapsed ? "w-8 h-8" : "w-8 h-8",
                    isActive ? "bg-gold-500/10" : "group-hover:bg-gold-500/5"
                  )}>
                    <item.icon
                      size={17}
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "text-gold-400" : "group-hover:scale-110"
                      )}
                    />
                  </div>
                  {!isCollapsed && (
                    <>
                      <div className="flex-1 min-w-0">
                        <span className="text-[13px] font-medium block">{item.label}</span>
                        <span className="text-[9px] text-dark-600 block">{item.description}</span>
                      </div>
                      <ChevronRight
                        size={13}
                        className={cn(
                          "transition-all duration-300 shrink-0",
                          isActive
                            ? "opacity-60 text-gold-400"
                            : "opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0"
                        )}
                      />
                    </>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Theme toggle + Collapse toggle (desktop only) */}
        <div className="hidden lg:flex items-center gap-1 px-3 pb-2">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-dark-500 hover:text-gold-400 hover:bg-white/[0.03] transition-all text-xs flex-1"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
            {!isCollapsed && <span className="text-[10px]">{isDark ? "Light" : "Dark"}</span>}
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-dark-500 hover:text-gold-400 hover:bg-white/[0.03] transition-all text-xs flex-1"
          >
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!isCollapsed && <span className="text-[10px]">Collapse</span>}
          </button>
        </div>

        {/* Footer */}
        <div className={cn("p-4 border-t border-gold-500/[0.07] space-y-2", isCollapsed && "px-2")}>
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-gradient-to-r from-gold-500/[0.04] to-transparent">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500/20 to-gold-600/10 flex items-center justify-center shrink-0">
                  <Zap size={13} className="text-gold-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-dark-300 font-medium truncate">{user?.name || "Admin"}</p>
                  <p className="text-[9px] text-dark-600 truncate">{user?.email || "Daksh Jewellers"}</p>
                </div>
              </div>
              <button
                onClick={() => { logout(); navigate("/login"); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/5 transition-all text-[11px]"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
              {/* Mobile theme toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-dark-500 hover:text-gold-400 hover:bg-white/[0.03] transition-all text-[11px] lg:hidden"
              >
                {isDark ? <Sun size={13} /> : <Moon size={13} />}
                <span>{isDark ? "Light Mode" : "Dark Mode"}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => { logout(); navigate("/login"); }}
              className="w-full flex justify-center p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/5 transition-all"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
