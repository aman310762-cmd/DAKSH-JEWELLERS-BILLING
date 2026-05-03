import { useState, useEffect } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import {
  BarChart3, TrendingUp, Users, FileText, IndianRupee,
  Calendar, ArrowUpRight, ArrowDownRight, Sparkles,
} from "lucide-react";
import { getDashboardStats, getMonthlyTrend } from "../api";
import { formatCurrency } from "../billingLogic";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { StatCardSkeleton } from "../components/ui/skeleton";

const GOLD_COLORS = ["#d4a810", "#b8941a", "#e6c84d", "#a07a0e", "#c9b44f", "#8b6914"];

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

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats().then(r => r.data).catch(() => null),
      getMonthlyTrend(6).then(r => r.data).catch(() => []),
    ]).then(([s, t]) => {
      setStats(s);
      setTrend(t);
    }).finally(() => setLoading(false));
  }, []);

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

  // Build category distribution pie data
  const pieData = [
    { name: "Today", value: todaySales || 1 },
    { name: "This Month", value: Math.max(0, monthlySales - todaySales) || 1 },
    { name: "Earlier", value: Math.max(0, totalRevenue - monthlySales) || 1 },
  ].filter(d => d.value > 0);

  const miniStats = [
    { label: "Today's Sales", value: formatCurrency(todaySales), sub: `${stats?.todayInvoices || 0} invoices`, icon: TrendingUp, color: "from-emerald-400 to-emerald-600" },
    { label: "Monthly Sales", value: formatCurrency(monthlySales), sub: `${stats?.monthlyInvoices || 0} invoices`, icon: Calendar, color: "from-blue-400 to-blue-600" },
    { label: "Total Revenue", value: formatCurrency(totalRevenue), sub: `${stats?.totalInvoices || 0} invoices`, icon: IndianRupee, color: "from-gold-400 to-gold-600" },
    { label: "Customers", value: stats?.totalCustomers || 0, sub: "registered", icon: Users, color: "from-purple-400 to-purple-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">Analytics</h1>
          <p className="text-sm text-dark-500 mt-1">Business performance overview</p>
        </div>
        <Badge variant="gold"><Sparkles size={10} /> Live Data</Badge>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {miniStats.map((s, i) => (
          <Card key={s.label} hover className="p-4 relative overflow-hidden animate-fade-in-up group" style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}>
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${s.color} opacity-[0.04] rounded-bl-full pointer-events-none group-hover:opacity-[0.08] transition-opacity`} />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <p className="text-[10px] text-dark-500 uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-lg font-bold mt-1 text-white">{s.value}</p>
                <p className="text-[10px] text-dark-600 mt-0.5">{s.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                <s.icon size={16} className="text-white" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Revenue Trend */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={TrendingUp} className="mb-5">Revenue Trend</CardTitle>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trend}>
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
        <Card className="animate-fade-in-up" style={{ animationDelay: "280ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={BarChart3} className="mb-5">Monthly Invoices</CardTitle>
            {trend.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={trend}>
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Distribution */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "360ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle className="mb-4">Revenue Distribution</CardTitle>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={GOLD_COLORS[i % GOLD_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[10px] text-dark-400">
                  <div className="w-2 h-2 rounded-full" style={{ background: GOLD_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Customer */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "440ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle icon={Users} className="mb-4">Top Customer</CardTitle>
            {stats?.topCustomer ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center">
                    <Users size={24} className="text-gold-400" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-white">{stats.topCustomer.name}</p>
                    <p className="text-xs text-dark-500">+91 {stats.topCustomer.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-dark-500 uppercase">Total Spent</p>
                    <p className="text-sm font-bold text-gold-400 mt-1">{formatCurrency(stats.topCustomer.total)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <p className="text-[10px] text-dark-500 uppercase">Invoices</p>
                    <p className="text-sm font-bold text-white mt-1">{stats.topCustomer.count}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-dark-600 text-center py-8">No customer data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Metrics */}
        <Card className="animate-fade-in-up" style={{ animationDelay: "520ms", opacity: 0 }}>
          <CardContent className="pt-5">
            <CardTitle className="mb-4">Quick Metrics</CardTitle>
            <div className="space-y-3">
              {[
                { label: "Avg Invoice Value", value: stats?.totalInvoices ? formatCurrency(totalRevenue / stats.totalInvoices) : "₹0", icon: FileText },
                { label: "Invoices per Customer", value: stats?.totalCustomers ? (stats.totalInvoices / stats.totalCustomers).toFixed(1) : "0", icon: Users },
                { label: "Today's Invoices", value: stats?.todayInvoices || 0, icon: Calendar },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="w-9 h-9 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                    <m.icon size={15} className="text-gold-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-dark-500">{m.label}</p>
                    <p className="text-sm font-bold text-white">{m.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
