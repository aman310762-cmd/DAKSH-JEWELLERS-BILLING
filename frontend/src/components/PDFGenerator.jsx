import { jsPDF } from "jspdf";
import { formatCurrency, PURITY_LABELS, getHSNCode } from "../billingLogic";

const BIZ = {
  name: "DAKSH JEWELLERS",
  dealsIn: "All Types of Gold, Silver & Diamond Jewellery",
  address: "Shop No. 1, Ramavtar Market, Near Hill View Garden, Vill. Thada (Alwar) Rajasthan",
  gstin: "08CUXPK2325H1Z5",
  proprietor: "Praveen Kumar",
  phone: "9896424648",
  state: "Rajasthan",
  stateCode: "08",
};

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

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0);
}

function hline(doc, y, x1, x2, w = 0.3) {
  doc.setLineWidth(w);
  doc.line(x1, y, x2, y);
}

/**
 * Generate professional invoice PDF
 */
export function generateInvoicePDF(invoice) {
  const doc = new jsPDF("p", "mm", "a4");
  const pw = 210;
  const ml = 14;       // left margin
  const mr = pw - 14;  // right margin (196)
  const cw = mr - ml;  // content width (182)
  const cx = pw / 2;

  doc.setDrawColor(0);

  // Outer border
  doc.setLineWidth(0.6);
  doc.rect(ml - 1, 8, cw + 2, 281, "S");

  let y = 14;

  // ═══════════════ HEADER ═══════════════

  // "Original Copy"
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(80);
  doc.text("Original Copy", mr - 3, y, { align: "right" });

  // BILL OF SUPPLY
  y += 2;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("BILL OF SUPPLY", cx, y, { align: "center" });

  // Shop name
  y += 9;
  doc.setFontSize(18);
  doc.text(BIZ.name, cx, y, { align: "center" });

  // Address
  y += 6;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40);
  doc.text(BIZ.address, cx, y, { align: "center" });

  // Contact
  y += 4;
  doc.text("Contact: +91 " + BIZ.phone + "  |  Prop: " + BIZ.proprietor, cx, y, { align: "center" });

  // GSTIN
  y += 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(0);
  doc.text("GSTIN: " + BIZ.gstin, cx, y, { align: "center" });

  // Header divider
  y += 4;
  hline(doc, y, ml, mr, 0.5);

  // ═══════════════ TWO-COLUMN: Buyer | Invoice Info ═══════════════

  const detY = y;
  const midX = ml + cw * 0.58;

  // Vertical divider
  doc.setLineWidth(0.3);
  doc.line(midX, detY, midX, detY + 32);

  // LEFT: Buyer details
  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Details of Receiver | Billed to:", ml + 3, y);

  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(invoice.customerName || "-", ml + 3, y);

  y += 5;
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30);
  if (invoice.customerAddress) {
    const al = doc.splitTextToSize(invoice.customerAddress, midX - ml - 8);
    doc.text(al, ml + 3, y);
    y += al.length * 4;
  }
  doc.text("Contact: +91 " + (invoice.customerPhone || "-"), ml + 3, y);
  y += 4;
  doc.text("State: Rajasthan - 08", ml + 3, y);

  // RIGHT: Invoice info
  const rx = midX + 4;
  const rcol = rx + 30;
  let ry = detY + 6;
  const dateStr = new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });

  doc.setTextColor(0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold"); doc.text("Invoice No", rx, ry);
  doc.text(":", rcol, ry);
  doc.setFont("helvetica", "normal"); doc.text(String(invoice.invoiceNumber || "-"), rcol + 3, ry);

  ry += 6;
  doc.setFont("helvetica", "bold"); doc.text("Date", rx, ry);
  doc.text(":", rcol, ry);
  doc.setFont("helvetica", "normal"); doc.text(dateStr, rcol + 3, ry);

  ry += 6;
  doc.setFont("helvetica", "bold"); doc.text("Payment", rx, ry);
  doc.text(":", rcol, ry);
  doc.setFont("helvetica", "normal"); doc.text("Cash", rcol + 3, ry);

  ry += 6;
  doc.setFont("helvetica", "bold"); doc.text("Place", rx, ry);
  doc.text(":", rcol, ry);
  doc.setFont("helvetica", "normal"); doc.text("Rajasthan", rcol + 3, ry);

  // Details bottom divider
  const detEndY = detY + 32;
  hline(doc, detEndY, ml, mr, 0.5);

  // ═══════════════ ITEMS TABLE ═══════════════

  // Column layout: fixed pixel positions within content area
  const c = {
    sn:      { x: ml,          w: 8   },
    product: { x: ml + 8,      w: 34  },
    hsn:     { x: ml + 42,     w: 14  },
    purity:  { x: ml + 56,     w: 14  },
    weight:  { x: ml + 70,     w: 14  },
    stone:   { x: ml + 84,     w: 15  },
    making:  { x: ml + 99,     w: 16  },
    rate:    { x: ml + 115,    w: 18  },
    taxable: { x: ml + 133,    w: 22  },
    total:   { x: ml + 155,    w: mr - (ml + 155) }, // fills to right margin
  };

  // Table header background
  y = detEndY;
  doc.setFillColor(240, 240, 240);
  doc.rect(ml, y, cw, 8, "F");
  hline(doc, y, ml, mr, 0.4);

  // Column headers
  y += 5.5;
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);

  const headers = [
    { col: c.sn,      text: "#",       align: "center" },
    { col: c.product,  text: "Product", align: "left" },
    { col: c.hsn,      text: "HSN",     align: "center" },
    { col: c.purity,   text: "Purity",  align: "center" },
    { col: c.weight,   text: "Wt(gm)", align: "center" },
    { col: c.stone,    text: "Stone",   align: "center" },
    { col: c.making,   text: "Mkg.Chg", align: "center" },
    { col: c.rate,     text: "Rate/gm", align: "center" },
    { col: c.taxable,  text: "Taxable", align: "center" },
    { col: c.total,    text: "Total",   align: "center" },
  ];

  headers.forEach(h => {
    const tx = h.align === "left" ? h.col.x + 2 : h.col.x + h.col.w / 2;
    doc.text(h.text, tx, y, { align: h.align === "left" ? undefined : "center" });
  });

  // Header bottom line
  y += 2.5;
  hline(doc, y, ml, mr, 0.4);

  // Item rows
  const rowH = 7;
  const rowStartY = y;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(20);

  const totalWeight = invoice.items.reduce((s, it) => s + (it.weight || 0), 0);
  const totalMaking = invoice.makingCharges || 0;

  invoice.items.forEach((item, i) => {
    const ry = rowStartY + (i * rowH) + 5;
    const hsnCode = item.hsnCode || getHSNCode(item.purity, item.category);
    const itemMaking = totalWeight > 0 ? Math.round((totalMaking * item.weight / totalWeight) * 100) / 100 : 0;
    const itemTaxable = (item.adjustedPrice || 0) + (item.stoneCharges || 0);
    const itemTotal = itemTaxable + itemMaking;
    const prodName = item.code ? item.name + " (" + item.code + ")" : item.name;
    const prodTrunc = doc.splitTextToSize(prodName, c.product.w - 3);

    // S.N.
    doc.text(String(i + 1), c.sn.x + c.sn.w / 2, ry, { align: "center" });
    // Product
    doc.text(prodTrunc[0], c.product.x + 2, ry);
    // HSN
    doc.text(hsnCode, c.hsn.x + c.hsn.w / 2, ry, { align: "center" });
    // Purity
    doc.text(item.purity || "", c.purity.x + c.purity.w / 2, ry, { align: "center" });
    // Weight
    doc.text(String(item.weight), c.weight.x + c.weight.w / 2, ry, { align: "center" });
    // Stone
    doc.text(fmt(item.stoneCharges || 0), c.stone.x + c.stone.w - 2, ry, { align: "right" });
    // Making
    doc.text(fmt(itemMaking), c.making.x + c.making.w - 2, ry, { align: "right" });
    // Rate
    doc.text(fmt(item.ratePerGram), c.rate.x + c.rate.w - 2, ry, { align: "right" });
    // Taxable
    doc.text(fmt(itemTaxable), c.taxable.x + c.taxable.w - 2, ry, { align: "right" });
    // Total (bold)
    doc.setFont("helvetica", "bold");
    doc.text(fmt(itemTotal), c.total.x + c.total.w - 3, ry, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  // Totals row
  const totRowY = rowStartY + (invoice.items.length * rowH);
  hline(doc, totRowY, ml, mr, 0.3);

  const trY = totRowY + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);

  const totalStone = invoice.items.reduce((s, it) => s + (it.stoneCharges || 0), 0);
  const totalTaxable = (invoice.subtotal || 0) + totalStone;
  const grandBeforeDiscount = totalTaxable + totalMaking;

  doc.text("Total:", c.product.x + 2, trY);
  doc.text(String(totalWeight), c.weight.x + c.weight.w / 2, trY, { align: "center" });
  doc.text(fmt(totalStone), c.stone.x + c.stone.w - 2, trY, { align: "right" });
  doc.text(fmt(totalMaking), c.making.x + c.making.w - 2, trY, { align: "right" });
  doc.text(fmt(totalTaxable), c.taxable.x + c.taxable.w - 2, trY, { align: "right" });
  doc.text(fmt(grandBeforeDiscount), c.total.x + c.total.w - 3, trY, { align: "right" });

  // Table end
  const minTableRows = Math.max(5, invoice.items.length + 1);
  const tableEndY = rowStartY + (minTableRows * rowH) + 2;
  hline(doc, tableEndY, ml, mr, 0.4);

  // Vertical lines
  doc.setLineWidth(0.2);
  doc.line(ml, detEndY, ml, tableEndY);
  doc.line(mr, detEndY, mr, tableEndY);
  Object.values(c).forEach((col, i) => {
    if (i > 0) doc.line(col.x, detEndY, col.x, tableEndY);
  });

  // ═══════════════ SUMMARY SECTION ═══════════════

  y = tableEndY + 1;
  hline(doc, y, ml, mr, 0.3);

  // Divide: left = Rs in Words, right = totals
  const sumDivX = ml + cw * 0.55;
  const sumRightPad = 8; // padding from right border

  // Vertical separator for summary
  doc.setLineWidth(0.3);
  doc.line(sumDivX, y, sumDivX, y + 32);

  // LEFT: Rs in Words
  const wy = y + 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Rs. in Words:", ml + 3, wy);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  const wordsText = numberToWords(invoice.totalAmount);
  const wordLines = doc.splitTextToSize(wordsText, sumDivX - ml - 30);
  doc.text(wordLines, ml + 28, wy);

  // RIGHT: Totals
  const slx = sumDivX + 5;        // label x
  const svx = mr - sumRightPad;   // value x (with padding from border)
  let sy = y + 6;

  doc.setFontSize(8);
  doc.setTextColor(0);

  const srow = (lbl, val) => {
    doc.setFont("helvetica", "normal");
    doc.text(lbl, slx, sy);
    doc.text(fmt(val), svx, sy, { align: "right" });
    sy += 5.5;
  };

  srow("Taxable Value", totalTaxable);
  srow("Making Charges", totalMaking);

  if (invoice.discount && invoice.discount > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Discount", slx, sy);
    doc.text("- " + fmt(invoice.discount), svx, sy, { align: "right" });
    sy += 5.5;
  }

  // Total divider
  hline(doc, sy, slx - 2, svx + 3, 0.4);
  sy += 6;

  // GRAND TOTAL - properly sized to fit within margins
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Total", slx, sy);
  const totalStr = "Rs. " + fmt(invoice.totalAmount);
  doc.text(totalStr, svx, sy, { align: "right" });

  // Summary bottom border
  const sumEndY = y + 32;
  hline(doc, sumEndY, ml, mr, 0.3);

  // ═══════════════ DECLARATION & SIGNATURE ═══════════════

  y = sumEndY + 5;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Declaration & Terms:", ml + 3, y);

  y += 4.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(60);
  const terms = [
    "Goods once sold will not be taken back or exchanged.",
    "All disputes subject to Alwar jurisdiction only.",
    "Please check the jewelry before leaving the counter.",
    "Payment once made will not be refunded.",
  ];
  terms.forEach((t) => {
    doc.text("\u2022  " + t, ml + 3, y);
    y += 3.5;
  });

  // Signature area - positioned well below terms
  const sigAreaY = y + 8;

  // "For DAKSH JEWELLERS" (right side, top of sig area)
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("For " + BIZ.name, mr - 8, sigAreaY, { align: "right" });

  // "Authorised Signatory" (right side, below shop name)
  doc.setFont("helvetica", "italic");
  doc.text("Authorised Signatory", mr - 8, sigAreaY + 10, { align: "right" });

  // "Customer's Signature" (left side, same level as Authorised Signatory)
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text("Customer's Signature", ml + 3, sigAreaY + 10);

  // Bottom note
  doc.setFontSize(5.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(130);
  doc.text("This is a computer generated invoice.", cx, 284, { align: "center" });

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
    return false;
  }
}

/**
 * Share invoice PDF via WhatsApp
 * - Mobile: Uses Web Share API to send PDF directly
 * - Desktop: Downloads PDF, then opens WhatsApp with instructions to attach
 */
export async function shareInvoiceViaWhatsApp(invoice) {
  const phone = "91" + (invoice.customerPhone || "");
  const filename = "Invoice_" + (invoice.invoiceNumber || "draft").replace(/[^a-zA-Z0-9-]/g, "_") + ".pdf";

  // Generate PDF
  let doc;
  try {
    doc = generateInvoicePDF(invoice);
  } catch (err) {
    console.error("PDF gen failed for WhatsApp:", err);
    const msg = encodeURIComponent("Invoice " + invoice.invoiceNumber + " - Rs. " + fmt(invoice.totalAmount) + " from Daksh Jewellers");
    window.open("https://wa.me/" + phone + "?text=" + msg, "_blank");
    return { success: true, method: "text-only" };
  }

  const blob = doc.output("blob");
  const file = new File([blob], filename, { type: "application/pdf" });

  // METHOD 1: Try Web Share API with file (works on mobile + Safari macOS)
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Invoice " + invoice.invoiceNumber,
        text: "Dear " + invoice.customerName + ",\n\nPlease find your invoice from Daksh Jewellers.\nInvoice: " + invoice.invoiceNumber + "\nTotal: Rs. " + fmt(invoice.totalAmount) + "\n\nThank you for your purchase!",
        files: [file],
      });
      return { success: true, method: "share" };
    }
  } catch (err) {
    if (err.name === "AbortError") return { success: false, method: "cancelled" };
    console.log("Web Share failed, using fallback:", err.message);
  }

  // METHOD 2: Download PDF + open WhatsApp Web with attachment instructions
  // First save the PDF
  doc.save(filename);

  // Small delay so file download starts, then open WhatsApp
  await new Promise(r => setTimeout(r, 500));

  const whatsappMsg = encodeURIComponent(
    "Dear " + invoice.customerName + ",\n\n" +
    "Thank you for your purchase at *Daksh Jewellers*!\n\n" +
    "*Invoice:* " + invoice.invoiceNumber + "\n" +
    "*Total:* Rs. " + fmt(invoice.totalAmount) + "\n\n" +
    "_Please find the invoice PDF attached._\n\n" +
    "For any queries: +91 " + BIZ.phone
  );
  window.open("https://wa.me/" + phone + "?text=" + whatsappMsg, "_blank");

  return { success: true, method: "download-and-chat" };
}

export function getInvoicePDFBlob(invoice) {
  const doc = generateInvoicePDF(invoice);
  return doc.output("blob");
}
