import { useState, useEffect } from "react";
import {
  Users, Plus, Search, Phone, MapPin, User, X, UserPlus, Calendar,
} from "lucide-react";
import { getCustomers, createCustomer } from "../api";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { StatCardSkeleton } from "../components/ui/skeleton";
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
          <h1 className="text-2xl font-display font-bold text-gradient-gold" style={{ lineHeight: '1.35' }}>
            Customers
          </h1>
          <p className="text-sm text-dark-500" style={{ lineHeight: '1.5', marginTop: '4px' }}>
            {customers.length} total customers
          </p>
        </div>
        <Button
          id="add-customer-btn"
          onClick={() => setShowModal(true)}
          size="lg"
          className="self-start"
        >
          <UserPlus size={16} />
          Add Customer
        </Button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      ) : customers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
          {customers.map((c) => (
            <Card key={c._id} hover className="animate-fade-in-up" style={{ opacity: 0 }}>
              <CardContent className="pt-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-600/10 flex items-center justify-center shrink-0">
                    <User size={18} className="text-gold-400/70" />
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
                    <div className="flex items-center gap-1.5 mt-2.5">
                      <Badge variant="neutral">
                        <Calendar size={9} />
                        {new Date(c.createdAt).toLocaleDateString("en-IN")}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      <Dialog open={showModal} onClose={() => setShowModal(false)}>
        <DialogHeader>
          <div className="w-14 h-14 rounded-full bg-gold-500/15 flex items-center justify-center mx-auto mb-3 animate-scale-in">
            <UserPlus size={24} className="text-gold-400" />
          </div>
          <DialogTitle>Add Customer</DialogTitle>
        </DialogHeader>

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
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Enter address"
              className="input-gold w-full px-4 py-3 rounded-xl text-sm"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            size="xl"
            className="w-full mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-dark-900/30 border-t-dark-900 rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus size={16} />
                Add Customer
              </>
            )}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
