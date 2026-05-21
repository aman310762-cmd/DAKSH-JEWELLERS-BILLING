import { useState, useEffect, useMemo } from "react";
import {
  Users, FileText, IndianRupee, TrendingUp, Clock, MapPin,
  ArrowRight, Gem, CalendarDays, Sparkles, Crown, Calendar,
  Download, BarChart3, Activity, ArrowUpRight, Eye,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../api";
import { formatCurrency } from "../billingLogic";
import { downloadInvoicePDF } from "../components/PDFGenerator";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { StatCardSkeleton, TableRowSkeleton } from "../components/ui/skeleton";
import toast from "react-hot-toast";

function AnimatedCounter({ value, prefix = "", suffix = "" }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, "")) || 0;
    if (num === 0) { setDisplayValue(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = num / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= num) { setDisplayValue(num); clearInterval(interval); }
      else setDisplayValue(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className="tabular-nums">
      {prefix}{typeof value === "number" ? displayValue.toLocaleString("en-IN") : formatCurrency(displayValue)}{suffix}
    </span>
  );
}

function StatCard({ label, value, sub, icon: Icon, gradient, delay = 0, trend }) {
  return (
    <Card
      hover
      className="relative overflow-hidden animate-fade-in-up group"
      style={{ animationDelay: `${delay}ms`, opacity: 0, padding: '18px 16px' }}
    >
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium truncate" style={{ lineHeight: '1.5', marginBottom: '6px' }}>
            {label}
          </p>
          <p className="text-sm sm:text-base lg:text-lg font-bold text-white truncate" style={{ lineHeight: '1.3', marginBottom: '4px' }}>
            {typeof value === "string" ? value : <AnimatedCounter value={value} />}
          </p>
          <p className="text-[10px] text-dark-600 truncate" style={{ lineHeight: '1.4' }}>{sub}</p>
        </div>
        <div
          className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}
        >
          <Icon size={16} className="text-white" />
        </div>
      </div>
    </Card>
  );
}

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
        business: { name: "Daksh Jewellers", address: "Ramavtar Market, Near Hill View Garden, Thada (Alwar) Rajasthan", openingHours: "10:00 AM onwards" },
      });
    } finally { setLoading(false); }
  };

  const biz = stats?.business || { name: "Daksh Jewellers", address: "Ramavtar Market, Near Hill View Garden, Thada (Alwar) Rajasthan", openingHours: "10:00 AM onwards" };

  const handleQuickDownload = (inv) => {
    const s = downloadInvoicePDF(inv);
    toast[s ? "success" : "error"](s ? "PDF downloaded!" : "Download failed");
  };

  const todaySales = stats?.todaySales || stats?.todayRevenue || 0;
  const monthlySales = stats?.monthlySales || 0;
  const totalRevenue = stats?.totalRevenue || 0;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div className="rounded-2xl border border-gold-500/10 bg-[rgba(16,16,16,0.88)] p-6 lg:p-8 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04]" />
            <div className="space-y-3">
              <div className="h-7 w-48 rounded bg-white/[0.04]" />
              <div className="h-4 w-64 rounded bg-white/[0.03]" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => <div key={i} className="rounded-2xl border border-gold-500/10 bg-[rgba(16,16,16,0.88)] h-32 animate-pulse" />)}
          </div>
          <div className="lg:col-span-2 rounded-2xl border border-gold-500/10 bg-[rgba(16,16,16,0.88)] p-6 animate-pulse">
            {[...Array(5)].map((_, i) => <TableRowSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== HERO HEADER ===== */}
      <Card className="p-5 lg:p-6 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-gold-700 flex items-center justify-center shrink-0 shadow-lg shadow-gold-500/20">
            <Gem size={24} className="text-dark-900" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className="text-xs text-dark-500 font-medium" style={{ lineHeight: '1.5', marginBottom: '2px' }}>{greeting} 👋</p>
            <h1 className="font-display text-xl lg:text-2xl font-bold text-gradient-gold" style={{ lineHeight: '1.35', marginBottom: '4px' }}>
              {biz.name}
            </h1>
            <p className="text-xs text-dark-500 truncate" style={{ lineHeight: '1.5' }}>
              <MapPin size={11} className="inline text-gold-500/60 mr-1" />
              {biz.address}
              <span className="mx-2">·</span>
              <Clock size={11} className="inline text-gold-500/60 mr-1" />
              {biz.openingHours}
            </p>
          </div>
          <Link to="/create-invoice" className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 self-start shrink-0">
            <Sparkles size={14} /> New Invoice
          </Link>
        </div>
      </Card>

      {/* ===== ANALYTICS STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard
          label="Today's Sales"
          value={formatCurrency(todaySales)}
          sub={`${stats?.todayInvoices || 0} invoices today`}
          icon={TrendingUp}
          gradient="from-emerald-400 to-emerald-600"
          delay={0}
        />
        <StatCard
          label="Monthly Sales"
          value={formatCurrency(monthlySales)}
          sub={`${stats?.monthlyInvoices || 0} this month`}
          icon={Calendar}
          gradient="from-blue-400 to-blue-600"
          delay={80}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={`${stats?.totalInvoices || 0} total invoices`}
          icon={IndianRupee}
          gradient="from-gold-400 to-gold-600"
          delay={160}
        />
        <StatCard
          label="Customers"
          value={stats?.totalCustomers || 0}
          sub="registered customers"
          icon={Users}
          gradient="from-purple-400 to-purple-600"
          delay={240}
        />
      </div>

      {/* ===== MAIN CONTENT ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="space-y-5">
          {/* Top Customer Card */}
          <Card
            hover
            glow
            className="animate-fade-in-up"
            style={{ animationDelay: "100ms", opacity: 0 }}
          >
            <CardContent className="pt-5">
              <CardTitle icon={Crown} className="mb-4">Top Customer</CardTitle>
              {stats?.topCustomer ? (
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0 shadow-lg animate-bounce-in">
                    <Users size={18} className="text-dark-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white truncate">{stats.topCustomer.name}</p>
                    <p className="text-[10px] text-dark-500">{stats.topCustomer.count || 0} invoices</p>
                  </div>
                  <p className="text-sm font-bold text-gold-400 whitespace-nowrap number-ticker">
                    {formatCurrency(stats.topCustomer.total || 0)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-dark-600 py-4 text-center">No customers yet</p>
              )}
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card
            hover
            className="animate-fade-in-up"
            style={{ animationDelay: "180ms", opacity: 0 }}
          >
            <CardContent className="pt-5">
              <CardTitle icon={BarChart3} className="mb-4">Revenue Breakdown</CardTitle>
              <div className="space-y-4">
                {[
                  { label: "Today", value: todaySales, color: "bg-emerald-500", accent: "emerald" },
                  { label: "This Month", value: monthlySales, color: "bg-blue-500", accent: "blue" },
                  { label: "All Time", value: totalRevenue, color: "bg-gold-500", accent: "gold" },
                ].map((row) => (
                  <div key={row.label}>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-dark-400 font-medium">{row.label}</span>
                      <span className="text-white font-semibold tabular-nums">{formatCurrency(row.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-[1200ms] ease-out`}
                        style={{
                          width: totalRevenue > 0 ? `${Math.max(3, Math.min(100, (row.value / totalRevenue) * 100))}%` : '0%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card
            className="animate-fade-in-up"
            style={{ animationDelay: "260ms", opacity: 0 }}
          >
            <CardContent className="pt-5">
              <CardTitle className="mb-3">Quick Actions</CardTitle>
              <div className="space-y-1">
                {[
                  { to: "/create-invoice", icon: FileText, label: "Create Invoice", desc: "Generate new bill" },
                  { to: "/customers", icon: Users, label: "Customers", desc: "Manage customers" },
                  { to: "/invoices", icon: CalendarDays, label: "Invoice History", desc: "View past invoices" },
                ].map((a) => (
                  <Link
                    key={a.to}
                    to={a.to}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-all duration-300 group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-gold-500/15">
                      <a.icon size={15} className="text-gold-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark-200 group-hover:text-gold-400 transition-colors">{a.label}</p>
                      <p className="text-[10px] text-dark-600">{a.desc}</p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-dark-600 group-hover:text-gold-500 transition-all group-hover:translate-x-1.5 opacity-0 group-hover:opacity-100"
                    />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions (right 2/3) */}
        <Card
          className="lg:col-span-2 animate-fade-in-up"
          style={{ animationDelay: "200ms", opacity: 0 }}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-5">
              <CardTitle icon={Activity}>Recent Transactions</CardTitle>
              <Link
                to="/invoices"
                className="text-xs text-gold-500/70 hover:text-gold-400 transition-colors flex items-center gap-1 font-medium"
              >
                View All <ArrowRight size={11} />
              </Link>
            </div>

            {stats?.recentInvoices?.length > 0 ? (
              <div className="space-y-2 stagger-children">
                {stats.recentInvoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.015] hover:bg-white/[0.04] transition-all duration-300 group border border-transparent hover:border-gold-500/10 animate-fade-in-up"
                    style={{ opacity: 0 }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold-500/[0.06] flex items-center justify-center shrink-0 group-hover:bg-gold-500/[0.12] transition-colors">
                      <FileText size={16} className="text-gold-500/60 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-dark-200 truncate group-hover:text-white transition-colors">
                          {inv.customerName}
                        </p>
                        <Badge variant="gold">{inv.invoiceNumber}</Badge>
                      </div>
                      <p className="text-[10px] text-dark-600 mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                        {" · "}{inv.items?.length || 0} items
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <p className="text-sm font-bold text-gold-400 whitespace-nowrap tabular-nums">
                        {formatCurrency(inv.totalAmount)}
                      </p>
                      <button
                        onClick={() => handleQuickDownload(inv)}
                        title="Download PDF"
                        className="p-2 rounded-lg text-dark-600 hover:text-gold-400 hover:bg-gold-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-dark-600 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gold-500/5 flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="opacity-20" />
                </div>
                <p className="text-sm font-medium text-dark-400">No invoices yet</p>
                <p className="text-xs mt-1 opacity-60">Create your first invoice to see analytics</p>
                <Link
                  to="/create-invoice"
                  className="btn-gold px-5 py-2.5 rounded-xl text-xs inline-flex items-center gap-1.5 mt-4"
                >
                  <Sparkles size={12} /> Create Invoice
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
