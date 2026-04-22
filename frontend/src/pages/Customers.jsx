import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  User,
  X,
  UserPlus,
} from "lucide-react";
import { getCustomers, createCustomer } from "../api";
import toast from "react-hot-toast";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async (query = "") => {
    try {
      const { data } = await getCustomers(query);
      setCustomers(data);
    } catch {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchCustomers(value);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setSubmitting(true);
    try {
      await createCustomer(form);
      toast.success("Customer added!");
      setForm({ name: "", phone: "", address: "" });
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add customer");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-display font-bold text-gradient-gold">
            Customers
          </h1>
          <p className="text-sm text-dark-500 mt-1">
            {customers.length} total customers
          </p>
        </div>
        <button
          id="add-customer-btn"
          onClick={() => setShowModal(true)}
          className="btn-gold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 self-start"
        >
          <UserPlus size={16} />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative animate-fade-in-up" style={{ animationDelay: "100ms", opacity: 0 }}>
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
        <input
          id="customer-search"
          type="text"
          value={search}
          onChange={handleSearch}
          placeholder="Search by name or phone..."
          className="input-gold w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-[3px] border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
        </div>
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {customers.map((c) => (
            <div key={c._id} className="glass rounded-2xl p-5 card-hover animate-fade-in-up" style={{ opacity: 0 }}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                  <User size={17} className="text-gold-400/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">
                    {c.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-dark-400">
                    <Phone size={11} />
                    +91 {c.phone}
                  </div>
                  {c.address && (
                    <div className="flex items-start gap-1.5 mt-1 text-xs text-dark-500">
                      <MapPin size={11} className="shrink-0 mt-0.5" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-dark-600 mt-2">
                    Added {new Date(c.createdAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-dark-500 animate-fade-in">
          <Users size={48} className="mx-auto mb-4 opacity-15" />
          <p className="text-sm">No customers found</p>
          <p className="text-xs mt-1 opacity-60">Add your first customer</p>
        </div>
      )}

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 modal-overlay">
          <div className="glass rounded-2xl p-8 max-w-md w-full relative modal-content">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-dark-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <UserPlus size={20} className="text-gold-400" />
              Add Customer
            </h2>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  Name <span className="text-gold-500">*</span>
                </label>
                <input
                  id="modal-customer-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Customer name"
                  className="input-gold w-full px-4 py-3 rounded-xl text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  Phone <span className="text-gold-500">*</span>
                </label>
                <input
                  id="modal-customer-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="9876543210"
                  maxLength={10}
                  className="input-gold w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1.5 block font-medium">
                  Address
                </label>
                <input
                  id="modal-customer-address"
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Enter address"
                  className="input-gold w-full px-4 py-3 rounded-xl text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-gold py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={16} />
                    Add Customer
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
