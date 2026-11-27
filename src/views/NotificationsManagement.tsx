'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
  Send,
  X,
  ShoppingBag,
  CalendarCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import {
  AdminUser,
  NotificationChannel,
  NotificationItem,
  NotificationRecipientType,
} from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const NotificationsManagement: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);
  const { success, error } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination
  const [readFilter, setReadFilter] = useState<'all' | 'false' | 'true'>('all');
  const [recipientFilter, setRecipientFilter] = useState<'all' | NotificationRecipientType>(
    isStaff ? 'staff' : 'all'
  );
  const [page, setPage] = useState(1);
  const limit = 25;

  // Dispatch Modal
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newRecipient, setNewRecipient] = useState<NotificationRecipientType>('staff');
  const [newChannel, setNewChannel] = useState<NotificationChannel>('in_app');

  const fetchNotifications = useCallback(
    async (silent = false, targetPage = page) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminApi.getNotifications({
          recipientType: recipientFilter !== 'all' ? recipientFilter : undefined,
          isRead: readFilter !== 'all' ? readFilter : undefined,
          limit,
          skip: (targetPage - 1) * limit,
        });
        if (res.success) {
          setNotifications(res.notifications || []);
          setTotal(res.total || 0);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err: any) {
        error(err.message || 'Failed to load notifications.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recipientFilter, readFilter, page]
  );

  useEffect(() => {
    setPage(1);
    fetchNotifications(false, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipientFilter, readFilter]);

  useEffect(() => {
    const handleSync = () => fetchNotifications(true, page);
    window.addEventListener('hestiia:notifications-updated', handleSync);
    return () => window.removeEventListener('hestiia:notifications-updated', handleSync);
  }, [fetchNotifications, page]);

  const adminAlertsCount = useMemo(
    () => notifications.filter((n) => n.recipientType === 'admin').length,
    [notifications]
  );
  const staffAlertsCount = useMemo(
    () => notifications.filter((n) => n.recipientType === 'staff').length,
    [notifications]
  );

  const handleMarkAsRead = async (id: string) => {
    try {
      const res = await adminApi.markNotificationAsRead(id);
      if (res.success) {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event('hestiia:notifications-updated'));
      }
    } catch (err: any) {
      error(err.message || 'Failed to mark notification as read.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (recipientFilter !== 'all') {
        const res = await adminApi.markAllNotificationsAsRead(recipientFilter);
        success(res.message || 'Notifications marked as read.');
      } else if (isStaff) {
        const res = await adminApi.markAllNotificationsAsRead('staff');
        success(res.message || 'Staff notifications marked as read.');
      } else {
        const [r1, r2] = await Promise.all([
          adminApi.markAllNotificationsAsRead('admin'),
          adminApi.markAllNotificationsAsRead('staff'),
        ]);
        const count = (r1.modifiedCount || 0) + (r2.modifiedCount || 0);
        success(`${count} notifications marked as read.`);
      }
      fetchNotifications(true, page);
      window.dispatchEvent(new Event('hestiia:notifications-updated'));
    } catch (err: any) {
      error(err.message || 'Failed to mark all notifications as read.');
    }
  };

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) {
      error('Title and message are required.');
      return;
    }

    try {
      setIsSending(true);
      const res = await adminApi.createNotification({
        title: newTitle.trim(),
        message: newMessage.trim(),
        recipientType: newRecipient,
        channel: newChannel,
      });
      if (res.success) {
        success(res.message || 'Notification dispatched successfully.');
        setIsDispatchOpen(false);
        setNewTitle('');
        setNewMessage('');
        fetchNotifications(true, 1);
        setPage(1);
        window.dispatchEvent(new Event('hestiia:notifications-updated'));
      }
    } catch (err: any) {
      error(err.message || 'Failed to dispatch notification.');
    } finally {
      setIsSending(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & Live Alerts"
        subtitle="Real-time order dispatches, table booking alerts, and internal team announcements"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchNotifications(true, page)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-3.5 py-2 rounded-xl bg-charcoal border border-emerald-600/40 text-emerald-300 hover:bg-emerald-950/40 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Read</span>
              </button>
            )}

            {!isStaff && (
              <button
                type="button"
                onClick={() => setIsDispatchOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Alert</span>
              </button>
            )}
          </div>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Total Alerts</span>
            <div className="font-serif text-2xl font-bold text-warmwhite mt-1">{total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-charcoal border border-charcoal-border flex items-center justify-center text-beige-muted">
            <Bell className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-gold/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold uppercase tracking-wider font-medium">Unread</span>
            <div className="font-serif text-2xl font-bold text-gold mt-1">{unreadCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-600/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-medium">Order / Admin</span>
            <div className="font-serif text-2xl font-bold text-emerald-300 mt-1">{adminAlertsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-sky-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-sky-300 uppercase tracking-wider font-medium">Booking / Staff</span>
            <div className="font-serif text-2xl font-bold text-sky-300 mt-1">{staffAlertsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-950/50 border border-sky-500/30 flex items-center justify-center text-sky-300">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'false', label: 'Unread Only' },
              { value: 'true', label: 'Read Only' },
            ] as const
          ).map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setReadFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                readFilter === f.value
                  ? 'bg-gold/15 border-gold text-gold'
                  : 'bg-charcoal border-charcoal-border text-beige hover:text-warmwhite'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <select
          value={recipientFilter}
          onChange={(e) => setRecipientFilter(e.target.value as 'all' | NotificationRecipientType)}
          className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
        >
          <option value="all">All Audiences</option>
          <option value="admin">Admin Alerts</option>
          <option value="staff">Staff / Front Desk</option>
          <option value="customer">Customer</option>
        </select>
      </div>

      {/* Feed */}
      {isLoading ? (
        <LoadingState message="Loading live notifications..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Found"
          description="Incoming orders, table reservations, and team alerts will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !item.isRead
                  ? 'bg-charcoal-card border-gold/40 shadow-md'
                  : 'bg-charcoal-card/70 border-charcoal-border'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {!item.isRead && <span className="w-2 h-2 rounded-full bg-gold shrink-0" />}
                  <h3 className="font-serif font-bold text-warmwhite text-base">{item.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-charcoal border border-charcoal-border text-[10px] font-semibold uppercase text-gold">
                    {item.recipientType}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-charcoal border border-charcoal-border text-[10px] text-beige-muted uppercase">
                    {item.channel}
                  </span>
                </div>
                <p className="text-xs text-beige leading-relaxed">{item.message}</p>
                <div className="text-[10px] text-beige-muted">
                  {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : ''}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.metadata?.orderId && (
                  <Link
                    href={`/admin/orders/${item.metadata.orderId}`}
                    className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>View Order</span>
                  </Link>
                )}
                {item.metadata?.bookingId && (
                  <Link
                    href="/admin/bookings"
                    className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" />
                    <span>View Bookings</span>
                  </Link>
                )}
                {!item.isRead ? (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60 text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Mark Read</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-beige-muted px-2">Read</span>
                )}
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of{' '}
                <strong className="text-warmwhite">{totalPages}</strong> ({total} total)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchNotifications(false, p);
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
                    fetchNotifications(false, p);
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

      {/* Dispatch Notification Modal */}
      {isDispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsDispatchOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setIsDispatchOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-xl font-bold text-warmwhite">Dispatch Team Notification</h2>
              <p className="text-beige text-[11px] mt-0.5">
                Broadcast an in-app alert to staff or admin operations.
              </p>
            </div>

            <form onSubmit={handleDispatch} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Alert Title *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. VIP Table #4 Reservation Arrival"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Message *</label>
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  placeholder="Please prioritize welcome drinks for VIP guests..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Audience</label>
                  <select
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value as NotificationRecipientType)}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                    <option value="customer">Customer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Channel</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as NotificationChannel)}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="in_app">In-App</option>
                    <option value="push">Push</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsDispatchOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
