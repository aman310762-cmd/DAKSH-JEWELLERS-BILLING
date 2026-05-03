import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { formatCurrency, PURITY_LABELS, getHSNCode } from "../billingLogic";

const BIZ = {
  name: "DAKSH JEWELLERS",
  dealsIn: "All Types of Gold, Silver & Diamond Jewellery",
  address: "Shop No. 1, Rainwar Market, Near Hill View Garden, Vill. Thada (Alwar) Rajasthan",
  gstin: "08CUXPK2325H1Z5",
  proprietor: "Praveen Kumar",
  phone: "9896424648",
  state: "Rajasthan",
  stateCode: "08",
};

/**
 * Convert number to Indian words
 */
function numberToWords(num) {
  if (!num || num === 0) return "Zero Rupees Only";
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const numToStr = (n) => {
    if (n === 0) return "";
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToStr(n % 100) : "");
  };

  const whole = Math.floor(Math.abs(num));
  const paise = Math.round((Math.abs(num) - whole) * 100);

  const crore = Math.floor(whole / 10000000);
  const lakh = Math.floor((whole % 10000000) / 100000);
  const thousand = Math.floor((whole % 100000) / 1000);
  const remainder = whole % 1000;

  let result = "";
  if (crore > 0) result += numToStr(crore) + " Crore ";
  if (lakh > 0) result += numToStr(lakh) + " Lakh ";
  if (thousand > 0) result += numToStr(thousand) + " Thousand ";
  if (remainder > 0) result += numToStr(remainder);
  result = result.trim() + " Rupees";
  if (paise > 0) result += " and " + numToStr(paise) + " Paise";
  return result + " Only";
}

/**
 * Format amount for PDF (ensures no overflow)
 */
function fmtAmt(n) {
  return "Rs. " + new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

/**
 * Generate Tax Invoice PDF matching paper format
 */
export function generateInvoicePDF(invoice) {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = 210;
  const ph = 297;
  const ml = 15; // left margin
  const mr = pw - 15; // right margin
  const contentW = mr - ml;

  // White background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pw, ph, "F");

  // Outer border
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.6);
  doc.rect(ml - 2, 8, contentW + 4, ph - 16, "S");

  let y = 15;

  // === GSTIN LINE ===
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("GSTIN: " + BIZ.gstin, ml, y);
  doc.text("E.Com Bills", mr, y, { align: "right" });

  // === SHOP NAME ===
  y += 10;
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(BIZ.name, pw / 2, y, { align: "center" });

  // Deals in
  y += 7;
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80, 80, 80);
  doc.text("Deals in : " + BIZ.dealsIn, pw / 2, y, { align: "center" });

  // Address
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(BIZ.address, pw / 2, y, { align: "center" });

  // Proprietor info (right aligned, same row as shop name)
  doc.setFontSize(7);
  doc.text("Proprietor: " + BIZ.proprietor, mr, y - 12, { align: "right" });
  doc.text(BIZ.phone, mr, y - 7, { align: "right" });

  // Divider
  y += 5;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(ml, y, mr, y);

  // === TAX INVOICE ===
  y += 8;
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 20, 20);
  doc.text("TAX INVOICE", pw / 2, y, { align: "center" });

  // === BILL INFO ROW ===
  y += 8;
  doc.setFontSize(9);
  const dateStr = new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  doc.setFont("helvetica", "bold");
  doc.text("Bill No:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(String(invoice.invoiceNumber || "-"), ml + 18, y);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Date:", pw / 2 - 10, y);
  doc.setFont("helvetica", "normal");
  doc.text(dateStr, pw / 2 + 5, y);

  doc.setFont("helvetica", "bold");
  doc.text("Place of supply:", mr - 42, y);
  doc.setFont("helvetica", "normal");
  doc.text("Rajasthan", mr, y, { align: "right" });

  // Divider
  y += 5;
  doc.setLineWidth(0.3);
  doc.line(ml, y, mr, y);

  // === BUYER DETAILS ===
  y += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Buyer Details", ml, y);

  y += 6;
  doc.setFontSize(8);
  const col2 = pw / 2 + 10;

  // Row 1: Name + Phone
  doc.setFont("helvetica", "bold"); doc.text("Name:", ml, y);
  doc.setFont("helvetica", "normal"); doc.text(invoice.customerName || "-", ml + 16, y);
  doc.setFont("helvetica", "bold"); doc.text("Phone No:", col2, y);
  doc.setFont("helvetica", "normal"); doc.text("+91 " + (invoice.customerPhone || "-"), col2 + 22, y);

  // Row 2: Address + State
  y += 6;
  doc.setFont("helvetica", "bold"); doc.text("Address:", ml, y);
  doc.setFont("helvetica", "normal");
  const addrText = invoice.customerAddress || "-";
  const addrLines = doc.splitTextToSize(addrText, 65);
  doc.text(addrLines, ml + 20, y);
  doc.setFont("helvetica", "bold"); doc.text("State:", col2, y);
  doc.setFont("helvetica", "normal"); doc.text("Rajasthan", col2 + 22, y);

  // Row 3: State Code
  y += 6;
  doc.setFont("helvetica", "bold"); doc.text("State Code:", col2, y);
  doc.setFont("helvetica", "normal"); doc.text("08", col2 + 22, y);

  // === ITEMS TABLE ===
  y += 8;
  doc.setLineWidth(0.4);
  doc.line(ml, y, mr, y);

  // Table columns — properly spaced
  const c = {
    sn: ml + 5,
    snEnd: ml + 12,
    desc: ml + 14,
    descEnd: ml + 85,
    hsn: ml + 87,
    hsnEnd: ml + 105,
    wt: ml + 107,
    wtEnd: ml + 125,
    rate: ml + 127,
    rateEnd: ml + 150,
    amt: mr - 2,
    amtStart: ml + 152,
  };

  // Column headers
  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);

  doc.text("S.N.", c.sn, y);
  doc.text("Description of Goods / Services", c.desc, y);
  doc.text("HSN SAC", (c.hsn + c.hsnEnd) / 2, y, { align: "center" });
  doc.text("Weight(gm)", (c.wt + c.wtEnd) / 2, y, { align: "center" });
  doc.text("Rate", (c.rate + c.rateEnd) / 2, y, { align: "center" });
  doc.text("Amount (in Rs.)", c.amt, y, { align: "right" });

  // Header line
  y += 3;
  doc.setLineWidth(0.3);
  doc.line(ml, y, mr, y);

  // Vertical dividers positions
  const vLines = [c.snEnd, c.descEnd, c.hsnEnd, c.wtEnd, c.rateEnd];
  const tableHeaderY = y - 8;

  // === ITEM ROWS ===
  y += 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);

  const rowHeight = 8;
  invoice.items.forEach((item, i) => {
    const rowY = y + (i * rowHeight) + 4;
    const purityLabel = PURITY_LABELS[item.purity] || item.purity;
    const hsnCode = item.hsnCode || getHSNCode(item.purity, item.category);
    const desc = item.code ? item.name + " (" + item.code + ") - " + purityLabel : item.name + " - " + purityLabel;

    doc.text(String(i + 1), c.sn + 2, rowY);

    // Truncate description to fit column
    const descTrunc = doc.splitTextToSize(desc, c.descEnd - c.desc - 2);
    doc.text(descTrunc[0], c.desc, rowY);

    doc.text(hsnCode, (c.hsn + c.hsnEnd) / 2, rowY, { align: "center" });
    doc.text(item.weight + "g", (c.wt + c.wtEnd) / 2, rowY, { align: "center" });
    doc.text(fmtAmt(item.ratePerGram), (c.rate + c.rateEnd) / 2, rowY, { align: "center" });

    doc.setFont("helvetica", "bold");
    doc.text(fmtAmt(item.adjustedPrice), c.amt, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  // Ensure minimum table height (5 rows)
  const minRows = Math.max(5, invoice.items.length);
  const tableEndY = y + (minRows * rowHeight) + 6;

  // Draw vertical lines
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.15);
  vLines.forEach(x => {
    doc.line(x, tableHeaderY, x, tableEndY);
  });

  // Left and right borders for table
  doc.line(ml, tableHeaderY, ml, tableEndY);
  doc.line(mr, tableHeaderY, mr, tableEndY);

  // Bottom of table
  y = tableEndY;
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.4);
  doc.line(ml, y, mr, y);

  // === TOTALS ===
  y += 6;
  const lblX = pw / 2 + 15;
  const valX = mr - 3;

  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);

  const row = (label, val, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.text(label, lblX, y);
    doc.text(fmtAmt(val), valX, y, { align: "right" });
    y += 5;
  };

  row("Sub Total:", invoice.subtotal);
  row("Making Charges:", invoice.makingCharges);

  if (invoice.stoneCharges && invoice.stoneCharges > 0) {
    row("Stone Charges:", invoice.stoneCharges);
  }

  const taxable = (invoice.subtotal || 0) + (invoice.makingCharges || 0) + (invoice.stoneCharges || 0);
  row("Taxable Amount:", invoice.taxableAmount || taxable);

  const halfGst = (invoice.gstAmount || 0) / 2;
  const halfRate = ((invoice.gstRate || 3) / 2).toFixed(1);
  row("CGST @ " + halfRate + "%:", halfGst);
  row("SGST @ " + halfRate + "%:", halfGst);

  // Grand total divider
  y += 1;
  doc.setLineWidth(0.3);
  doc.line(lblX - 3, y, valX + 2, y);

  y += 7;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL:", lblX, y);
  doc.text(fmtAmt(invoice.totalAmount), valX, y, { align: "right" });

  // === RS IN WORDS ===
  y += 10;
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(ml, y, mr, y);

  y += 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 30, 30);
  doc.text("Rs. in Words:", ml, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const wordsText = numberToWords(invoice.totalAmount);
  const wordLines = doc.splitTextToSize(wordsText, contentW - 28);
  doc.text(wordLines, ml + 28, y);

  // === TERMS ===
  y += wordLines.length * 4 + 5;
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.2);
  doc.line(ml, y, mr, y);

  y += 4;
  doc.setFontSize(6);
  doc.setTextColor(100, 100, 100);
  doc.text("Goods once sold will not be taken back or exchanged.", ml, y);
  y += 3.5;
  doc.text("Our risk and responsibility ceases as soon as the goods leave our premises.", ml, y);
  y += 3.5;
  doc.text("Subject to Alwar Jurisdiction only.", ml, y);

  // === SIGNATURES ===
  const sigY = Math.max(y + 15, ph - 30);
  doc.setDrawColor(80, 80, 80);
  doc.setLineWidth(0.3);
  doc.line(ml, sigY, mr, sigY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(60, 60, 60);
  doc.text("Customer's Signature", ml + 10, sigY + 10);
  doc.text("For DAKSH JEWELLERS", mr - 10, sigY + 5, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text("Authorised Signatory", mr - 10, sigY + 10, { align: "right" });

  return doc;
}

/**
 * Download invoice as PDF
 */
export function downloadInvoicePDF(invoice) {
  try {
    const doc = generateInvoicePDF(invoice);
    const filename = "Invoice_" + (invoice.invoiceNumber || "draft").replace(/[^a-zA-Z0-9-]/g, "_") + ".pdf";
    doc.save(filename);
    return true;
  } catch (err) {
    console.error("PDF generation error:", err);
    // Fallback simple PDF
    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("DAKSH JEWELLERS", 105, 30, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Invoice: " + invoice.invoiceNumber, 20, 50);
      doc.text("Customer: " + invoice.customerName, 20, 60);
      doc.text("Phone: +91 " + invoice.customerPhone, 20, 70);
      doc.text("Total: " + fmtAmt(invoice.totalAmount), 20, 85);
      doc.save("Invoice_" + (invoice.invoiceNumber || "draft") + ".pdf");
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
