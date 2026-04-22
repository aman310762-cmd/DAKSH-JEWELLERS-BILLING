import { useState, useEffect } from "react";
import {
  FileText, Search, Download, Send, Eye, X, Receipt,
} from "lucide-react";
import { getInvoices, sendWhatsApp } from "../api";
import { formatCurrency, PURITY_LABELS } from "../billingLogic";
import { downloadInvoicePDF } from "../components/PDFGenerator";
import toast from "react-hot-toast";

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async (query = "") => {
    try {
      const params = {};
      if (query) params.search = query;
      const { data } = await getInvoices(params);
      setInvoices(data);
    } catch { toast.error("Failed to load invoices"); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { setSearch(e.target.value); fetchInvoices(e.target.value); };

  const handleDownload = (invoice) => {
    const success = downloadInvoicePDF(invoice);
    if (success) toast.success("PDF downloaded!");
    else toast.error("Download failed");
  };

  const handleWhatsApp = async (invoice) => {
    try {
      const { data } = await sendWhatsApp(invoice._id);
      if (data.whatsappUrl) window.open(data.whatsappUrl, "_blank");
      toast.success("WhatsApp opened!");
    } catch { toast.error("Failed"); }
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-display font-bold text-gradient-gold">Invoice History</h1>
        <p className="text-sm text-dark-500 mt-1">{invoices.length} total invoices</p>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
        <input type="text" value={search} onChange={handleSearch}
          placeholder="Search by invoice #, customer name, or phone..."
          className="input-gold w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-[3px] border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length > 0 ? (
        <div className="glass rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {["Invoice", "Customer", "Date", "Items", "Amount", "Actions"].map((h) => (
                    <th key={h} className={`px-5 py-3.5 text-[10px] text-dark-500 uppercase tracking-wider font-semibold ${h === "Amount" ? "text-right" : h === "Actions" ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4"><span className="text-sm font-medium text-gold-400">{inv.invoiceNumber}</span></td>
                    <td className="px-5 py-4"><p className="text-sm text-white">{inv.customerName}</p><p className="text-[10px] text-dark-500">+91 {inv.customerPhone}</p></td>
                    <td className="px-5 py-4 text-sm text-dark-400">{new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-4 text-sm text-dark-400">{inv.items.length}</td>
                    <td className="px-5 py-4 text-right"><span className="text-sm font-bold text-gold-400">{formatCurrency(inv.totalAmount)}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedInvoice(inv)} className="p-2 rounded-lg hover:bg-white/[0.05] text-dark-500 hover:text-white transition-all" title="View"><Eye size={15} /></button>
                        <button onClick={() => handleDownload(inv)} className="p-2 rounded-lg hover:bg-gold-500/10 text-dark-500 hover:text-gold-400 transition-all" title="PDF"><Download size={15} /></button>
                        <button onClick={() => handleWhatsApp(inv)} className="p-2 rounded-lg hover:bg-emerald-500/10 text-dark-500 hover:text-emerald-400 transition-all" title="WhatsApp"><Send size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-white/[0.03]">
            {invoices.map((inv) => (
              <div key={inv._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div><span className="text-[10px] font-medium text-gold-400">{inv.invoiceNumber}</span><p className="text-sm font-medium text-white mt-0.5">{inv.customerName}</p></div>
                  <span className="text-sm font-bold text-gold-400">{formatCurrency(inv.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-dark-500">{new Date(inv.createdAt).toLocaleDateString("en-IN")} · {inv.items.length} items</span>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded text-dark-500 hover:text-white"><Eye size={14} /></button>
                    <button onClick={() => handleDownload(inv)} className="p-1.5 rounded text-dark-500 hover:text-gold-400"><Download size={14} /></button>
                    <button onClick={() => handleWhatsApp(inv)} className="p-1.5 rounded text-dark-500 hover:text-emerald-400"><Send size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-dark-500 animate-fade-in">
          <Receipt size={48} className="mx-auto mb-4 opacity-15" />
          <p className="text-sm">No invoices found</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 modal-overlay">
          <div className="glass rounded-2xl p-6 lg:p-8 max-w-2xl w-full relative modal-content max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelectedInvoice(null)} className="absolute top-4 right-4 text-dark-400 hover:text-white"><X size={20} /></button>
            <div className="text-center mb-6 border-b border-gold-500/10 pb-6">
              <h2 className="font-display text-2xl font-bold text-gradient-gold">Daksh Jewellers</h2>
              <p className="text-[10px] text-dark-500 mt-1">Near Trehan Society, Bhiwadi, Thara, Rajasthan 301019</p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-xs font-medium">{selectedInvoice.invoiceNumber}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div><p className="text-dark-500 text-[10px] uppercase tracking-wider">Customer</p><p className="text-white font-medium mt-0.5">{selectedInvoice.customerName}</p></div>
              <div><p className="text-dark-500 text-[10px] uppercase tracking-wider">Phone</p><p className="text-white mt-0.5">+91 {selectedInvoice.customerPhone}</p></div>
              <div><p className="text-dark-500 text-[10px] uppercase tracking-wider">Date</p><p className="text-white mt-0.5">{new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p></div>
              {selectedInvoice.customerAddress && (<div><p className="text-dark-500 text-[10px] uppercase tracking-wider">Address</p><p className="text-white mt-0.5">{selectedInvoice.customerAddress}</p></div>)}
            </div>
            <div className="mb-6">
              <h3 className="text-[10px] text-dark-500 uppercase tracking-wider mb-3 font-semibold">Items</h3>
              <div className="space-y-2">
                {selectedInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/[0.02] rounded-xl p-3 border border-white/[0.03]">
                    <div>
                      <p className="text-sm text-white font-medium">{item.name}{item.code && <span className="text-xs text-dark-500 ml-2">({item.code})</span>}</p>
                      <p className="text-[10px] text-dark-500">{item.weight}g · {PURITY_LABELS[item.purity] || item.purity} · {formatCurrency(item.ratePerGram)}/g</p>
                    </div>
                    <p className="text-sm font-medium text-gold-400">{formatCurrency(item.adjustedPrice)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-white/[0.05] pt-4 space-y-2">
              {[
                ["Metal Value", selectedInvoice.subtotal],
                ["Making Charges", selectedInvoice.makingCharges],
                [`GST (${selectedInvoice.gstRate || 3}%)`, selectedInvoice.gstAmount],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between text-sm"><span className="text-dark-500">{l}</span><span className="text-dark-200">{formatCurrency(v)}</span></div>
              ))}
              <div className="border-t border-gold-500/15 pt-3 flex justify-between">
                <span className="text-base font-semibold text-gold-400">Total</span>
                <span className="text-xl font-bold text-gold-400">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => handleDownload(selectedInvoice)} className="flex-1 btn-gold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2">
                <Download size={16} /> Download PDF
              </button>
              <button onClick={() => handleWhatsApp(selectedInvoice)} className="flex-1 py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold transition-all">
                <Send size={16} /> WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
