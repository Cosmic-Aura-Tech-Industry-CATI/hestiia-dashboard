'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Phone,
  Mail,
  ShoppingBag,
  Eye,
  X,
  Award,
  Plus,
  Edit2,
  Trash2,
  Lock,
  MapPin,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { AdminUser, Customer, CustomerStatsSummary, Order } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

export const CustomersManagement: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);
  const isSuperadmin = (currentUser?.role || '').toUpperCase() === 'SUPERADMIN';
  const { success, error } = useToast();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  // Order History Modal
  const [selectedCustomer, setSelectedCustomer] = useState<{ customer: Customer; orders: Order[] } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Create / Edit Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation (Superadmin only)
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    if (isStaff) return;
    try {
      const res = await adminApi.getCustomerStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {
      // Non-critical stats
    }
  }, [isStaff]);

  const fetchCustomers = useCallback(
    async (targetPage = page) => {
      if (isStaff) {
        setIsLoading(false);
        return;
      }
      try {
        setIsLoading(true);
        const res = await adminApi.getCustomers({
          search: searchQuery.trim() || undefined,
          sortBy,
          sortOrder,
          page: targetPage,
          limit: 20,
        });
        if (res.success) {
          setCustomers(res.customers || []);
          setTotalPages(res.totalPages || 1);
          setTotalCustomers(res.total ?? res.customers?.length ?? 0);
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch customer database.');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, searchQuery, sortBy, sortOrder, page]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    fetchCustomers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setPage(1);
    adminApi
      .getCustomers({ sortBy, sortOrder, page: 1, limit: 20 })
      .then((res) => {
        if (res.success) {
          setCustomers(res.customers || []);
          setTotalPages(res.totalPages || 1);
          setTotalCustomers(res.total ?? 0);
        }
      })
      .catch(() => {});
  };

  const handleViewCustomer = async (cust: Customer) => {
    try {
      setIsLoadingDetails(true);
      const res = await adminApi.getCustomerDetails(cust.id);
      if (res.success) {
        setSelectedCustomer({ customer: res.customer, orders: res.orders || [] });
      }
    } catch (err: any) {
      error(err.message || 'Failed to load customer profile history.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer({ ...cust });
    setIsFormOpen(true);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.name?.trim() || !editingCustomer?.phone?.trim()) {
      error('Customer name and phone number are required.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingCustomer.id) {
        const res = await adminApi.updateCustomer(editingCustomer.id, {
          name: editingCustomer.name.trim(),
          phone: editingCustomer.phone.trim(),
          email: (editingCustomer.email || '').trim(),
          address: (editingCustomer.address || '').trim(),
          notes: (editingCustomer.notes || '').trim(),
        });
        if (res.success) {
          success(res.message || 'Customer updated.');
          setIsFormOpen(false);
          fetchCustomers(page);
          fetchStats();
        }
      } else {
        const res = await adminApi.createCustomer({
          name: editingCustomer.name.trim(),
          phone: editingCustomer.phone.trim(),
          email: (editingCustomer.email || '').trim() || undefined,
          address: (editingCustomer.address || '').trim() || undefined,
          notes: (editingCustomer.notes || '').trim() || undefined,
        });
        if (res.success) {
          success(res.message || 'Customer created.');
          setIsFormOpen(false);
          setPage(1);
          fetchCustomers(1);
          fetchStats();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save customer profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setIsDeleting(true);
      const res = await adminApi.deleteCustomer(deletingCustomer.id);
      if (res.success) {
        success(res.message || 'Customer profile deleted.');
        setDeletingCustomer(null);
        fetchCustomers(page);
        fetchStats();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete customer.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Customer Directory & Order History"
          subtitle="Track patron loyalty, dining frequency, lifetime spending and order archives"
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            Customer CRM records and lifetime spend analytics are restricted to Manager and Superadmin accounts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory & Order History"
        subtitle="Track patron loyalty, dining frequency, lifetime spending and order archives"
        action={
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        }
      />

      {/* Customer CRM KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
          <span className="text-[10px] text-beige-muted uppercase tracking-wider font-semibold">Total Patrons</span>
          <div className="text-xl font-serif font-bold text-warmwhite mt-0.5">
            {stats?.totalCustomers ?? totalCustomers}
          </div>
          <span className="text-[10px] text-beige-muted">Unique guest records</span>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-purple-500/30">
          <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Repeat Patrons</span>
          <div className="text-xl font-serif font-bold text-purple-300 mt-0.5">
            {stats?.repeatCustomers ?? 0}
          </div>
          <span className="text-[10px] text-beige-muted">2+ verified orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-500/30">
          <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">New Guests</span>
          <div className="text-xl font-serif font-bold text-emerald-300 mt-0.5">{stats?.newCustomers ?? 0}</div>
          <span className="text-[10px] text-beige-muted">First-time diners</span>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-gold/30">
          <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">CRM Revenue</span>
          <div className="text-xl font-serif font-bold text-gold mt-0.5">
            ₹{(stats?.totalRevenueFromCustomers ?? 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-beige-muted">{stats?.totalOrdersPlaced ?? 0} total orders</span>
        </div>

        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
          <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">Avg Spend / Guest</span>
          <div className="text-xl font-serif font-bold text-gold mt-0.5">
            ₹{(stats?.averageSpendPerCustomer ?? 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-beige-muted">Lifetime dining average</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-md">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer name, phone number, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                title="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-xs font-semibold text-warmwhite hover:text-gold transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none w-full sm:w-auto cursor-pointer"
          >
            <option value="totalSpent">Lifetime Spend</option>
            <option value="totalOrders">Orders Count</option>
            <option value="lastOrderDate">Last Order Date</option>
            <option value="createdAt">Newest Added</option>
            <option value="name">Customer Name</option>
          </select>
          <button
            type="button"
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="p-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer shrink-0"
            title={`Sort order: ${sortOrder.toUpperCase()}`}
          >
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading patron directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Customer accounts are created automatically on checkout or can be added manually."
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
            >
              Add First Customer
            </button>
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                  <th className="py-3.5 px-4 font-semibold">Orders Count</th>
                  <th className="py-3.5 px-4 font-semibold">Lifetime Spend</th>
                  <th className="py-3.5 px-4 font-semibold">Last Order Date</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/40 text-gold font-bold flex items-center justify-center flex-shrink-0">
                          {(c.name || 'G').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-warmwhite text-sm flex items-center space-x-1.5">
                            <span>{c.name}</span>
                            {(c.totalOrders >= 4 || c.totalSpent >= 3000) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/20 text-gold border border-gold/40 flex items-center space-x-0.5">
                                <Award className="w-2.5 h-2.5" />
                                <span>VIP</span>
                              </span>
                            )}
                          </div>
                          {c.notes && (
                            <div className="text-[10px] text-beige-muted line-clamp-1 max-w-xs">{c.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-warmwhite flex items-center space-x-1 font-mono">
                        <Phone className="w-3 h-3 text-gold" />
                        <span>{c.phone}</span>
                      </div>
                      {c.email && (
                        <div className="text-[10px] text-beige-muted flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-charcoal border border-charcoal-border text-gold font-bold text-xs">
                        {c.totalOrders} order(s)
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-serif font-bold text-warmwhite text-sm">
                      ₹{(c.totalSpent || 0).toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-beige">
                      {c.lastOrderDate
                        ? new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No orders yet'}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          type="button"
                          disabled={isLoadingDetails}
                          onClick={() => handleViewCustomer(c)}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Orders</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isSuperadmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingCustomer(c)}
                            className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Customer (Superadmin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of{' '}
                <strong className="text-warmwhite">{totalPages}</strong> ({totalCustomers} patrons)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchCustomers(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchCustomers(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-2xl bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 border border-gold text-gold font-bold text-xl flex items-center justify-center flex-shrink-0">
                {(selectedCustomer.customer.name || 'G').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-2xl font-bold text-warmwhite">
                  {selectedCustomer.customer.name}
                </h2>
                <div className="flex flex-wrap items-center gap-3 text-xs text-beige mt-1">
                  <span>{selectedCustomer.customer.phone}</span>
                  {selectedCustomer.customer.email && <span>• {selectedCustomer.customer.email}</span>}
                </div>
                {selectedCustomer.customer.address && (
                  <div className="text-xs text-beige-muted mt-1 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>{selectedCustomer.customer.address}</span>
                  </div>
                )}
                {selectedCustomer.customer.notes && (
                  <div className="text-xs text-amber-300 mt-1.5 bg-amber-950/30 border border-amber-500/30 rounded-xl px-3 py-1.5">
                    CRM Note: {selectedCustomer.customer.notes}
                  </div>
                )}
                <div className="flex items-center space-x-4 text-xs font-semibold text-gold mt-2">
                  <span>Total Spent: ₹{selectedCustomer.customer.totalSpent.toLocaleString('en-IN')}</span>
                  <span>Total Orders: {selectedCustomer.customer.totalOrders}</span>
                </div>
              </div>
            </div>

            <h3 className="font-serif text-lg font-semibold text-warmwhite mb-3 flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-gold" />
              <span>Full Order History</span>
            </h3>

            {selectedCustomer.orders.length === 0 ? (
              <p className="text-xs text-beige italic">No historical orders logged for this patron.</p>
            ) : (
              <div className="space-y-3">
                {selectedCustomer.orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-4 rounded-2xl bg-charcoal border border-charcoal-border hover:border-gold/30 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-serif font-bold text-warmwhite text-sm">{o.orderNumber}</span>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={o.orderStatus} type="order" />
                        <StatusBadge status={o.paymentStatus} type="payment" />
                      </div>
                    </div>

                    <div className="text-beige text-[11px] mb-2">
                      {(o.items || []).map((i) => `${i.name} x ${i.quantity}`).join(', ')}
                    </div>

                    <div className="flex items-center justify-between text-beige-muted pt-2 border-t border-charcoal-border/60">
                      <span>{new Date(o.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
                      <span className="font-serif font-bold text-warmwhite text-sm">₹{o.grandTotal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Customer Modal */}
      {isFormOpen && editingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-serif text-xl font-bold text-warmwhite">
              {editingCustomer.id ? `Edit Customer: ${editingCustomer.name}` : 'Add New Customer'}
            </h2>

            <form onSubmit={handleSaveCustomer} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Full Name *</label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={editingCustomer.name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editingCustomer.phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={editingCustomer.email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Address</label>
                <input
                  type="text"
                  value={editingCustomer.address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Internal CRM Notes</label>
                <textarea
                  rows={2}
                  placeholder="Dietary preferences, VIP notes, favorite table..."
                  value={editingCustomer.notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Customer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCustomer)}
        title="Delete Customer Profile"
        message={`Are you sure you want to permanently delete "${deletingCustomer?.name}" (${deletingCustomer?.phone})?`}
        confirmLabel="Delete Customer"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
};
