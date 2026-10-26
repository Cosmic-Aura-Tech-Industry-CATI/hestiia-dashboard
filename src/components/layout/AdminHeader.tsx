import React from 'react';
import { Menu, Plus, ShoppingBag, ExternalLink, ShieldCheck, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminUser, RestaurantSettings } from '../../types';

interface AdminHeaderProps {
  user: AdminUser | null;
  settings: RestaurantSettings | null;
  onToggleSidebar: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ user, settings, onToggleSidebar }) => {
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
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-beige font-medium">
            {settings?.orderAcceptanceEnabled ? 'Live & Accepting Orders' : 'Online Orders Paused'}
          </span>
          <span className="text-charcoal-border">|</span>
          <span className="text-xs text-beige-muted">PAC Road, Shyam Nagar, Kanpur</span>
        </div>
      </div>

      {/* Right: Quick actions & user info */}
      <div className="flex items-center space-x-2.5">
        <Link
          to="/admin/orders"
          className="p-2 rounded-xl bg-charcoal hover:bg-charcoal/80 border border-charcoal-border text-beige hover:text-gold text-xs transition-colors relative"
          title="Orders"
        >
          <ShoppingBag className="w-4 h-4" />
        </Link>

        <Link
          to="/admin/menu?new=true"
          className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gold text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm hover:bg-gold-dark transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Dish</span>
        </Link>

        <a
          href="/"
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
            <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">{user?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
