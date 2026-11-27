'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Flame,
  Radio,
  Plus,
  LayoutGrid,
  LayoutList,
  RefreshCw,
  UtensilsCrossed,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Order } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';
import { NewOrderModal } from '../components/orders/NewOrderModal';

export const OrdersManagement: React.FC = () => {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSilentRefreshing, setIsSilentRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderStatus, setOrderStatus] = useState<string>(searchParams?.get('orderStatus') || 'all');
  const [paymentStatus, setPaymentStatus] = useState<string>('all');
  const [fulfillmentType, setFulfillmentType] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [liveKitchenCount, setLiveKitchenCount] = useState<number | null>(null);

  // Dual View Mode & Walk-In Modal
  const [viewMode, setViewMode] = useState<'table' | 'kds'>('table');
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const { error } = useToast();

  const fetchLiveKitchenCount = async () => {
    try {
      const res = await adminApi.getLiveOrders();
      if (res.success) setLiveKitchenCount(res.count);
    } catch {
      // Non-critical fallback
    }
  };

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsSilentRefreshing(true);

      const res = await adminApi.getOrders({
        search: searchQuery || undefined,
        orderStatus: orderStatus !== 'all' ? orderStatus : undefined,
        paymentStatus: paymentStatus !== 'all' ? paymentStatus : undefined,
        fulfillmentType: fulfillmentType !== 'all' ? fulfillmentType : undefined,
        page,
        limit: viewMode === 'kds' ? 50 : 15,
      });

      if (res.success) {
        setOrders(res.orders);
        setTotalPages(res.totalPages);
        setTotalOrders(res.total);
      }
    } catch (err: any) {
      if (!silent) {
        error(err.message || 'Failed to fetch customer orders.');
      }
    } finally {
      if (!silent) setIsLoading(false);
      else setIsSilentRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveKitchenCount();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [orderStatus, paymentStatus, fulfillmentType, page, viewMode]);

  // Background Auto-Polling every 25 seconds for live order flow
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true);
      fetchLiveKitchenCount();
    }, 25000);
    return () => clearInterval(interval);
  }, [orderStatus, paymentStatus, fulfillmentType, page, searchQuery, viewMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleOrderCreated = (newOrder: Order) => {
    setOrders((prev) => [newOrder, ...prev]);
    setTotalOrders((prev) => prev + 1);
    fetchLiveKitchenCount();
  };

  // Helper for relative time (e.g., "5m ago")
  const getElapsedString = (timestamp: string) => {
    const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    return `${hours}h ago`;
  };

  // KDS Columns Grouping
  const kdsColumns = useMemo(() => {
    const pendingList = orders.filter((o) => o.orderStatus === 'pending');
    const preparingList = orders.filter((o) => ['confirmed', 'preparing'].includes(o.orderStatus));
    const readyList = orders.filter((o) => ['ready_for_pickup', 'out_for_delivery'].includes(o.orderStatus));
    const completedList = orders.filter((o) => ['completed', 'cancelled'].includes(o.orderStatus));

    return [
      {
        id: 'pending',
        title: 'New / Pending Review',
        color: 'border-amber-500/40 text-amber-300',
        badgeBg: 'bg-amber-500/20 text-amber-300',
        orders: pendingList,
      },
      {
        id: 'preparing',
        title: 'Kitchen Active / Fire',
        color: 'border-purple-500/40 text-purple-300',
        badgeBg: 'bg-purple-500/20 text-purple-300',
        orders: preparingList,
      },
      {
        id: 'ready',
        title: 'Dispatch & Ready',
        color: 'border-blue-500/40 text-blue-300',
        badgeBg: 'bg-blue-500/20 text-blue-300',
        orders: readyList,
      },
      {
        id: 'completed',
        title: 'Fulfilled / History',
        color: 'border-emerald-500/40 text-emerald-300',
        badgeBg: 'bg-emerald-500/20 text-emerald-300',
        orders: completedList,
      },
    ];
  }, [orders]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dining & Online Orders"
        subtitle="Real-time kitchen management, dispatch queue, and counter billing console"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Live Kitchen Badge */}
            {liveKitchenCount !== null && liveKitchenCount > 0 && (
              <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold">
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Kitchen Active: {liveKitchenCount} order(s)</span>
              </div>
            )}

            {/* Silent refresh indicator */}
            {isSilentRefreshing && (
              <span className="text-[11px] text-beige-muted flex items-center space-x-1">
                <RefreshCw className="w-3 h-3 animate-spin text-gold" />
                <span>Syncing live...</span>
              </span>
            )}

            {/* View Mode Switcher */}
            <div className="flex items-center bg-charcoal border border-charcoal-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'table'
                    ? 'bg-gold text-charcoal-950 font-bold shadow-sm'
                    : 'text-beige hover:text-warmwhite'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('kds')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === 'kds'
                    ? 'bg-gold text-charcoal-950 font-bold shadow-sm'
                    : 'text-beige hover:text-warmwhite'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kitchen KDS</span>
              </button>
            </div>

            {/* Walk-In POS Order Button */}
            <button
              type="button"
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Walk-In Order</span>
            </button>
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

      {/* Main Content Area: Table vs KDS */}
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
      ) : viewMode === 'kds' ? (
        /* ========================================================================= */
        /* KITCHEN DISPLAY SYSTEM (KDS) KANBAN BOARD                                 */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {kdsColumns.map((col) => (
            <div
              key={col.id}
              className={`rounded-3xl bg-charcoal-card/80 border ${col.color} p-4 flex flex-col space-y-3 min-h-[500px] shadow-lg`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-charcoal-border pb-3">
                <h3 className="font-serif font-bold text-sm text-warmwhite flex items-center space-x-1.5">
                  <span>{col.title}</span>
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                  {col.orders.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[75vh] pr-1">
                {col.orders.length === 0 ? (
                  <div className="text-center py-10 text-xs text-beige-muted italic">
                    No active orders in this stage
                  </div>
                ) : (
                  col.orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-2xl bg-charcoal border border-charcoal-border hover:border-gold/50 transition-all shadow-md space-y-3 group"
                    >
                      {/* Top bar: Order # & Time */}
                      <div className="flex items-center justify-between text-xs">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="font-serif font-bold text-gold text-sm group-hover:underline flex items-center space-x-1"
                        >
                          <span>{order.orderNumber}</span>
                        </Link>
                        <span className="text-[11px] text-beige-muted flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-gold/70" />
                          <span>{getElapsedString(order.createdAt)}</span>
                        </span>
                      </div>

                      {/* Customer & Fulfillment */}
                      <div className="flex items-center justify-between text-[11px] text-beige">
                        <span className="font-semibold text-warmwhite truncate max-w-[130px]">
                          {order.customerName}
                        </span>
                        <span className="capitalize px-2 py-0.5 rounded-md bg-charcoal-card border border-charcoal-border text-[10px] font-medium text-gold">
                          {order.fulfillmentType}
                        </span>
                      </div>

                      {/* Items Ordered */}
                      <div className="p-2.5 rounded-xl bg-charcoal-card/60 border border-charcoal-border/60 text-xs space-y-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-warmwhite text-[11px]">
                            <span className="truncate pr-2 font-medium">
                              {i.quantity}x {i.name}
                            </span>
                            <span className="text-beige-muted text-[10px]">₹{i.price * i.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Notes if present */}
                      {order.notes && (
                        <div className="text-[10px] italic text-amber-300 bg-amber-950/20 border border-amber-500/20 px-2 py-1 rounded-lg">
                          "{order.notes}"
                        </div>
                      )}

                      {/* Bottom row: Total, Payment, Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-charcoal-border/70 text-xs">
                        <div>
                          <span className="text-[10px] text-beige-muted block">Total</span>
                          <span className="font-serif font-bold text-warmwhite">₹{order.grandTotal}</span>
                        </div>

                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold hover:text-charcoal-950 text-gold text-[11px] font-bold inline-flex items-center space-x-1 transition-all"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* STANDARD TABLE VIEW                                                       */
        /* ========================================================================= */
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
                      <Link href={`/admin/orders/${order.id}`} className="hover:text-gold transition-colors">
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
                        href={`/admin/orders/${order.id}`}
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

      {/* New Walk-In Order POS Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};
