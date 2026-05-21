import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  BarChart3, TrendingUp, Users, FileText, IndianRupee,
  Calendar, ArrowUpRight, ArrowDownRight, Sparkles,
  Download, Crown, Target, Zap, Clock, Trophy,
} from "lucide-react";
import { getDashboardStats, getMonthlyTrend, getDailyTrend, getAdvancedStats, getInvoices } from "../api";
import { formatCurrency } from "../billingLogic";
import { exportAnalyticsToExcel } from "../utils/exportExcel";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StatCardSkeleton } from "../components/ui/skeleton";
import toast from "react-hot-toast";

const GOLD_COLORS = ["#d4a810", "#b8941a", "#e6c84d", "#a07a0e", "#c9b44f", "#8b6914"];
const CATEGORY_COLORS = { Gold: "#d4a810", Silver: "#9CA3AF", Diamond: "#60A5FA", Other: "#A78BFA" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-xl p-3 border border-gold-500/20 text-xs shadow-2xl">
      <p className="text-gold-400 font-semibold mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-dark-300">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="capitalize">{p.dataKey}:</span>
          <span className="font-bold text-white">
            {p.dataKey === "revenue" ? formatCurrency(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function MiniStatCard({ label, value, sub, icon: Icon, gradient, delay = 0, trend, trendUp }) {
  return (
    <Card hover className="relative overflow-hidden animate-fade-in-up group" style={{ animationDelay: `${delay}ms`, opacity: 0, padding: '18px 16px' }}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${gradient} opacity-[0.04] rounded-bl-full pointer-events-none group-hover:opacity-[0.08] transition-opacity`} />
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium truncate" style={{ lineHeight: '1.5', marginBottom: '6px' }}>
            {label}
          </p>
          <p className="text-base lg:text-lg font-bold text-white truncate" style={{ lineHeight: '1.3', marginBottom: '4px' }}>
            {value}
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] text-dark-600 truncate" style={{ lineHeight: '1.4' }}>{sub}</p>
            {trend !== undefined && trend !== null && (
              <span className={`text-[9px] font-semibold flex items-center gap-0.5 ${trendUp ? 'text-emerald-400' : trend < 0 ? 'text-red-400' : 'text-dark-500'}`}>
                {trendUp ? <ArrowUpRight size={9} /> : trend < 0 ? <ArrowDownRight size={9} /> : null}
                {trend > 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
        </div>
        <div className={`w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
    </Card>
  );
}

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [dailyTrend, setDailyTrend] = useState([]);
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dailyRange, setDailyRange] = useState(7); // 7 or 30
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    getDailyTrend(dailyRange).then(r => setDailyTrend(r.data)).catch(() => []);
  }, [dailyRange]);

  const loadAll = async () => {
    try {
      const [s, m, d, a] = await Promise.all([
        getDashboardStats().then(r => r.data).catch(() => null),
        getMonthlyTrend(6).then(r => r.data).catch(() => []),
        getDailyTrend(7).then(r => r.data).catch(() => []),
        getAdvancedStats().then(r => r.data).catch(() => null),
      ]);
      setStats(s);
      setMonthlyTrend(m);
      setDailyTrend(d);
      setAdvancedStats(a);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      // Fetch all invoices for complete export
      const invoicesRes = await getInvoices();
      const allDailyTrend = await getDailyTrend(30).then(r => r.data).catch(() => []);

      exportAnalyticsToExcel({
        stats,
        dailyTrend: allDailyTrend,
        monthlyTrend,
        advancedStats,
        invoices: invoicesRes.data,
        customers: [],
      });
      toast.success("Excel report downloaded!");
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded bg-white/[0.04] animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 rounded-2xl bg-white/[0.02] animate-pulse" />
          <div className="h-72 rounded-2xl bg-white/[0.02] animate-pulse" />
        </div>
      </div>
    );
  }

  const todaySales = stats?.todaySales || stats?.todayRevenue || 0;
  const monthlySales = stats?.monthlySales || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const weekComp = advancedStats?.weeklyComparison;

  // Pie data for category breakdown
  const categoryData = advancedStats?.categoryBreakdown?.length > 0
    ? advancedStats.categoryBreakdown
    : [{ name: "Gold", revenue: totalRevenue || 1 }];

  // Revenue distribution pie
  const revDistPie = [
    { name: "Today", value: todaySales || 1 },
    { name: "This Month", value: Math.max(0, monthlySales - todaySales) || 1 },
    { name: "Earlier", value: Math.max(0, totalRevenue - monthlySales) || 1 },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>Analytics</h1>
          <p className="text-sm text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>Business performance overview</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="text-xs px-4 py-2.5 rounded-xl bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all flex items-center gap-2 font-medium border border-gold-500/10 hover:border-gold-500/25 disabled:opacity-40"
          >
            {exporting ? (
              <div className="w-4 h-4 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Export to Excel
          </button>
          <Badge variant="gold"><Sparkles size={10} /> Live Data</Badge>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <MiniStatCard
          label="Today's Sales"
          value={formatCurrency(todaySales)}
          sub={`${stats?.todayInvoices || 0} invoices`}
          icon={TrendingUp}
          gradient="from-emerald-400 to-emerald-600"
          delay={0}
        />
        <MiniStatCard
          label="Monthly Sales"
          value={formatCurrency(monthlySales)}
          sub={`${stats?.monthlyInvoices || 0} invoices`}
          icon={Calendar}
          gradient="from-blue-400 to-blue-600"
          delay={80}
        />
        <MiniStatCard
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          sub={`${stats?.totalInvoices || 0} invoices`}
          icon={IndianRupee}
          gradient="from-gold-400 to-gold-600"
          delay={160}
        />
        <MiniStatCard
          label="Customers"
          value={stats?.totalCustomers || 0}
          sub="registered"
          icon={Users}
          gradient="from-purple-400 to-purple-600"
          delay={240}
        />
      </div>

      {/* ===== WEEKLY COMPARISON CARDS ===== */}
      {weekComp && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <Card hover className="p-4 animate-fade-in-up" style={{ animationDelay: "150ms", opacity: 0 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/10 flex items-center justify-center shrink-0">
                <Zap size={16} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium" style={{ marginBottom: '3px' }}>This Week</p>
                <p className="text-sm font-bold text-white">{formatCurrency(weekComp.thisWeek.revenue)}</p>
                <p className="text-[10px] text-dark-600">{weekComp.thisWeek.invoices} invoices</p>
              </div>
            </div>
          </Card>
          <Card hover className="p-4 animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-600/10 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium" style={{ marginBottom: '3px' }}>Last Week</p>
                <p className="text-sm font-bold text-white">{formatCurrency(weekComp.lastWeek.revenue)}</p>
                <p className="text-[10px] text-dark-600">{weekComp.lastWeek.invoices} invoices</p>
              </div>
            </div>
          </Card>
          <Card hover className="p-4 animate-fade-in-up" style={{ animationDelay: "250ms", opacity: 0 }}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${weekComp.changePercent >= 0 ? 'from-emerald-400/20 to-emerald-600/10' : 'from-red-400/20 to-red-600/10'} flex items-center justify-center shrink-0`}>
                {weekComp.changePercent >= 0 ? <ArrowUpRight size={16} className="text-emerald-400" /> : <ArrowDownRight size={16} className="text-red-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium" style={{ marginBottom: '3px' }}>Week Change</p>
                <p className={`text-sm font-bold ${weekComp.changePercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {weekComp.changePercent >= 0 ? '+' : ''}{weekComp.changePercent}%
                </p>
                <p className="text-[10px] text-dark-600">vs last week</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ===== DAILY SALES CHART ===== */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "300ms", opacity: 0 }}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-5">
            <CardTitle icon={BarChart3}>Daily Sales</CardTitle>
            <div className="flex items-center gap-1 bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.06]">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDailyRange(d)}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                    dailyRange === d
                      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/20'
                      : 'text-dark-500 hover:text-dark-300'
                  }`}
                >
                  {d}D
                </button>
              ))}
            </div>
          </div>
          {dailyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyTrend}>
                <defs>
                  <linearGradient id="dailyBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4a810" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#d4a810" stopOpacity={0.3} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey={dailyRange <= 7 ? "day" : "dayOfMonth"}
                  tick={{ fill: "#666", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#555", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="url(#dailyBarGrad)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={dailyRange <= 7 ? 50 : 20}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-56 flex items-center justify-center text-dark-600 text-sm">No daily data yet</div>
          )}
        </CardContent>
      </Card>

      {/* ===== CHARTS ROW: Revenue Trend + Monthly Invoices ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "350ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={TrendingUp} className="mb-5">Revenue Trend (Monthly)</CardTitle>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a810" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#d4a810" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#d4a810" strokeWidth={2.5} fill="url(#goldGrad)" dot={{ r: 4, fill: "#d4a810", strokeWidth: 2, stroke: "#0a0a0a" }} activeDot={{ r: 6, fill: "#d4a810", stroke: "#0a0a0a", strokeWidth: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-dark-600 text-sm">No trend data yet</div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Invoices Bar Chart */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "400ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={BarChart3} className="mb-5">Monthly Invoices</CardTitle>
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#666", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="invoices" fill="#d4a810" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="customers" fill="#8b6914" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-dark-600 text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ===== BOTTOM ROW: Category + Top Customers + Metrics ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Category Breakdown */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "450ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle className="mb-4">Category Breakdown</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="revenue" stroke="none">
                  {categoryData.map((entry, i) => (
                    <Cell key={i} fill={CATEGORY_COLORS[entry.name] || GOLD_COLORS[i % GOLD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-dark-400">
                  <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[d.name] || GOLD_COLORS[i] }} />
                  {d.name}
                  <span className="text-dark-600 ml-0.5">({d.count || 0})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top 5 Customers */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "500ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={Crown} className="mb-4">Top 5 Customers</CardTitle>
            {advancedStats?.top5Customers?.length > 0 ? (
              <div className="space-y-2">
                {advancedStats.top5Customers.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-gold-500/10 transition-all group">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      i === 0 ? 'bg-gold-500/20 text-gold-400' :
                      i === 1 ? 'bg-dark-500/30 text-dark-300' :
                      i === 2 ? 'bg-amber-700/20 text-amber-500' :
                      'bg-white/[0.04] text-dark-500'
                    }`}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-dark-200 truncate">{c.name}</p>
                      <p className="text-[9px] text-dark-600">{c.count} invoices</p>
                    </div>
                    <p className="text-xs font-bold text-gold-400 tabular-nums whitespace-nowrap">{formatCurrency(c.total)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-dark-600 text-center py-8">No customer data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Advanced Metrics */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "550ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={Target} className="mb-4">Key Metrics</CardTitle>
            <div className="space-y-3">
              {[
                {
                  label: "Avg Invoice Value",
                  value: stats?.totalInvoices ? formatCurrency(totalRevenue / stats.totalInvoices) : "₹0",
                  icon: FileText,
                  color: "text-gold-400",
                  bg: "bg-gold-500/10",
                },
                {
                  label: "Avg Daily Revenue",
                  value: formatCurrency(advancedStats?.avgDailyRevenue || 0),
                  icon: TrendingUp,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
                {
                  label: "Best Day Revenue",
                  value: advancedStats?.bestDay ? formatCurrency(advancedStats.bestDay.revenue) : "₹0",
                  sub: advancedStats?.bestDay ? new Date(advancedStats.bestDay.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "",
                  icon: Trophy,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Invoices per Customer",
                  value: stats?.totalCustomers ? (stats.totalInvoices / stats.totalCustomers).toFixed(1) : "0",
                  icon: Users,
                  color: "text-purple-400",
                  bg: "bg-purple-500/10",
                },
                {
                  label: "Today's Invoices",
                  value: stats?.todayInvoices || 0,
                  icon: Calendar,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-gold-500/10 transition-all group">
                  <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                    <m.icon size={15} className={m.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-dark-500">{m.label}</p>
                    <p className="text-sm font-bold text-white">{m.value}</p>
                    {m.sub && <p className="text-[9px] text-dark-600">{m.sub}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== REVENUE DISTRIBUTION ===== */}
      <Card className="animate-fade-in-up" style={{ animationDelay: "600ms", opacity: 0 }}>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Revenue Distribution</CardTitle>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={revDistPie} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                    {revDistPie.map((_, i) => (
                      <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {revDistPie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-dark-400">
                    <div className="w-2 h-2 rounded-full" style={{ background: GOLD_COLORS[i] }} />
                    {d.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 space-y-4">
              {[
                { label: "Today", value: todaySales, color: "bg-emerald-500" },
                { label: "This Month", value: monthlySales, color: "bg-blue-500" },
                { label: "All Time", value: totalRevenue, color: "bg-gold-500" },
              ].map((row) => (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-dark-400 font-medium">{row.label}</span>
                    <span className="text-white font-semibold tabular-nums">{formatCurrency(row.value)}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/[0.04] overflow-hidden">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
