'use client';

import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Clock, Store, HardDrive, Cloud, Lock, Receipt } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { AdminUser, RestaurantSettings as ISettings, UploadStorageStats } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';

export const RestaurantSettings: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);

  const [settings, setSettings] = useState<ISettings | null>(null);
  const [storageStats, setStorageStats] = useState<UploadStorageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    if (isStaff) {
      setIsLoading(false);
      return;
    }
    Promise.all([
      adminApi.getSettings(),
      adminApi.getUploadStats().catch(() => null),
    ])
      .then(([settingsRes, statsRes]) => {
        if (settingsRes.success) setSettings(settingsRes.settings);
        if (statsRes?.success) setStorageStats(statsRes);
      })
      .catch((err) => error(err.message || 'Failed to load restaurant settings.'))
      .finally(() => setIsLoading(false));
  }, [isStaff]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        setSettings(res.settings);
        window.dispatchEvent(new CustomEvent('hestiia:settings-updated', { detail: res.settings }));
        success('Restaurant operational parameters updated.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Restaurant Operational Settings"
          subtitle="Manage billing rules, GST tax rates, delivery radius fees, order acceptance switch and business hours"
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            Restaurant operational and tax settings are restricted to Manager and Admin accounts.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !settings) {
    return <LoadingState message="Fetching restaurant operational configuration..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Operational Settings"
        subtitle="Manage billing rules, GST tax rates, delivery radius fees, order acceptance switch and business hours"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Master Toggles: Live Order Acceptance & Table Booking */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-gold/40 shadow-xl space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <Store className="w-5 h-5 text-gold" />
            <span>Master Service Availability Controls</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-warmwhite text-xs block">Online Order Acceptance</span>
                <span className="text-[11px] text-beige">Guests can place digital delivery & pickup orders</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.orderAcceptanceEnabled}
                  onChange={(e) => setSettings({ ...settings, orderAcceptanceEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-between">
              <div>
                <span className="font-semibold text-warmwhite text-xs block">Table Booking Module</span>
                <span className="text-[11px] text-beige">Patrons can submit reservation inquiries</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.tableReservationEnabled}
                  onChange={(e) => setSettings({ ...settings, tableReservationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Taxes & Delivery Charges */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-gold" />
            <span>Taxes, Delivery Surcharges & Minimum Order</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">GST Tax Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={settings.taxRatePercent}
                onChange={(e) => setSettings({ ...settings, taxRatePercent: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Standard 5.0% Restaurant GST</span>
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Home Delivery Surcharge (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.deliveryFee}
                onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Fixed delivery charge for PAC Road area</span>
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Minimum Order for Delivery (₹)</label>
              <input
                type="number"
                min="0"
                value={settings.minOrderValue}
                onChange={(e) => setSettings({ ...settings, minOrderValue: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Cart threshold required to checkout</span>
            </div>
          </div>
        </div>

        {/* Operating Identity & Timezone */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <Clock className="w-5 h-5 text-gold" />
            <span>Timezone, Currency & Business Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">Restaurant Legal Name</label>
              <input
                type="text"
                value={settings.restaurantName}
                onChange={(e) => setSettings({ ...settings, restaurantName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Operational Timezone</label>
              <input
                type="text"
                disabled
                value={settings.timezone}
                className="w-full px-3 py-2 rounded-xl bg-charcoal/50 border border-charcoal-border text-beige-muted font-mono"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Asia/Kolkata (IST +05:30)</span>
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Operating Currency</label>
              <input
                type="text"
                disabled
                value={`${settings.currency} (${settings.currencySymbol})`}
                className="w-full px-3 py-2 rounded-xl bg-charcoal/50 border border-charcoal-border text-beige-muted font-mono"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Indian Rupee (INR ₹)</span>
            </div>
          </div>
        </div>

        {/* Billing & Statutory Identity */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-gold" />
            <span>Billing &amp; Statutory Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">Invoice Number Prefix</label>
              <input
                type="text"
                placeholder="e.g. HST-INV"
                value={settings.invoicePrefix || ''}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono uppercase"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">Prefix used on generated tax invoices</span>
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">GSTIN (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 09AABCU9603R1ZM"
                value={settings.gstin || ''}
                onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none font-mono uppercase"
              />
              <span className="text-[10px] text-beige-muted mt-1 block">15-character Goods &amp; Services Tax ID</span>
            </div>
          </div>
        </div>

        {/* Media & Upload Storage Health */}
        {storageStats && (
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
            <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              {storageStats.isCloudinaryConfigured ? (
                <Cloud className="w-5 h-5 text-sky-400" />
              ) : (
                <HardDrive className="w-5 h-5 text-gold" />
              )}
              <span>Media Upload &amp; Storage Health</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Storage Provider</span>
                <span className="font-semibold text-warmwhite capitalize mt-1 block">
                  {storageStats.isCloudinaryConfigured ? 'Cloudinary CDN' : 'Local Disk'}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Local Files</span>
                <span className="font-mono font-bold text-gold mt-1 block">{storageStats.localFileCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Local Disk Used</span>
                <span className="font-mono font-bold text-warmwhite mt-1 block">
                  {storageStats.localTotalMegabytes} MB
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Max Upload Limit</span>
                <span className="font-mono font-bold text-emerald-300 mt-1 block">
                  {storageStats.maxFileSizeMB} MB
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3 pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm flex items-center space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
