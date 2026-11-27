'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Menu, Plus, ShoppingBag, ExternalLink, Bell, CheckCheck, Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminUser, NotificationItem, RestaurantSettings } from '../../types';
import { isStaffRole } from '../../services/apiClient';
import { adminApi } from '../../services/adminApi';

interface AdminHeaderProps {
  user: AdminUser | null;
  settings: RestaurantSettings | null;
  onToggleSidebar: () => void;
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ user, settings, onToggleSidebar }) => {
  const isStaff = isStaffRole(user?.role);
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchHeaderNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await adminApi.getNotifications({
        recipientType: isStaff ? 'staff' : undefined,
        limit: 8,
        skip: 0,
      });
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      // Silent background poll failure
    }
  }, [user, isStaff]);

  useEffect(() => {
    fetchHeaderNotifications();
    const timer = setInterval(fetchHeaderNotifications, 30000);
    const handleSync = () => fetchHeaderNotifications();
    window.addEventListener('hestiia:notifications-updated', handleSync);
    return () => {
      clearInterval(timer);
      window.removeEventListener('hestiia:notifications-updated', handleSync);
    };
  }, [fetchHeaderNotifications]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleMarkRead = async (item: NotificationItem) => {
    try {
      if (!item.isRead) {
        await adminApi.markNotificationAsRead(item.id);
        setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
        setUnreadCount((c) => Math.max(0, c - 1));
        window.dispatchEvent(new Event('hestiia:notifications-updated'));
      }
      if (item.metadata?.orderId) {
        setIsOpen(false);
        router.push(`/admin/orders/${item.metadata.orderId}`);
      } else if (item.metadata?.bookingId) {
        setIsOpen(false);
        router.push('/admin/bookings');
      }
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarkingAll(true);
      if (isStaff) {
        await adminApi.markAllNotificationsAsRead('staff');
      } else {
        await Promise.all([
          adminApi.markAllNotificationsAsRead('admin'),
          adminApi.markAllNotificationsAsRead('staff'),
        ]);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      window.dispatchEvent(new Event('hestiia:notifications-updated'));
    } catch {
      // ignore
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-charcoal-card/90 backdrop-blur-md border-b border-charcoal-border px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Toggle & Status */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-warmwhite transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2">
          <span
            className={`w-2 h-2 rounded-full ${
              settings?.orderAcceptanceEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-xs text-beige font-medium">
            {settings?.orderAcceptanceEnabled ? 'Live & Accepting Orders' : 'Online Orders Paused'}
          </span>
          <span className="text-charcoal-border">|</span>
          <span className="text-xs text-beige-muted">
            {settings?.address || 'PAC Road, Shyam Nagar, Kanpur'}
          </span>
        </div>
      </div>

      {/* Right: Quick actions & user info */}
      <div className="flex items-center space-x-2.5">
        <Link
          href="/admin/orders"
          className="p-2 rounded-xl bg-charcoal hover:bg-charcoal/80 border border-charcoal-border text-beige hover:text-gold text-xs transition-colors relative"
          title="Orders"
        >
          <ShoppingBag className="w-4 h-4" />
        </Link>

        {/* Notification Bell & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              if (!isOpen) fetchHeaderNotifications();
            }}
            className="p-2 rounded-xl bg-charcoal hover:bg-charcoal/80 border border-charcoal-border text-beige hover:text-gold text-xs transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-charcoal-950 font-bold text-[10px] flex items-center justify-center shadow-md">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-charcoal-card border border-gold/40 shadow-2xl overflow-hidden z-50 animate-scaleUp">
              <div className="px-4 py-3 border-b border-charcoal-border flex items-center justify-between bg-charcoal/70">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-gold" />
                  <span className="font-serif font-bold text-sm text-warmwhite">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    disabled={isMarkingAll}
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-gold hover:text-gold-light font-semibold inline-flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-charcoal-border/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-beige-muted">
                    No notifications yet. New orders &amp; bookings will appear here.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleMarkRead(item)}
                      className={`w-full text-left px-4 py-3 hover:bg-charcoal/60 transition-colors flex items-start gap-2.5 cursor-pointer ${
                        !item.isRead ? 'bg-gold/5' : ''
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          !item.isRead ? 'bg-gold' : 'bg-charcoal-border'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-warmwhite truncate">{item.title}</span>
                          <span className="text-[10px] text-beige-muted shrink-0">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-beige line-clamp-2 mt-0.5">{item.message}</p>
                      </div>
                      {!item.isRead && (
                        <Check className="w-3.5 h-3.5 text-gold/70 shrink-0 mt-1" />
                      )}
                    </button>
                  ))
                )}
              </div>

              <Link
                href="/admin/notifications"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2.5 border-t border-charcoal-border bg-charcoal/70 text-xs font-semibold text-gold hover:text-gold-light flex items-center justify-center space-x-1.5 transition-colors"
              >
                <span>View All Notifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {!isStaff && (
          <Link
            href="/admin/menu?new=true"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm hover:bg-gold-dark transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Dish</span>
          </Link>
        )}

        <a
          href={process.env.NEXT_PUBLIC_SITE_URL || '/'}
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold/30 text-beige hover:text-warmwhite text-xs transition-all"
        >
          <span>Live Site</span>
          <ExternalLink className="w-3.5 h-3.5 text-gold" />
        </a>

        {/* User Pill */}
        <div className="flex items-center space-x-2 pl-2 border-l border-charcoal-border">
          <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/40 text-gold flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="hidden xl:block text-left text-xs">
            <span className="block font-medium text-warmwhite leading-tight">{user?.name}</span>
            <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
