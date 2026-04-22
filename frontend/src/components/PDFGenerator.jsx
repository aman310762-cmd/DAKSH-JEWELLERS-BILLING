import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatCurrency, PURITY_LABELS } from "../billingLogic";

const BIZ = {
  name: "Daksh Jewellers",
  tagline: "FIND THE PERFECT ONE FOR YOU",
  address: "Near Trehan Society, Bhiwadi, Thara, Rajasthan 301019",
};

/**
 * Draw a diamond icon shape using PDF lines
 */
function drawDiamondIcon(doc, cx, cy, size) {
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.6);
  // Diamond outline
  const s = size;
  doc.line(cx, cy - s, cx + s * 0.9, cy - s * 0.1); // top to right
  doc.line(cx + s * 0.9, cy - s * 0.1, cx + s * 0.5, cy + s);  // right to bottom-right
  doc.line(cx + s * 0.5, cy + s, cx, cy + s * 0.4);             // bottom-right to bottom
  doc.line(cx, cy + s * 0.4, cx - s * 0.5, cy + s);             // bottom to bottom-left
  doc.line(cx - s * 0.5, cy + s, cx - s * 0.9, cy - s * 0.1);  // bottom-left to left
  doc.line(cx - s * 0.9, cy - s * 0.1, cx, cy - s);             // left to top
  // Inner facet lines
  doc.line(cx - s * 0.5, cy - s * 0.1, cx + s * 0.5, cy - s * 0.1); // horizontal
  doc.line(cx - s * 0.5, cy - s * 0.1, cx, cy + s * 0.4);
  doc.line(cx + s * 0.5, cy - s * 0.1, cx, cy + s * 0.4);
}

/**
 * Generate elegant cream-styled jewellery invoice PDF
 * Inspired by the clean W.K Diamond aesthetic
 */
export function generateInvoicePDF(invoice) {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = doc.internal.pageSize.getWidth();   // 210
  const ph = doc.internal.pageSize.getHeight();   // 297
  const m = 18; // margin

  // ===== CREAM BACKGROUND =====
  doc.setFillColor(245, 241, 230); // elegant warm cream
  doc.rect(0, 0, pw, ph, "F");

  // ===== TOP BORDER ACCENT =====
  doc.setFillColor(200, 190, 168); // muted gold/taupe border
  doc.rect(0, 0, pw, 4, "F");

  // ===== HEADER: Business name (left) + Invoice info (right) =====
  let y = 18;

  // Diamond icon
  drawDiamondIcon(doc, m + 5, y + 2, 5);

  // Business Name
  doc.setTextColor(45, 40, 35);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(BIZ.name.toUpperCase(), m + 14, y + 1);

  // Tagline
  doc.setTextColor(140, 130, 115);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(BIZ.tagline, m + 14, y + 7);

  // Right side: Invoice details
  const rx = pw - m;
  doc.setTextColor(100, 90, 80);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");

  const createdDate = new Date(invoice.createdAt);
  const dateStr = createdDate.toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric"
  });
  const timeStr = createdDate.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", hour12: true
  });

  doc.text(`Invoice No. ${invoice.invoiceNumber || "—"}`, rx, y - 2, { align: "right" });
  doc.text(dateStr, rx, y + 3.5, { align: "right" });
  doc.text(timeStr, rx, y + 9, { align: "right" });
  doc.text("Thara, Rajasthan", rx, y + 14.5, { align: "right" });

  // ===== DIVIDER LINE =====
  y = 42;
  doc.setDrawColor(180, 170, 155);
  doc.setLineWidth(0.4);
  doc.line(m, y, pw - m, y);

  // ===== TABLE HEADER =====
  y += 6;

  // Column positions
  const cols = {
    desc: m + 2,
    weight: 95,
    purity: 115,
    rate: 145,
    total: pw - m - 2,
  };

  // Header row
  doc.setTextColor(60, 55, 45);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("DESCRIPTION", cols.desc, y);
  doc.text("WEIGHT", cols.weight, y, { align: "center" });
  doc.text("PURITY", cols.purity, y, { align: "center" });
  doc.text("RATE", cols.rate, y, { align: "right" });
  doc.text("TOTAL", cols.total, y, { align: "right" });

  // Header underline
  y += 3;
  doc.setDrawColor(160, 150, 135);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);

  // ===== CUSTOMER INFO (left side, alongside items) =====
  y += 10;
  const customerY = y;

  // Customer block
  doc.setTextColor(120, 110, 100);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("INVOICE TO", m + 2, customerY);

  doc.setTextColor(45, 40, 35);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customerName || "—", m + 2, customerY + 7);

  doc.setTextColor(100, 90, 80);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(`+91 ${invoice.customerPhone || "—"}`, m + 2, customerY + 13);

  if (invoice.customerAddress) {
    const addrLines = doc.splitTextToSize(invoice.customerAddress, 60);
    doc.text(addrLines, m + 2, customerY + 18);
  }

  // ===== ITEM ROWS =====
  let itemY = customerY;

  invoice.items.forEach((item, i) => {
    const rowY = itemY + (i * 18);
    const purityLabel = PURITY_LABELS[item.purity] || item.purity;

    // Item name + code
    doc.setTextColor(50, 45, 40);
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "normal");
    const itemDesc = item.code ? `${item.name} (${item.code})` : item.name;
    doc.text(itemDesc, cols.weight - 22, rowY);

    // Weight
    doc.setFontSize(9);
    doc.setTextColor(70, 65, 55);
    doc.text(`${item.weight}g`, cols.weight, rowY, { align: "center" });

    // Purity
    doc.text(purityLabel, cols.purity, rowY, { align: "center" });

    // Rate
    doc.text(formatCurrency(item.ratePerGram), cols.rate, rowY, { align: "right" });

    // Total
    doc.setFont("helvetica", "bold");
    doc.setTextColor(45, 40, 35);
    doc.text(formatCurrency(item.adjustedPrice), cols.total, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  // Move Y past items
  const itemsEndY = itemY + (invoice.items.length * 18) + 8;
  y = Math.max(itemsEndY, customerY + 40);

  // ===== BOTTOM DIVIDER =====
  doc.setDrawColor(160, 150, 135);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);

  // ===== TOTALS SECTION =====
  y += 10;
  const labelX = 115;
  const valX = pw - m - 2;

  const drawTotal = (label, value, yy, bold = false, large = false) => {
    doc.setFontSize(large ? 11 : 9);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(bold ? 45 : 90, bold ? 40 : 85, bold ? 35 : 75);
    doc.text(label, labelX, yy);
    doc.setTextColor(45, 40, 35);
    doc.text(value, valX, yy, { align: "right" });
  };

  drawTotal("METAL VALUE:", formatCurrency(invoice.subtotal), y);
  drawTotal("MAKING CHARGES:", formatCurrency(invoice.makingCharges), y + 8);
  drawTotal(`GST (${invoice.gstRate || 3}%):`, formatCurrency(invoice.gstAmount), y + 16);

  // Total line
  y += 24;
  doc.setDrawColor(180, 170, 155);
  doc.setLineWidth(0.3);
  doc.line(labelX - 5, y, valX + 2, y);

  y += 8;
  drawTotal("AMOUNT:", formatCurrency(invoice.totalAmount), y, true, true);

  // ===== FOOTER SECTION =====
  // Payment detail box area
  const footerY = ph - 55;

  doc.setDrawColor(200, 190, 168);
  doc.setLineWidth(0.3);
  doc.line(m, footerY, pw - m, footerY);

  // Left: business info
  doc.setTextColor(90, 80, 70);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("DAKSH JEWELLERS", m + 2, footerY + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(120, 110, 100);
  const footerLines = [
    BIZ.address,
    "GST: Applicable as per Government norms",
    "Prices inclusive of hallmarking charges",
  ];
  footerLines.forEach((line, i) => {
    doc.text(line, m + 2, footerY + 16 + (i * 5));
  });

  // Right: Thank you
  doc.setTextColor(100, 85, 60);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bolditalic");
  doc.text("Thank you!", pw - m - 5, footerY + 22, { align: "right" });

  // Bottom border accent
  doc.setFillColor(200, 190, 168);
  doc.rect(0, ph - 4, pw, 4, "F");

  return doc;
}

/**
 * Download invoice as PDF
 */
export function downloadInvoicePDF(invoice) {
  try {
    const doc = generateInvoicePDF(invoice);
    const filename = `Invoice_${(invoice.invoiceNumber || "draft").replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    doc.save(filename);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    try {
      const doc = new jsPDF();
      doc.setFillColor(245, 241, 230);
      doc.rect(0, 0, 210, 297, "F");
      doc.setTextColor(45, 40, 35);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("DAKSH JEWELLERS", 105, 30, { align: "center" });
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice: ${invoice.invoiceNumber}`, 25, 55);
      doc.text(`Customer: ${invoice.customerName}`, 25, 65);
      doc.text(`Phone: +91 ${invoice.customerPhone}`, 25, 75);
      doc.text(`Total: ${formatCurrency(invoice.totalAmount)}`, 25, 90);
      doc.setFontSize(9);
      doc.text("Thank you for shopping with Daksh Jewellers", 105, 120, { align: "center" });
      doc.save(`Invoice_${invoice.invoiceNumber || "draft"}.pdf`);
      return true;
    } catch (e2) {
      console.error("Fallback PDF failed:", e2);
      return false;
    }
  }
}

export function getInvoicePDFBlob(invoice) {
  const doc = generateInvoicePDF(invoice);
  return doc.output("blob");
}
