import * as XLSX from "xlsx";
import { formatCurrency } from "../billingLogic";

/**
 * Export analytics data to a multi-sheet Excel workbook
 */
export function exportAnalyticsToExcel({
  stats,
  dailyTrend,
  monthlyTrend,
  advancedStats,
  invoices,
  customers,
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ["DAKSH JEWELLERS — ANALYTICS REPORT"],
    ["Generated on", new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })],
    [],
    ["METRIC", "VALUE"],
    ["Total Revenue", stats?.totalRevenue || 0],
    ["Monthly Sales", stats?.monthlySales || 0],
    ["Today's Sales", stats?.todaySales || stats?.todayRevenue || 0],
    ["Total Invoices", stats?.totalInvoices || 0],
    ["Today's Invoices", stats?.todayInvoices || 0],
    ["Monthly Invoices", stats?.monthlyInvoices || 0],
    ["Total Customers", stats?.totalCustomers || 0],
    ["Avg Daily Revenue (30d)", advancedStats?.avgDailyRevenue || 0],
    [],
    ["WEEKLY COMPARISON", "THIS WEEK", "LAST WEEK", "CHANGE %"],
    [
      "Revenue",
      advancedStats?.weeklyComparison?.thisWeek?.revenue || 0,
      advancedStats?.weeklyComparison?.lastWeek?.revenue || 0,
      (advancedStats?.weeklyComparison?.changePercent || 0) + "%",
    ],
    [
      "Invoices",
      advancedStats?.weeklyComparison?.thisWeek?.invoices || 0,
      advancedStats?.weeklyComparison?.lastWeek?.invoices || 0,
      "",
    ],
    [],
    ["BEST DAY"],
    ["Date", advancedStats?.bestDay?.date || "N/A"],
    ["Revenue", advancedStats?.bestDay?.revenue || 0],
    ["Invoices", advancedStats?.bestDay?.invoices || 0],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
  ws1["!cols"] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws1, "Summary");

  // Sheet 2: Daily Sales
  if (dailyTrend && dailyTrend.length > 0) {
    const dailyHeader = ["Date", "Day", "Revenue (₹)", "Invoices", "Customers"];
    const dailyRows = dailyTrend.map((d) => [
      d.date,
      d.day,
      d.revenue,
      d.invoices,
      d.customers,
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([dailyHeader, ...dailyRows]);
    ws2["!cols"] = [{ wch: 12 }, { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Daily Sales");
  }

  // Sheet 3: Monthly Trend
  if (monthlyTrend && monthlyTrend.length > 0) {
    const monthlyHeader = ["Month", "Year", "Revenue (₹)", "Invoices", "Customers"];
    const monthlyRows = monthlyTrend.map((m) => [
      m.month,
      m.year,
      m.revenue,
      m.invoices,
      m.customers,
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([monthlyHeader, ...monthlyRows]);
    ws3["!cols"] = [{ wch: 10 }, { wch: 6 }, { wch: 15 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws3, "Monthly Trend");
  }

  // Sheet 4: All Invoices
  if (invoices && invoices.length > 0) {
    const invoiceHeader = ["Invoice #", "Customer Name", "Phone", "Date", "Items", "Subtotal (₹)", "Making (₹)", "GST (₹)", "Total (₹)"];
    const invoiceRows = invoices.map((inv) => [
      inv.invoiceNumber,
      inv.customerName,
      "+91 " + inv.customerPhone,
      new Date(inv.createdAt).toLocaleDateString("en-IN"),
      inv.items?.length || 0,
      inv.subtotal || 0,
      inv.makingCharges || 0,
      inv.gstAmount || 0,
      inv.totalAmount || 0,
    ]);
    const ws4 = XLSX.utils.aoa_to_sheet([invoiceHeader, ...invoiceRows]);
    ws4["!cols"] = [{ wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 12 }, { wch: 6 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws4, "All Invoices");
  }

  // Sheet 5: Top Customers
  if (advancedStats?.top5Customers && advancedStats.top5Customers.length > 0) {
    const custHeader = ["Rank", "Customer Name", "Phone", "Total Spent (₹)", "Invoices"];
    const custRows = advancedStats.top5Customers.map((c, i) => [
      i + 1,
      c.name,
      "+91 " + c.phone,
      c.total,
      c.count,
    ]);
    const ws5 = XLSX.utils.aoa_to_sheet([custHeader, ...custRows]);
    ws5["!cols"] = [{ wch: 6 }, { wch: 20 }, { wch: 16 }, { wch: 16 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws5, "Top Customers");
  }

  // Sheet 6: Category Breakdown
  if (advancedStats?.categoryBreakdown && advancedStats.categoryBreakdown.length > 0) {
    const catHeader = ["Category", "Revenue (₹)", "Items Count"];
    const catRows = advancedStats.categoryBreakdown.map((c) => [
      c.name,
      c.revenue,
      c.count,
    ]);
    const ws6 = XLSX.utils.aoa_to_sheet([catHeader, ...catRows]);
    ws6["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws6, "Categories");
  }

  // Generate and download
  const dateStr = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `Daksh_Jewellers_Analytics_${dateStr}.xlsx`);
}
