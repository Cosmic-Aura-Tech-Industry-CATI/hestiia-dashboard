import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { adminApi } from '../../services/adminApi';
import { AdminUser, RestaurantSettings } from '../../types';
import { LoadingState } from '../common/LoadingState';

export const AdminLayout: React.FC = () => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('hestiia_admin_token');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }

    const cachedUser = localStorage.getItem('hestiia_admin_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (e) {
        // Ignore parse error
      }
    }

    // Verify session with server
    Promise.all([
      adminApi.getMe(),
      adminApi.getSettings().catch(() => null),
    ])
      .then(([meRes, settingsRes]) => {
        if (meRes.success && meRes.user) {
          setUser(meRes.user);
          localStorage.setItem('hestiia_admin_user', JSON.stringify(meRes.user));
        }
        if (settingsRes && settingsRes.success) {
          setSettings(settingsRes.settings);
        }
      })
      .catch(() => {
        localStorage.removeItem('hestiia_admin_token');
        localStorage.removeItem('hestiia_admin_user');
        navigate('/admin/login', { replace: true });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch (e) {
      // Proceed with client logout even if network fails
    }
    localStorage.removeItem('hestiia_admin_token');
    localStorage.removeItem('hestiia_admin_user');
    navigate('/admin/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-charcoal text-warmwhite flex items-center justify-center">
        <LoadingState message="Authenticating Hestiia Administration Session..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal text-warmwhite font-sans selection:bg-gold/30 selection:text-gold-light">
      {/* Sidebar */}
      <AdminSidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <AdminHeader
          user={user}
          settings={settings}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* Page Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet context={{ user, settings, reloadSettings: () => adminApi.getSettings().then(r => setSettings(r.settings)) }} />
        </main>
      </div>
    </div>
  );
};
