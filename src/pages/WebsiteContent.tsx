import React, { useState, useEffect } from 'react';
import { Globe, Save, CheckCircle2, AlertCircle, Sparkles, ExternalLink } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { RestaurantSettings } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';

export const WebsiteContent: React.FC = () => {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { success, error } = useToast();

  useEffect(() => {
    adminApi
      .getSettings()
      .then((res) => {
        if (res.success) setSettings(res.settings);
      })
      .catch((err) => error(err.message || 'Failed to load website content.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setIsSaving(true);
      const res = await adminApi.updateSettings(settings);
      if (res.success) {
        setSettings(res.settings);
        success('Website content and copy updated live on public site.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update website content.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return <LoadingState message="Fetching live website copy and assets..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Website Content & Copy"
        subtitle="Live editorial control over hero banners, tagline, story, atmosphere, and social presence"
        action={
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Public Website</span>
          </a>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Hero & Brand Messaging */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <span>Homepage Cinematic Hero Section</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">Eyebrow Heading</label>
              <input
                type="text"
                value={settings.eyebrow || ''}
                onChange={(e) => setSettings({ ...settings, eyebrow: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Hero Tagline</label>
              <input
                type="text"
                value={settings.tagline || ''}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-beige mb-1 font-medium">Hero Description Narrative</label>
              <textarea
                rows={2}
                value={settings.description || ''}
                onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact, Opening Hours & Location */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
          <h2 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
            <Globe className="w-5 h-5 text-gold" />
            <span>Contact, Address & Dining Hours</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-beige mb-1 font-medium">Physical Address</label>
              <input
                type="text"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Opening Hours</label>
              <input
                type="text"
                value={settings.openingHours || ''}
                onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Front Desk Telephone</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">WhatsApp Booking Number</label>
              <input
                type="text"
                value={settings.whatsapp || ''}
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Instagram URL</label>
              <input
                type="text"
                value={settings.socialInstagram || ''}
                onChange={(e) => setSettings({ ...settings, socialInstagram: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Facebook URL</label>
              <input
                type="text"
                value={settings.socialFacebook || ''}
                onChange={(e) => setSettings({ ...settings, socialFacebook: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end space-x-3 pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider text-xs shadow-gold-sm flex items-center space-x-2 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing Updates...' : 'Publish Content Live'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
