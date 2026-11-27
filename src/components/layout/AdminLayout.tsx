'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { adminApi } from '../../services/adminApi';
import {
  clearAuthSession,
  getAuthToken,
  getCachedAuthUser,
  isStaffRole,
  saveAuthSession,
} from '../../services/apiClient';
import { AdminUser, RestaurantSettings } from '../../types';
import { LoadingState } from '../common/LoadingState';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    const cachedUser = getCachedAuthUser<AdminUser>();
    if (cachedUser) {
      setUser(cachedUser);
    }

    // Verify session with server first, then fetch role-appropriate settings
    adminApi
      .getMe()
      .then(async (meRes) => {
        if (meRes.success && meRes.user) {
          setUser(meRes.user);
          saveAuthSession({ token, user: meRes.user });

          const settingsRes = isStaffRole(meRes.user.role)
            ? await adminApi.getPublicSettings().catch(() => null)
            : await adminApi.getSettings().catch(() => null);

          if (settingsRes && settingsRes.success) {
            setSettings(settingsRes.settings);
          }
        }
      })
      .catch(() => {
        clearAuthSession();
        router.replace('/login');
      })
      .finally(() => {
        setIsLoading(false);
      });

    const handleSettingsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<RestaurantSettings>;
      if (customEvent.detail) {
        setSettings(customEvent.detail);
      }
    };
    window.addEventListener('hestiia:settings-updated', handleSettingsUpdated);
    return () => {
      window.removeEventListener('hestiia:settings-updated', handleSettingsUpdated);
    };
  }, [router]);

  const handleLogout = async () => {
    try {
      await adminApi.logout();
    } catch {
      // Proceed with client logout even if network fails
    }
    clearAuthSession();
    router.replace('/login');
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
          {children}
        </main>
      </div>
    </div>
  );
};
