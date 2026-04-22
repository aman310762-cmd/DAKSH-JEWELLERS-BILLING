import { useState, useEffect } from "react";
import {
  Users, FileText, IndianRupee, TrendingUp, Clock, MapPin,
  ArrowRight, Gem, CalendarDays, Sparkles, Crown, Calendar,
  Download, BarChart3, PieChart, Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api";
import { formatCurrency } from "../billingLogic";
import { downloadInvoicePDF } from "../components/PDFGenerator";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const { data } = await getDashboardStats();
      setStats(data);
    } catch {
      setStats({
        totalCustomers: 0, totalInvoices: 0, todayInvoices: 0,
        todaySales: 0, monthlySales: 0, monthlyInvoices: 0,
        totalRevenue: 0, todayRevenue: 0, topCustomer: null,
        recentInvoices: [],
        business: { name: "Daksh Jewellers", address: "Near Trehan Society, Bhiwadi, Thara, Rajasthan 301019", openingHours: "10:00 AM onwards" },
      });
    } finally { setLoading(false); }
  };

  const biz = stats?.business || { name: "Daksh Jewellers", address: "Near Trehan Society, Bhiwadi, Thara, Rajasthan 301019", openingHours: "10:00 AM onwards" };

  const handleQuickDownload = (inv) => {
    const s = downloadInvoicePDF(inv);
    toast[s ? "success" : "error"](s ? "PDF downloaded!" : "Download failed");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-[3px] border-gold-500/20 border-t-gold-500 rounded-full animate-spin mx-auto" />
          <p className="text-dark-500 text-xs mt-5 animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const todaySales = stats?.todaySales || stats?.todayRevenue || 0;
  const monthlySales = stats?.monthlySales || 0;
  const totalRevenue = stats?.totalRevenue || 0;

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <div className="glass rounded-2xl p-6 lg:p-8 relative overflow-hidden animate-fade-in-up">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-gold-500/6 to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-52 h-52 bg-gradient-to-tr from-gold-500/4 to-transparent rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-xl shadow-gold-500/20 animate-glow">
            <Gem size={28} className="text-dark-900" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-gradient-gold animate-text-reveal">{biz.name}</h1>
            <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-dark-400">
              <span className="flex items-center gap-1.5"><MapPin size={13} className="text-gold-500/70" />{biz.address}</span>
              <span className="flex items-center gap-1.5"><Clock size={13} className="text-gold-500/70" />{biz.openingHours}</span>
            </div>
          </div>
          <Link to="/create-invoice" className="btn-gold px-6 py-3 rounded-xl text-sm flex items-center gap-2 self-start shrink-0">
            <Sparkles size={15} /> New Invoice
          </Link>
        </div>
      </div>

      {/* ===== ANALYTICS STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 stagger-children">
        {[
          { label: "Today's Sales", value: formatCurrency(todaySales), sub: `${stats?.todayInvoices || 0} invoices today`, icon: TrendingUp, gradient: "from-emerald-400 to-emerald-600", accent: "emerald" },
          { label: "Monthly Sales", value: formatCurrency(monthlySales), sub: `${stats?.monthlyInvoices || 0} this month`, icon: Calendar, gradient: "from-blue-400 to-blue-600", accent: "blue" },
          { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${stats?.totalInvoices || 0} total invoices`, icon: IndianRupee, gradient: "from-gold-400 to-gold-600", accent: "gold" },
          { label: "Customers", value: stats?.totalCustomers || 0, sub: "registered customers", icon: Users, gradient: "from-purple-400 to-purple-600", accent: "purple" },
        ].map((card, i) => (
          <div key={i} className="glass rounded-2xl p-4 lg:p-5 card-hover stat-sparkle animate-fade-in-up" style={{ opacity: 0 }}>
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] lg:text-xs text-dark-500 uppercase tracking-wider font-medium">{card.label}</p>
                <p className="text-lg lg:text-2xl font-bold mt-1.5 text-white truncate number-ticker">{card.value}</p>
                <p className="text-[10px] text-dark-600 mt-1">{card.sub}</p>
              </div>
              <div className={`w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shrink-0 shadow-lg animate-float`}
                   style={{ animationDelay: `${i * 200}ms` }}>
                <card.icon size={18} className="text-white" />
              </div>
            </div>
            {/* Mini progress bar */}
            {typeof card.value === 'string' && (
              <div className="mt-3 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <div className="progress-fill h-full rounded-full" style={{ width: todaySales > 0 ? '75%' : '0%' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== ANALYTICS ROW: Top Customer + Revenue Overview ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Top Customer Card */}
          <div className="glass rounded-2xl p-5 animate-fade-in-up card-hover animate-border-glow" style={{ animationDelay: "100ms", opacity: 0 }}>
            <h2 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <Crown size={13} className="text-gold-400 animate-float" /> Top Customer
            </h2>
            {stats?.topCustomer ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-lg animate-bounce-in">
                  <Users size={18} className="text-dark-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{stats.topCustomer.name}</p>
                  <p className="text-[10px] text-dark-500">{stats.topCustomer.count || 0} invoices</p>
                </div>
                <p className="text-sm font-bold text-gold-400 whitespace-nowrap number-ticker">{formatCurrency(stats.topCustomer.total || 0)}</p>
              </div>
            ) : (
              <p className="text-xs text-dark-600 py-4 text-center">No customers yet</p>
            )}
          </div>

          {/* Revenue Breakdown */}
          <div className="glass rounded-2xl p-5 animate-fade-in-up card-hover" style={{ animationDelay: "180ms", opacity: 0 }}>
            <h2 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={13} className="text-gold-400" /> Revenue Breakdown
            </h2>
            <div className="space-y-3">
              {[
                { label: "Today", value: todaySales, color: "bg-emerald-500" },
                { label: "This Month", value: monthlySales, color: "bg-blue-500" },
                { label: "All Time", value: totalRevenue, color: "bg-gold-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-dark-400">{row.label}</span>
                    <span className="text-white font-medium number-ticker">{formatCurrency(row.value)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className={`h-full rounded-full ${row.color} transition-all duration-1000`}
                      style={{ width: totalRevenue > 0 ? `${Math.min(100, (row.value / totalRevenue) * 100)}%` : '0%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass rounded-2xl p-5 animate-fade-in-up" style={{ animationDelay: "260ms", opacity: 0 }}>
            <h2 className="text-xs font-semibold text-white mb-3 uppercase tracking-wider">Quick Actions</h2>
            <div className="space-y-1">
              {[
                { to: "/create-invoice", icon: FileText, label: "Create Invoice", desc: "Generate new bill" },
                { to: "/customers", icon: Users, label: "Customers", desc: "Manage customers" },
                { to: "/invoices", icon: CalendarDays, label: "Invoice History", desc: "View past invoices" },
              ].map((a) => (
                <Link key={a.to} to={a.to} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group">
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <a.icon size={14} className="text-gold-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-dark-200 group-hover:text-gold-400 transition-colors">{a.label}</p>
                    <p className="text-[10px] text-dark-600">{a.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-dark-600 group-hover:text-gold-500 transition-all group-hover:translate-x-1.5 opacity-0 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions (right 2/3) */}
        <div className="glass rounded-2xl p-6 lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity size={13} className="text-gold-400" /> Recent Transactions
            </h2>
            <Link to="/invoices" className="text-xs text-gold-500/70 hover:text-gold-400 transition-colors flex items-center gap-1">
              View All <ArrowRight size={11} />
            </Link>
          </div>

          {stats?.recentInvoices?.length > 0 ? (
            <div className="space-y-2 stagger-children">
              {stats.recentInvoices.map((inv) => (
                <div key={inv._id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] transition-all duration-300 group animate-fade-in-up border border-transparent hover:border-gold-500/10" style={{ opacity: 0 }}>
                  <div className="w-9 h-9 rounded-lg bg-gold-500/8 flex items-center justify-center shrink-0 group-hover:bg-gold-500/15 transition-colors">
                    <FileText size={15} className="text-gold-500/60 group-hover:text-gold-400 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-dark-200 truncate group-hover:text-white transition-colors">{inv.customerName}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 font-medium">{inv.invoiceNumber}</span>
                    </div>
                    <p className="text-[10px] text-dark-600">
                      {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {" · "}{inv.items?.length || 0} items
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <p className="text-sm font-bold text-gold-400 whitespace-nowrap">{formatCurrency(inv.totalAmount)}</p>
                    <button onClick={() => handleQuickDownload(inv)} title="Download PDF"
                      className="p-1.5 rounded-lg text-dark-600 hover:text-gold-400 hover:bg-gold-500/10 transition-all opacity-0 group-hover:opacity-100">
                      <Download size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-dark-600 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-gold-500/5 flex items-center justify-center mx-auto mb-4">
                <FileText size={28} className="opacity-20" />
              </div>
              <p className="text-sm font-medium">No invoices yet</p>
              <p className="text-xs mt-1 opacity-60">Create your first invoice to see analytics</p>
              <Link to="/create-invoice" className="btn-gold px-5 py-2 rounded-lg text-xs inline-flex items-center gap-1.5 mt-4">
                <Sparkles size={12} /> Create Invoice
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
