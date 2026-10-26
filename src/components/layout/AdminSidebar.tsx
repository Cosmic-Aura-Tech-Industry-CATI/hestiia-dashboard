import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tags,
  ShoppingBag,
  Users,
  CreditCard,
  CalendarCheck,
  PartyPopper,
  Globe,
  Flame,
  Image as GalleryIcon,
  MessageSquareQuote,
  BarChart3,
  Settings,
  UserCircle,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react';
import { AdminUser } from '../../types';

interface AdminSidebarProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const navItems = [
  { label: 'Overview', icon: LayoutDashboard, path: '/admin/dashboard' },
  { label: 'Orders', icon: ShoppingBag, path: '/admin/orders' },
  { label: 'Food Menu', icon: UtensilsCrossed, path: '/admin/menu' },
  { label: 'Categories', icon: Tags, path: '/admin/categories' },
  { label: 'Customers', icon: Users, path: '/admin/customers' },
  { label: 'Payments & Billing', icon: CreditCard, path: '/admin/payments' },
  { label: 'Table Bookings', icon: CalendarCheck, path: '/admin/bookings' },
  { label: 'Party Inquiries', icon: PartyPopper, path: '/admin/party-inquiries' },
  { label: 'Website Content', icon: Globe, path: '/admin/website-content' },
  { label: 'Promotions', icon: Flame, path: '/admin/promotions' },
  { label: 'Gallery', icon: GalleryIcon, path: '/admin/gallery' },
  { label: 'Reviews', icon: MessageSquareQuote, path: '/admin/reviews' },
  { label: 'Reports', icon: BarChart3, path: '/admin/reports' },
  { label: 'Restaurant Settings', icon: Settings, path: '/admin/settings' },
  { label: 'My Profile', icon: UserCircle, path: '/admin/profile' },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ user, isOpen, onClose, onLogout }) => {
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-charcoal-950/80 backdrop-blur-sm lg:hidden animate-fadeIn"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-charcoal-card border-r border-charcoal-border flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-16 px-5 border-b border-charcoal-border flex items-center justify-between">
            <Link to="/admin/dashboard" className="flex items-center space-x-3 group">
              <div className="relative flex items-center justify-center p-0.5 rounded-xl border border-gold/40 bg-black shadow-md overflow-hidden group-hover:border-gold transition-colors">
                <img
                  src="/brand-icon.jpg"
                  alt="Hestiia Logo"
                  className="w-11 h-11 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-warmwhite text-lg tracking-wider block leading-tight group-hover:text-gold transition-colors">
                  HESTIIA
                </span>
                <span className="text-[9px] uppercase tracking-widest text-gold font-semibold">
                  Admin System
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-beige hover:text-warmwhite hover:bg-charcoal transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 max-h-[calc(100vh-140px)] overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.path ||
                (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-gold/15 text-gold border border-gold/30 font-semibold shadow-gold-sm'
                      : 'text-beige hover:text-warmwhite hover:bg-charcoal/80'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-gold' : 'text-beige-muted group-hover:text-gold'
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Actions Footer */}
        <div className="p-3 border-t border-charcoal-border bg-charcoal/60">
          <div className="flex items-center justify-between px-2 py-1.5 mb-2">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold text-gold font-bold text-xs flex items-center justify-center flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold text-warmwhite truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] text-gold uppercase tracking-wider capitalize font-medium">
                  {user?.role || 'Staff'}
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold/30 text-beige hover:text-gold text-[11px] font-medium transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Public Website</span>
          </a>
        </div>
      </aside>
    </>
  );
};
