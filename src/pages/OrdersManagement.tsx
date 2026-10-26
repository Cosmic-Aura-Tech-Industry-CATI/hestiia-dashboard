import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Eye,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Order } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const OrdersManagement: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>(searchParams.get('orderStatus') || 'all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [fulfillmentType, setFulfillmentType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const { error } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getOrders({
        search: searchQuery || undefined,
        orderStatus: orderStatus !== 'all' ? orderStatus : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        fulfillmentType: fulfillmentType !== 'all' ? fulfillmentType : undefined,
        page,
        limit: 15,
      });

      if (res.success) {
        setOrders(res.orders);
        setTotalPages(res.totalPages);
        setTotalOrders(res.total);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch customer orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [orderStatus, paymentStatus, fulfillmentType, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dining & Online Orders"
        subtitle="Live queue of dining room, self-pickup and PAC Road delivery orders"
        action={
          <div className="text-xs text-beige bg-charcoal-card border border-charcoal-border px-3.5 py-2 rounded-xl">
            Total Orders Logged: <strong className="text-gold font-bold">{totalOrders}</strong>
          </div>
        }
      />

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Order #, name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
          </form>

          {/* Order Status */}
          <select
            value={orderStatus}
            onChange={(e) => {
              setOrderStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Order Stages</option>
            <option value="pending">Pending Review</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">In Kitchen (Preparing)</option>
            <option value="ready_for_pickup">Ready for Pickup</option>
            <option value="out_for_delivery">Out for Delivery</option>
            <option value="completed">Completed / Fulfilled</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status */}
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Payment Statuses</option>
            <option value="paid">Paid & Reconciled</option>
            <option value="pending">Pending Collection</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {/* Fulfillment Type */}
          <select
            value={fulfillmentType}
            onChange={(e) => {
              setFulfillmentType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Fulfillment Channels</option>
            <option value="delivery">Home Delivery</option>
            <option value="dine-in">Dine-In Table</option>
            <option value="pickup">Takeaway / Pickup</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <LoadingState message="Fetching live order queue..." />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No Orders Found"
          description="No customer orders match your selected filters. You can clear your filters to view all orders."
          action={
            <button
              onClick={() => {
                setOrderStatus('all');
                setPaymentStatus('all');
                setFulfillmentType('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl"
            >
              Reset All Filters
            </button>
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Order #</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Ordered Dishes</th>
                  <th className="py-3.5 px-4 font-semibold">Total Amount</th>
                  <th className="py-3.5 px-4 font-semibold">Fulfillment</th>
                  <th className="py-3.5 px-4 font-semibold">Payment</th>
                  <th className="py-3.5 px-4 font-semibold">Order Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-charcoal/40 transition-colors">
                    {/* Order Number */}
                    <td className="py-3.5 px-4 font-serif font-bold text-warmwhite">
                      <Link to={`/admin/orders/${order.id}`} className="hover:text-gold transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-beige whitespace-nowrap">
                      <div>{new Date(order.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                      <div className="text-[10px] text-beige-muted">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite">{order.customerName}</div>
                      <div className="text-[10px] text-beige-muted flex items-center space-x-1">
                        <Phone className="w-2.5 h-2.5 text-gold" />
                        <span>{order.customerPhone}</span>
                      </div>
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 text-beige max-w-[200px] truncate" title={order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}>
                      {order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 font-serif font-bold text-warmwhite whitespace-nowrap">
                      ₹{order.grandTotal}
                    </td>

                    {/* Fulfillment */}
                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-charcoal border border-charcoal-border text-[11px] text-beige">
                        {order.fulfillmentType}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={order.paymentStatus} type="payment" />
                      <div className="text-[9px] uppercase text-beige-muted mt-0.5">
                        {order.paymentMethod}
                      </div>
                    </td>

                    {/* Order Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={order.orderStatus} type="order" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1 transition-all"
                      >
                        <span>Manage</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of <strong className="text-warmwhite">{totalPages}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
