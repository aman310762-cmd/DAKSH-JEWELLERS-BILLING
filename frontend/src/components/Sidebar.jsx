import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  Users,
  FileText,
  Menu,
  X,
  Gem,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/create-invoice", icon: FilePlus, label: "Create Invoice" },
  { to: "/customers", icon: Users, label: "Customers" },
  { to: "/invoices", icon: FileText, label: "Invoice History" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
        className={`lg:hidden fixed inset-0 bg-black/70 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col transition-transform duration-300 ease-out
          bg-[#0e0e0e] border-r border-gold-500/10
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="p-5 pb-4 border-b border-gold-500/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 animate-glow">
              <Gem size={22} className="text-dark-900" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-gradient-gold leading-tight">
                Daksh
              </h1>
              <p className="text-[10px] text-gold-400/60 tracking-[0.2em] uppercase mt-0.5">
                Jewellers
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-gold-500/15 to-gold-500/5 text-gold-400 border border-gold-500/20 shadow-lg shadow-gold-500/5"
                    : "text-dark-400 hover:text-gold-300 hover:bg-white/[0.03]"
                }`
              }
            >
              <item.icon size={18} className="transition-transform duration-300 group-hover:scale-110" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight
                size={14}
                className="opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-50 group-hover:translate-x-0"
              />
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gold-500/10">
          <div className="text-center">
            <p className="text-[9px] text-dark-500 uppercase tracking-[0.2em]">
              Daksh Jewellers
            </p>
            <p className="text-[9px] text-dark-600 mt-0.5">
              Thara, Rajasthan
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
