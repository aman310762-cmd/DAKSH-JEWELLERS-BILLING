import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Download,
  Send,
  Calculator,
  User,
  Package,
  X,
  FileText,
  Sparkles,
  Check,
  RotateCcw,
  Eye,
  Phone,
  IndianRupee,
} from "lucide-react";
import { createInvoice, getCustomers, getCustomerByPhone } from "../api";
import {
  PURITY_LABELS,
  PURITY_METAL,
  calculateInvoice,
  formatCurrency,
} from "../billingLogic";
import { downloadInvoicePDF, shareInvoiceViaWhatsApp } from "../components/PDFGenerator";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../components/ui/dialog";
import toast from "react-hot-toast";

const emptyItem = {
  name: "",
  code: "",
  weight: "",
  purity: "22K",
  ratePerGram: "",
  stoneCharges: "",
};

export default function CreateInvoice() {
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "" });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [makingChargesValue, setMakingChargesValue] = useState("");
  const [makingChargesType, setMakingChargesType] = useState("fixed");
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState("fixed");
  const [billing, setBilling] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [savedInvoice, setSavedInvoice] = useState(null);
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Daily rate fields
  const [dailyGoldRate, setDailyGoldRate] = useState("");
  const [dailySilverRate, setDailySilverRate] = useState("");

  // Preview modal before final save
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Success modal after save
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [liveRatesSource, setLiveRatesSource] = useState(null);
  const [liveRatesData, setLiveRatesData] = useState(null);

  // Fetch live rates on mount + auto-refresh every 5 minutes
  const fetchRates = useCallback(() => {
    import("../api").then(({ getLiveRates }) => {
      getLiveRates().then(({ data }) => {
        setLiveRatesData(data);
        if (data.gold22K && !dailyGoldRate) setDailyGoldRate(String(data.gold22K));
        if (data.silver && !dailySilverRate) setDailySilverRate(String(data.silver));
        setLiveRatesSource(data.source);
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    fetchRates();
    const interval = setInterval(fetchRates, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchRates]);

  // Live auto-calculation (FIX #5)
  const recalculate = useCallback(() => {
    const validItems = items.filter(
      (item) =>
        item.name &&
        parseFloat(item.weight) > 0 &&
        parseFloat(item.ratePerGram) > 0
    );
    if (validItems.length === 0) { setBilling(null); return; }

    const parsed = validItems.map((item) => ({
      ...item,
      weight: parseFloat(item.weight),
      ratePerGram: parseFloat(item.ratePerGram),
      stoneCharges: parseFloat(item.stoneCharges) || 0,
    }));

    const result = calculateInvoice(
      parsed,
      parseFloat(makingChargesValue) || 0,
      makingChargesType,
      parseFloat(discountValue) || 0,
      discountType
    );
    setBilling(result);
  }, [items, makingChargesValue, makingChargesType, discountValue, discountType]);

  useEffect(() => { recalculate(); }, [recalculate]);

  // Customer search by name
  const searchCustomers = async (query) => {
    if (query.length < 2) { setCustomerSuggestions([]); return; }
    try {
      const { data } = await getCustomers(query);
      setCustomerSuggestions(data);
      setShowSuggestions(true);
    } catch { /* ignore */ }
  };

  const selectCustomer = (c) => {
    setCustomer({ name: c.name, phone: c.phone, address: c.address || "" });
    setShowSuggestions(false);
  };

  // FIX #6: Customer auto-fill by phone number
  const handlePhoneChange = async (phone) => {
    setCustomer((prev) => ({ ...prev, phone }));
    if (phone.length === 10) {
      try {
        const { data } = await getCustomerByPhone(phone);
        if (data && data.name) {
          setCustomer({ name: data.name, phone: data.phone, address: data.address || "" });
          toast.success(`Customer found: ${data.name}`);
        }
      } catch { /* new customer */ }
    }
  };

  const addItem = () => setItems([...items, { ...emptyItem }]);

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // FIX #4: Auto-fill rate when purity changes based on daily rate
  const updateItem = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-fill rate from daily rate when purity changes
    if (field === "purity") {
      const metal = PURITY_METAL[value];
      if (metal === "gold" && dailyGoldRate && !updated[index].ratePerGram) {
        updated[index].ratePerGram = dailyGoldRate;
      } else if (metal === "silver" && dailySilverRate && !updated[index].ratePerGram) {
        updated[index].ratePerGram = dailySilverRate;
      }
    }

    setItems(updated);
  };

  // Set daily rate and auto-fill existing empty items
  const handleDailyGoldRate = (rate) => {
    setDailyGoldRate(rate);
    if (rate) {
      setItems((prev) =>
        prev.map((item) => {
          const metal = PURITY_METAL[item.purity];
          if (metal === "gold" && !item.ratePerGram) {
            return { ...item, ratePerGram: rate };
          }
          return item;
        })
      );
    }
  };

  const handleDailySilverRate = (rate) => {
    setDailySilverRate(rate);
    if (rate) {
      setItems((prev) =>
        prev.map((item) => {
          const metal = PURITY_METAL[item.purity];
          if (metal === "silver" && !item.ratePerGram) {
            return { ...item, ratePerGram: rate };
          }
          return item;
        })
      );
    }
  };

  // FIX #12: Validation before showing preview
  const handlePreview = () => {
    if (!customer.name.trim()) { toast.error("Enter customer name"); return; }
    if (!customer.phone.trim() || customer.phone.replace(/\D/g, "").length !== 10) {
      toast.error("Enter valid 10-digit mobile number"); return;
    }
    const validItems = items.filter(
      (i) => i.name.trim() && parseFloat(i.weight) > 0 && parseFloat(i.ratePerGram) > 0
    );
    if (validItems.length === 0) {
      toast.error("Add at least one complete item"); return;
    }
    setShowConfirmModal(true);
  };

  // FIX #7: Submit after preview confirmation
  const handleSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const validItems = items.filter(
        (i) => i.name.trim() && parseFloat(i.weight) > 0 && parseFloat(i.ratePerGram) > 0
      );
      const payload = {
        customerName: customer.name.trim(),
        customerPhone: customer.phone.trim(),
        customerAddress: customer.address.trim(),
        items: validItems.map((item) => ({
          ...item,
          name: item.name.trim(),
          code: (item.code || "").trim(),
          weight: parseFloat(item.weight),
          ratePerGram: parseFloat(item.ratePerGram),
        })),
        makingChargesValue: parseFloat(makingChargesValue) || 0,
        makingChargesType,
        discountValue: parseFloat(discountValue) || 0,
        discountType,
      };

      const { data } = await createInvoice(payload);
      setSavedInvoice(data.invoice);
      toast.success(`Invoice ${data.invoice.invoiceNumber} created!`);
      setShowSuccessModal(true);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  };

  // FIX #1: Guaranteed PDF download
  const handleDownloadPDF = () => {
    if (!savedInvoice) return;
    const success = downloadInvoicePDF(savedInvoice);
    if (success) {
      toast.success("PDF downloaded!");
    } else {
      toast.error("PDF download failed - please try again");
    }
  };

  const handleWhatsApp = async () => {
    if (!savedInvoice) return;
    try {
      const result = await shareInvoiceViaWhatsApp(savedInvoice);
      if (result.method === "share") {
        toast.success("PDF shared via WhatsApp!");
      } else if (result.method === "download-and-chat") {
        toast.success("PDF downloaded! Attach it in the WhatsApp chat that just opened.", { duration: 5000 });
      } else if (result.method === "cancelled") {
        // User cancelled share dialog
      } else {
        toast.success("WhatsApp opened!");
      }
    } catch { toast.error("Failed to share on WhatsApp"); }
  };

  const resetForm = () => {
    setCustomer({ name: "", phone: "", address: "" });
    setItems([{ ...emptyItem }]);
    setMakingChargesValue("");
    setMakingChargesType("fixed");
    setDiscountValue("");
    setDiscountType("fixed");
    setBilling(null);
    setSavedInvoice(null);
    setShowSuccessModal(false);
    setShowConfirmModal(false);
  };

  const canPreview = billing !== null && customer.name.trim() && customer.phone.trim();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>Create Invoice</h1>
          <p className="text-sm text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>Fill details below and generate invoice</p>
        </div>
        {savedInvoice && (
          <button onClick={resetForm} className="text-sm px-4 py-2 rounded-xl bg-dark-700/50 text-dark-300 hover:text-gold-400 hover:bg-dark-700 transition-all flex items-center gap-2">
            <RotateCcw size={14} /> New Invoice
          </button>
        )}
      </div>

      {/* ====== PREVIEW CONFIRM MODAL (FIX #7) ====== */}
      {showConfirmModal && billing && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 modal-overlay">
          <div className="glass rounded-2xl p-8 max-w-lg w-full relative modal-content">
            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 text-dark-400 hover:text-white">
              <X size={20} />
            </button>
            <div className="text-center mb-5">
              <div className="w-14 h-14 rounded-full bg-gold-500/15 flex items-center justify-center mx-auto mb-3 animate-scale-in">
                <Eye size={24} className="text-gold-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Invoice Preview</h2>
              <p className="text-xs text-dark-400 mt-1">Review details before generating</p>
            </div>

            <div className="space-y-2 mb-5 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">Customer</span><span className="text-white font-medium">{customer.name}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Phone</span><span className="text-white">+91 {customer.phone}</span></div>
              {billing.items.map((it, i) => (
                <div key={i} className="flex justify-between bg-white/[0.02] rounded-lg p-2">
                  <span className="text-dark-300 text-xs">{it.name} ({it.weight}g · {PURITY_LABELS[it.purity] || it.purity})</span>
                  <span className="text-gold-400 text-xs font-semibold">{formatCurrency(it.adjustedPrice)}</span>
                </div>
              ))}
              <div className="border-t border-white/[0.05] pt-2 space-y-1">
                <div className="flex justify-between text-xs"><span className="text-dark-500">Metal Value</span><span className="text-dark-200">{formatCurrency(billing.subtotal)}</span></div>
                <div className="flex justify-between text-xs"><span className="text-dark-500">Making Charges</span><span className="text-dark-200">{formatCurrency(billing.makingCharges)}</span></div>
                {billing.stoneCharges > 0 && <div className="flex justify-between text-xs"><span className="text-dark-500">Stone Charges</span><span className="text-dark-200">{formatCurrency(billing.stoneCharges)}</span></div>}
                {billing.discount > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-400">Discount</span><span className="text-emerald-400">- {formatCurrency(billing.discount)}</span></div>}
              </div>
              <div className="border-t border-gold-500/20 pt-2 flex justify-between">
                <span className="text-gold-400 font-semibold">Total</span>
                <span className="text-xl font-bold text-gold-400">{formatCurrency(billing.totalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 rounded-xl text-sm text-dark-300 bg-dark-700/50 hover:bg-dark-700 transition-all font-medium">
                Edit
              </button>
              <button onClick={handleSubmit} disabled={submitting} className="flex-1 btn-gold py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                {submitting ? <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" /> : <><Check size={16} /> Confirm & Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====== SUCCESS MODAL ====== */}
      {showSuccessModal && savedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 modal-overlay">
          <div className="glass rounded-2xl p-8 max-w-lg w-full relative modal-content">
            <button onClick={() => setShowSuccessModal(false)} className="absolute top-4 right-4 text-dark-400 hover:text-white p-1">
              <X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check size={24} className="text-emerald-400" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white">Invoice Created!</h2>
              <p className="text-sm text-gold-400 mt-1 font-medium">{savedInvoice.invoiceNumber}</p>
            </div>
            <div className="space-y-3 mb-6 stagger-children">
              {[
                ["Customer", savedInvoice.customerName],
                ["Items", `${savedInvoice.items.length} items`],
                ["Metal Value", formatCurrency(savedInvoice.subtotal)],
                ["Making Charges", formatCurrency(savedInvoice.makingCharges)],
                ...(savedInvoice.stoneCharges > 0 ? [["Stone Charges", formatCurrency(savedInvoice.stoneCharges)]] : []),
                ...(savedInvoice.discount > 0 ? [["Discount", "- " + formatCurrency(savedInvoice.discount)]] : []),
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm animate-fade-in-up" style={{ opacity: 0 }}>
                  <span className="text-dark-400">{label}</span>
                  <span className={`font-medium ${label === 'Discount' ? 'text-emerald-400' : 'text-white'}`}>{value}</span>
                </div>
              ))}
              <div className="border-t border-gold-500/20 pt-3 flex justify-between animate-fade-in-up" style={{ opacity: 0 }}>
                <span className="font-semibold text-gold-400 text-base">Total</span>
                <span className="text-2xl font-bold text-gold-400">{formatCurrency(savedInvoice.totalAmount)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadPDF} className="flex-1 btn-gold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Download size={16} /> Download PDF
              </button>
              <button onClick={handleWhatsApp} className="flex-1 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/20">
                <Send size={16} /> WhatsApp
              </button>
            </div>
            <button onClick={() => { setShowSuccessModal(false); resetForm(); }} className="w-full mt-2 py-2.5 rounded-xl text-xs text-dark-400 hover:text-gold-400 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
              Create Another Invoice
            </button>
          </div>
        </div>
      )}

      {/* ====== MAIN FORM ====== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-5 stagger-children">

          {/* Live Market Rates + Rate Input */}
          <div className="glass rounded-2xl p-5 animate-fade-in-up card-hover" style={{ opacity: 0 }}>
            {/* Live Rates Ticker */}
            <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center">
                <IndianRupee size={14} className="text-gold-400" />
              </div>
              Live Market Rates
              {liveRatesSource && (
                <span className={`ml-2 text-[9px] px-2 py-0.5 rounded-full font-medium ${liveRatesSource === "default" ? "bg-dark-700 text-dark-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"}`}>
                  {liveRatesSource === "default" ? "Default Rates" : "🟢 Live"}
                </span>
              )}
              {liveRatesData?.timestamp && (
                <span className="ml-auto text-[9px] text-dark-500 font-normal normal-case">
                  Updated: {new Date(liveRatesData.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </h2>

            {/* Rate Cards Grid */}
            {liveRatesData && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
                {[
                  { label: "Gold 24K", value: liveRatesData.gold24K, color: "from-yellow-500/15 to-yellow-600/5 border-yellow-500/15", textColor: "text-yellow-400" },
                  { label: "Gold 22K", value: liveRatesData.gold22K, color: "from-amber-500/15 to-amber-600/5 border-amber-500/15", textColor: "text-amber-400" },
                  { label: "Gold 18K", value: liveRatesData.gold18K, color: "from-orange-500/12 to-orange-600/5 border-orange-500/12", textColor: "text-orange-400" },
                  { label: "Silver", value: liveRatesData.silver, color: "from-slate-400/12 to-slate-500/5 border-slate-400/12", textColor: "text-slate-300" },
                  { label: "Platinum", value: liveRatesData.platinum, color: "from-sky-400/12 to-sky-500/5 border-sky-400/12", textColor: "text-sky-300" },
                ].map(({ label, value, color, textColor }) => (
                  <div key={label} className={`bg-gradient-to-br ${color} border rounded-xl p-2.5 text-center`}>
                    <p className="text-[9px] text-dark-400 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-sm font-bold ${textColor}`}>₹{value ? value.toLocaleString("en-IN") : "—"}</p>
                    <p className="text-[8px] text-dark-600 mt-0.5">per gram</p>
                  </div>
                ))}
              </div>
            )}

            {/* Charges info */}
            {liveRatesData?.premiums && (
              <div className="bg-white/[0.02] rounded-lg px-3 py-2 mb-4">
                <p className="text-[9px] text-dark-500 mb-1">
                  <span className="font-semibold text-dark-400">Rates include:</span>{" "}
                  MCX Premium (₹{liveRatesData.premiums.gold.mcxToSpot}/g) + RTGS Charges (₹{liveRatesData.premiums.gold.rtgsCharges}/g) + Refinery (₹{liveRatesData.premiums.gold.refineryMargin}/g) = <span className="text-gold-400 font-semibold">₹{liveRatesData.premiums.gold.total}/g total premium</span>
                </p>
              </div>
            )}

            {/* Editable Rate Inputs */}
            <h3 className="text-xs font-semibold text-dark-300 mb-2 uppercase tracking-wider">Set Today's Billing Rate</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">Gold Rate (₹/g)</label>
                <input type="number" value={dailyGoldRate} onChange={(e) => handleDailyGoldRate(e.target.value)}
                  placeholder="e.g. 7200" className="input-gold w-full px-4 py-3 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">Silver Rate (₹/g)</label>
                <input type="number" value={dailySilverRate} onChange={(e) => handleDailySilverRate(e.target.value)}
                  placeholder="e.g. 95" className="input-gold w-full px-4 py-3 rounded-xl text-sm" />
              </div>
            </div>
            <p className="text-[10px] text-dark-600 mt-2">
              {liveRatesSource && liveRatesSource !== "default"
                ? "Live rates auto-fetched. Billing rate auto-fills — you can override per item."
                : "Set today's rate — auto-fills for new items. Can override per item. Rates auto-refresh every 5 min."}
            </p>
          </div>

          {/* Customer Details */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up card-hover" style={{ opacity: 0 }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center"><User size={14} className="text-gold-400" /></div>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone first - for auto-fill */}
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  Mobile Number <span className="text-gold-500">*</span>
                  <span className="text-dark-600 ml-1 normal-case">(auto-fills customer)</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl bg-dark-700/80 border border-r-0 border-gold-500/15 text-dark-400 text-sm font-medium">+91</span>
                  <input id="customer-phone" type="tel" value={customer.phone}
                    onChange={(e) => handlePhoneChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="9876543210" maxLength={10}
                    className="input-gold w-full px-4 py-3 rounded-r-xl rounded-l-none text-sm" />
                </div>
              </div>
              {/* Name */}
              <div className="relative">
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">Customer Name <span className="text-gold-500">*</span></label>
                <input id="customer-name" type="text" value={customer.name}
                  onChange={(e) => { setCustomer({ ...customer, name: e.target.value }); searchCustomers(e.target.value); }}
                  onFocus={() => customerSuggestions.length > 0 && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Enter customer name" className="input-gold w-full px-4 py-3 rounded-xl text-sm" autoComplete="off" />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 glass rounded-xl z-20 max-h-40 overflow-y-auto shadow-2xl animate-fade-in-down">
                    {customerSuggestions.map((c) => (
                      <button key={c._id} onMouseDown={() => selectCustomer(c)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gold-500/10 transition-colors flex items-center gap-2">
                        <User size={14} className="text-gold-400" />
                        <span className="text-white">{c.name}</span>
                        <span className="text-dark-500 text-xs ml-auto">{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">Address</label>
                <input id="customer-address" type="text" value={customer.address}
                  onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                  placeholder="Enter address (optional)" className="input-gold w-full px-4 py-3 rounded-xl text-sm" />
              </div>
            </div>
          </div>

          {/* Jewellery Items */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up card-hover" style={{ opacity: 0 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 uppercase tracking-wider">
                <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center"><Package size={14} className="text-gold-400" /></div>
                Jewellery Items
              </h2>
              <button onClick={addItem} className="text-xs px-3.5 py-2 rounded-xl bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 transition-all duration-300 flex items-center gap-1.5 font-medium border border-gold-500/10 hover:border-gold-500/25">
                <Plus size={14} /> Add Item
              </button>
            </div>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04] relative group transition-all duration-300 hover:border-gold-500/15 hover:bg-white/[0.03]">
                  {items.length > 1 && (
                    <button onClick={() => removeItem(index)} className="absolute top-3 right-3 text-dark-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  )}
                  <div className="text-[10px] text-gold-400/50 uppercase tracking-[0.15em] mb-3 font-semibold flex items-center gap-1.5">
                    <Sparkles size={10} /> Item {index + 1}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">Item Name <span className="text-gold-600">*</span></label>
                      <input type="text" value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)}
                        placeholder="Gold Ring" className="input-gold w-full px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">Item Code</label>
                      <input type="text" value={item.code} onChange={(e) => updateItem(index, "code", e.target.value)}
                        placeholder="GR-001" className="input-gold w-full px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">Weight (g) <span className="text-gold-600">*</span></label>
                      <input type="number" step="0.01" value={item.weight}
                        onChange={(e) => updateItem(index, "weight", e.target.value)}
                        placeholder="10.5" className="input-gold w-full px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">Purity <span className="text-gold-600">*</span></label>
                      <select value={item.purity} onChange={(e) => updateItem(index, "purity", e.target.value)}
                        className="input-gold w-full px-3 py-2.5 rounded-lg text-sm">
                        {Object.entries(PURITY_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">
                        Rate/g (₹) <span className="text-gold-600">*</span>
                        {dailyGoldRate && PURITY_METAL[item.purity] === "gold" && !item.ratePerGram && (
                          <span className="text-gold-500/60 ml-1">→ {dailyGoldRate}</span>
                        )}
                      </label>
                      <input type="number" value={item.ratePerGram}
                        onChange={(e) => updateItem(index, "ratePerGram", e.target.value)}
                        placeholder={PURITY_METAL[item.purity] === "gold" ? (dailyGoldRate || "6500") : (dailySilverRate || "95")}
                        className="input-gold w-full px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] text-dark-500 mb-1 block font-medium">
                        Stone (₹)
                      </label>
                      <input type="number" value={item.stoneCharges}
                        onChange={(e) => updateItem(index, "stoneCharges", e.target.value)}
                        placeholder="0"
                        className="input-gold w-full px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Making Charges & Discount */}
          <div className="glass rounded-2xl p-6 animate-fade-in-up card-hover" style={{ opacity: 0 }}>
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
              <div className="w-7 h-7 rounded-lg bg-gold-500/15 flex items-center justify-center"><Calculator size={14} className="text-gold-400" /></div>
              Making Charges & Discount
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">Making Charge Type</label>
                <select value={makingChargesType} onChange={(e) => setMakingChargesType(e.target.value)}
                  className="input-gold w-full px-4 py-3 rounded-xl text-sm">
                  <option value="fixed">Fixed Amount (₹)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  {makingChargesType === "fixed" ? "Making Amount (₹)" : "Making Percentage (%)"}
                </label>
                <input type="number" value={makingChargesValue}
                  onChange={(e) => setMakingChargesValue(e.target.value)}
                  placeholder={makingChargesType === "fixed" ? "500" : "5"}
                  className="input-gold w-full px-4 py-3 rounded-xl text-sm" />
              </div>
            </div>
            <div className="border-t border-white/[0.05] pt-4">
              <h3 className="text-xs font-semibold text-dark-300 mb-3 uppercase tracking-wider">Discount (if applicable)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block font-medium">Discount Type</label>
                  <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}
                    className="input-gold w-full px-4 py-3 rounded-xl text-sm">
                    <option value="fixed">Fixed Amount (₹)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                    {discountType === "fixed" ? "Discount Amount (₹)" : "Discount Percentage (%)"}
                  </label>
                  <input type="number" value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "fixed" ? "0" : "0"}
                    className="input-gold w-full px-4 py-3 rounded-xl text-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Preview + Generate */}
        <div className="animate-slide-right" style={{ opacity: 0 }}>
          <div className="glass rounded-2xl p-6 sticky top-6">
            <h2 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Calculator size={16} className="text-gold-400" /> Live Preview
            </h2>

            <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-xl p-4 mb-4 text-center border border-gold-500/8">
              <h3 className="font-display text-lg font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>Daksh Jewellers</h3>
              <p className="text-[10px] text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>Ramavtar Market, Near Hill View Garden, Thada (Alwar) Rajasthan</p>
            </div>

            {billing ? (
              <div className="space-y-3 animate-fade-in">
                {customer.name && (
                  <div className="text-sm px-3 py-2 rounded-lg bg-white/[0.02]">
                    <span className="text-dark-500 text-xs">To: </span>
                    <span className="text-white font-medium">{customer.name}</span>
                    {customer.phone && <span className="text-dark-500 text-xs ml-2">(+91 {customer.phone})</span>}
                  </div>
                )}

                <div className="space-y-2">
                  {billing.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm bg-white/[0.02] rounded-lg p-3 border border-white/[0.03]">
                      <div className="min-w-0">
                        <p className="text-white text-xs font-medium truncate">{item.name}</p>
                        <p className="text-[10px] text-dark-500 mt-0.5">
                          {item.weight}g · {PURITY_LABELS[item.purity] || item.purity} · {formatCurrency(item.ratePerGram)}/g
                        </p>
                      </div>
                      <p className="text-gold-400 text-xs font-semibold whitespace-nowrap ml-2">{formatCurrency(item.adjustedPrice)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/[0.05] pt-3 space-y-2">
                  <div className="flex justify-between text-xs"><span className="text-dark-500">Metal Value</span><span className="text-dark-200">{formatCurrency(billing.subtotal)}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-dark-500">Making Charges</span><span className="text-dark-200">{formatCurrency(billing.makingCharges)}</span></div>
                  {billing.stoneCharges > 0 && <div className="flex justify-between text-xs"><span className="text-dark-500">Stone Charges</span><span className="text-dark-200">{formatCurrency(billing.stoneCharges)}</span></div>}
                  {billing.discount > 0 && <div className="flex justify-between text-xs"><span className="text-emerald-400">Discount</span><span className="text-emerald-400">- {formatCurrency(billing.discount)}</span></div>}
                  <div className="border-t border-gold-500/15 pt-3 flex justify-between items-baseline">
                    <span className="text-sm font-semibold text-gold-400">Total</span>
                    <span className="text-xl font-bold text-gold-400 animate-count-up">{formatCurrency(billing.totalAmount)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-dark-500">
                <Calculator size={36} className="mx-auto mb-3 opacity-20 animate-float" />
                <p className="text-xs">Fill item details to see live preview</p>
              </div>
            )}

            <div className="mt-6">
              <button onClick={handlePreview} disabled={!canPreview || submitting}
                className="w-full btn-gold py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer">
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                ) : (
                  <><Eye size={18} /> Preview & Generate</>
                )}
              </button>
              {!canPreview && (
                <p className="text-[10px] text-dark-600 text-center mt-2">Fill customer + at least one item</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
