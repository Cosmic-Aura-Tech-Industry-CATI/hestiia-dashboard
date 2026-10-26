import React, { useState, useEffect } from 'react';
import { Search, Phone, Mail, ShoppingBag, Eye, Calendar, UserCheck, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Customer, Order } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { useToast } from '../components/common/ToastContext';

export const CustomersManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('totalSpent');
  const [selectedCustomer, setSelectedCustomer] = useState<{ customer: Customer; orders: Order[] } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { error } = useToast();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getCustomers({
        search: searchQuery || undefined,
        sortBy,
      });
      if (res.success) {
        setCustomers(res.customers);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch customer database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers();
  };

  const handleViewCustomer = async (cust: Customer) => {
    try {
      setIsLoadingDetails(true);
      const res = await adminApi.getCustomerDetails(cust.id);
      if (res.success) {
        setSelectedCustomer({ customer: res.customer, orders: res.orders });
      }
    } catch (err: any) {
      error(err.message || 'Failed to load customer profile history.');
    } finally {
      setIsLoadingDetails(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory & Order History"
        subtitle="Track patron loyalty, dining frequency, lifetime spending and order archives"
      />

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search customer name, phone number, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-beige whitespace-nowrap">Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none w-full sm:w-auto"
          >
            <option value="totalSpent">Highest Lifetime Spend</option>
            <option value="totalOrders">Most Orders Placed</option>
            <option value="lastOrderDate">Recent Dining Activity</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading patron directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No Customers Found"
          description="Customer accounts will automatically be organized here as orders are placed."
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
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-warmwhite text-sm">{c.name}</div>
                          <div className="text-[10px] text-beige-muted">Patron ID: {c.id}</div>
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
                      ₹{c.totalSpent.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3.5 px-4 text-beige">
                      {new Date(c.lastOrderDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewCustomer(c)}
                        className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Orders</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Order History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-2xl bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <button
              onClick={() => setSelectedCustomer(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex items-start space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-gold/20 border border-gold text-gold font-bold text-xl flex items-center justify-center flex-shrink-0">
                {selectedCustomer.customer.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-warmwhite">
                  {selectedCustomer.customer.name}
                </h2>
                <div className="flex items-center space-x-3 text-xs text-beige mt-1">
                  <span>{selectedCustomer.customer.phone}</span>
                  {selectedCustomer.customer.email && <span>• {selectedCustomer.customer.email}</span>}
                </div>
                <div className="flex items-center space-x-4 text-xs font-semibold text-gold mt-2">
                  <span>Total Spent: ₹{selectedCustomer.customer.totalSpent}</span>
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
                      {o.items.map((i) => `${i.name} x ${i.quantity}`).join(', ')}
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
    </div>
  );
};
