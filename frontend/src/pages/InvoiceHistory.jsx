import { useState, useEffect } from "react";
import {
  FileText, Search, Download, Send, Eye, X, Receipt, Trash2, Lock, AlertTriangle,
} from "lucide-react";
import { getInvoices, deleteInvoice } from "../api";
import { formatCurrency, PURITY_LABELS } from "../billingLogic";
import { downloadInvoicePDF, shareInvoiceViaWhatsApp } from "../components/PDFGenerator";
import { Card, CardContent, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { TableRowSkeleton } from "../components/ui/skeleton";
import toast from "react-hot-toast";

export default function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const result = await shareInvoiceViaWhatsApp(invoice);
      if (result.method === "share") {
        toast.success("PDF shared via WhatsApp!");
      } else if (result.method === "download-and-chat") {
        toast.success("PDF downloaded! Attach it in the WhatsApp chat.", { duration: 5000 });
      } else if (result.method !== "cancelled") {
        toast.success("WhatsApp opened!");
      }
    } catch { toast.error("Failed"); }
  };

  // Delete with password verification
  const handleDeleteConfirm = async () => {
    if (!deletePassword.trim()) {
      toast.error("Please enter your admin password");
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteInvoice(deleteTarget._id, deletePassword);
      toast.success(`Invoice ${deleteTarget.invoiceNumber} deleted successfully`);
      setDeleteTarget(null);
      setDeletePassword("");
      fetchInvoices(search);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete invoice");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteModal = (invoice) => {
    setDeleteTarget(invoice);
    setDeletePassword("");
    setShowPassword(false);
  };

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-down">
        <h1 className="text-2xl font-display font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>Invoice History</h1>
        <p className="text-sm text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>{invoices.length} total invoices</p>
      </div>

      <div className="relative animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
        <input type="text" value={search} onChange={handleSearch}
          placeholder="Search by invoice #, customer name, or phone..."
          className="input-gold w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm" />
      </div>

      {loading ? (
        <Card className="animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          <CardContent className="pt-5 space-y-2">
            {[...Array(6)].map((_, i) => <TableRowSkeleton key={i} />)}
          </CardContent>
        </Card>
      ) : invoices.length > 0 ? (
        <Card className="overflow-hidden animate-fade-in-up" style={{ animationDelay: "200ms", opacity: 0 }}>
          {/* Desktop Table */}
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
                  <tr key={inv._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-5 py-4"><Badge variant="gold">{inv.invoiceNumber}</Badge></td>
                    <td className="px-5 py-4"><p className="text-sm text-white font-medium">{inv.customerName}</p><p className="text-[10px] text-dark-500">+91 {inv.customerPhone}</p></td>
                    <td className="px-5 py-4 text-sm text-dark-400">{new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-5 py-4"><Badge variant="neutral">{inv.items.length} items</Badge></td>
                    <td className="px-5 py-4 text-right"><span className="text-sm font-bold text-gold-400 tabular-nums">{formatCurrency(inv.totalAmount)}</span></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setSelectedInvoice(inv)} className="p-2 rounded-lg hover:bg-white/[0.05] text-dark-500 hover:text-white transition-all" title="View"><Eye size={15} /></button>
                        <button onClick={() => handleDownload(inv)} className="p-2 rounded-lg hover:bg-gold-500/10 text-dark-500 hover:text-gold-400 transition-all" title="PDF"><Download size={15} /></button>
                        <button onClick={() => handleWhatsApp(inv)} className="p-2 rounded-lg hover:bg-emerald-500/10 text-dark-500 hover:text-emerald-400 transition-all" title="WhatsApp"><Send size={15} /></button>
                        <button onClick={() => openDeleteModal(inv)} className="p-2 rounded-lg hover:bg-red-500/10 text-dark-500 hover:text-red-400 transition-all" title="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-white/[0.03]">
            {invoices.map((inv) => (
              <div key={inv._id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge variant="gold" className="mb-1">{inv.invoiceNumber}</Badge>
                    <p className="text-sm font-medium text-white mt-1">{inv.customerName}</p>
                  </div>
                  <span className="text-sm font-bold text-gold-400 tabular-nums">{formatCurrency(inv.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-dark-500">{new Date(inv.createdAt).toLocaleDateString("en-IN")} · {inv.items.length} items</span>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedInvoice(inv)} className="p-1.5 rounded text-dark-500 hover:text-white"><Eye size={14} /></button>
                    <button onClick={() => handleDownload(inv)} className="p-1.5 rounded text-dark-500 hover:text-gold-400"><Download size={14} /></button>
                    <button onClick={() => handleWhatsApp(inv)} className="p-1.5 rounded text-dark-500 hover:text-emerald-400"><Send size={14} /></button>
                    <button onClick={() => openDeleteModal(inv)} className="p-1.5 rounded text-dark-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 text-dark-500 animate-fade-in">
          <Receipt size={48} className="mx-auto mb-4 opacity-15" />
          <p className="text-sm">No invoices found</p>
        </div>
      )}

      {/* ====== DELETE CONFIRMATION MODAL ====== */}
      <Dialog open={!!deleteTarget} onClose={() => { setDeleteTarget(null); setDeletePassword(""); }}>
        {deleteTarget && (
          <>
            <DialogHeader>
              <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-3 animate-scale-in">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
              <DialogTitle>Delete Invoice</DialogTitle>
              <p className="text-xs text-dark-400 mt-1">This action cannot be undone</p>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-red-500/[0.05] rounded-xl p-4 border border-red-500/10">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-400">Invoice</span>
                  <Badge variant="gold">{deleteTarget.invoiceNumber}</Badge>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-dark-400">Customer</span>
                  <span className="text-white font-medium">{deleteTarget.customerName}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-dark-400">Amount</span>
                  <span className="text-gold-400 font-bold">{formatCurrency(deleteTarget.totalAmount)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  <Lock size={10} className="inline mr-1" />
                  ADMIN PASSWORD <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter admin password to confirm"
                    className="input-gold w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleDeleteConfirm()}
                  />
                </div>
                <p className="text-[10px] text-dark-600 mt-1.5">Enter your login password to verify you are admin</p>
              </div>

              <DialogFooter>
                <button
                  onClick={() => { setDeleteTarget(null); setDeletePassword(""); }}
                  className="flex-1 py-3 rounded-xl text-sm text-dark-300 bg-dark-700/50 hover:bg-dark-700 transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading || !deletePassword.trim()}
                  className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteLoading ? (
                    <div className="w-5 h-5 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <><Trash2 size={14} /> Delete Invoice</>
                  )}
                </button>
              </DialogFooter>
            </div>
          </>
        )}
      </Dialog>

      {/* Detail Modal */}
      <Dialog open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {selectedInvoice && (
          <>
            <div className="text-center mb-6 border-b border-gold-500/10 pb-6">
              <h2 className="font-display text-2xl font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>Daksh Jewellers</h2>
              <p className="text-[10px] text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>Shop No. 1, Ramavtar Market, Near Hill View Garden, Vill. Thada (Alwar) Rajasthan</p>
              <Badge variant="gold" className="mt-3">{selectedInvoice.invoiceNumber}</Badge>
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
              <div className="flex justify-between text-sm"><span className="text-dark-500">Metal Value</span><span className="text-dark-200">{formatCurrency(selectedInvoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-dark-500">Making Charges</span><span className="text-dark-200">{formatCurrency(selectedInvoice.makingCharges)}</span></div>
              {selectedInvoice.stoneCharges > 0 && <div className="flex justify-between text-sm"><span className="text-dark-500">Stone Charges</span><span className="text-dark-200">{formatCurrency(selectedInvoice.stoneCharges)}</span></div>}
              {selectedInvoice.discount > 0 && <div className="flex justify-between text-sm"><span className="text-emerald-400">Discount</span><span className="text-emerald-400">- {formatCurrency(selectedInvoice.discount)}</span></div>}
              <div className="border-t border-gold-500/15 pt-3 flex justify-between">
                <span className="text-base font-semibold text-gold-400">Total</span>
                <span className="text-xl font-bold text-gold-400">{formatCurrency(selectedInvoice.totalAmount)}</span>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleDownload(selectedInvoice)} size="lg" className="flex-1">
                <Download size={16} /> Download PDF
              </Button>
              <Button onClick={() => handleWhatsApp(selectedInvoice)} variant="success" size="lg" className="flex-1">
                <Send size={16} /> WhatsApp
              </Button>
            </DialogFooter>
          </>
        )}
      </Dialog>
    </div>
  );
}
