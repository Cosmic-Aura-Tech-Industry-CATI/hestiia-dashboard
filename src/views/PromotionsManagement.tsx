'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, X, Search, Calendar, RotateCcw } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Promotion } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageUploader } from '../components/common/ImageUploader';
import { useToast } from '../components/common/ToastContext';

function getSavingsPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price || originalPrice <= 0) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return '';
  return String(dateStr).split('T')[0];
}

export const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'hidden'>('all');

  // Modal & Action State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [itemsText, setItemsText] = useState('');
  const [isDeleting, setIsDeleting] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const { success, error } = useToast();

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPromotions();
      if (res.success) {
        setPromotions(res.promotions || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch promotions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPromotions = useMemo(() => {
    return promotions.filter((p) => {
      if (statusFilter === 'active' && !p.isActive) return false;
      if (statusFilter === 'hidden' && p.isActive) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = p.title.toLowerCase().includes(q);
        const matchSub = (p.subtitle || '').toLowerCase().includes(q);
        const matchItems = (p.items || []).some((i) => i.toLowerCase().includes(q));
        if (!matchTitle && !matchSub && !matchItems) return false;
      }
      return true;
    });
  }, [promotions, statusFilter, searchQuery]);

  const handleOpenCreate = () => {
    const defaultItems = ['Course 1', 'Course 2', 'Dessert'];
    setEditingPromo({
      title: '',
      subtitle: '',
      price: 999,
      originalPrice: 1299,
      serves: '2 Guests',
      badge: 'Special Offer',
      items: defaultItems,
      image: '/images/dishes/handi-paneer.jpg',
      startDate: '',
      endDate: '',
      isActive: true,
      displayOrder: promotions.length + 1,
    });
    setItemsText(defaultItems.join('\n'));
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo({
      ...promo,
      startDate: toDateInputValue(promo.startDate),
      endDate: toDateInputValue(promo.endDate),
    });
    setItemsText(Array.isArray(promo.items) ? promo.items.join('\n') : '');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (promo: Promotion) => {
    try {
      setTogglingId(promo.id);
      const nextStatus = !promo.isActive;
      const res = await adminApi.updatePromotion(promo.id, { isActive: nextStatus });
      if (res.success) {
        setPromotions((prev) =>
          prev.map((p) => (p.id === promo.id ? { ...p, isActive: nextStatus } : p))
        );
        success(`'${promo.title}' is now ${nextStatus ? 'Active on Web' : 'Hidden'}.`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to toggle promotion status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo || !editingPromo.title?.trim() || editingPromo.price === undefined) {
      error('Offer title and price are required.');
      return;
    }

    const parsedItems = itemsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload: Partial<Promotion> = {
      ...editingPromo,
      title: editingPromo.title.trim(),
      items: parsedItems,
      startDate: editingPromo.startDate || undefined,
      endDate: editingPromo.endDate || undefined,
    };

    try {
      setIsSubmitting(true);
      if (editingPromo.id) {
        const res = await adminApi.updatePromotion(editingPromo.id, payload);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchPromotions();
        }
      } else {
        const res = await adminApi.createPromotion(payload);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchPromotions();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save promotion offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi.deletePromotion(isDeleting.id);
      if (res.success) {
        success(res.message);
        setIsDeleting(null);
        fetchPromotions();
      }
    } catch (err: any) {
      error(err.message || 'Failed to remove promotion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotions, Combos & Banquet Feasts"
        subtitle="Curate multi-course grand thalis, tasting flights, limited edition chef offers and family bundles"
        action={
          <div className="flex items-center space-x-2.5">
            <div className="hidden sm:block text-xs text-beige bg-charcoal-card border border-charcoal-border px-3.5 py-2 rounded-xl">
              Total Combos: <strong className="text-gold font-bold">{promotions.length}</strong>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dining Combo</span>
            </button>
          </div>
        }
      />

      {/* Search & Status Filter */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search combo title, subtitle, or included dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'hidden')}
          className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
        >
          <option value="all">All Combos ({promotions.length})</option>
          <option value="active">Active on Web ({promotions.filter((p) => p.isActive).length})</option>
          <option value="hidden">Hidden ({promotions.filter((p) => !p.isActive).length})</option>
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching dining promotions..." />
      ) : filteredPromotions.length === 0 ? (
        <EmptyState
          title="No Dining Offers Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No combos match your filters. Try clearing your search or filter.'
              : 'Create your first curated dining feast or banquet combo.'
          }
          action={
            searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Add First Offer
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPromotions.map((promo) => {
            const savings = getSavingsPercent(promo.price, promo.originalPrice);
            return (
              <div
                key={promo.id}
                className="rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-charcoal overflow-hidden">
                  <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-card via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex items-center space-x-2">
                    <span className="px-2.5 py-1 rounded-full bg-gold text-charcoal-950 font-bold text-[10px] uppercase tracking-wider shadow-md">
                      {promo.badge}
                    </span>
                    {savings > 0 && (
                      <span className="px-2 py-1 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
                        {savings}% OFF
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      disabled={togglingId === promo.id}
                      onClick={() => handleToggleActive(promo)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer flex items-center space-x-1 ${
                        promo.isActive
                          ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900'
                          : 'bg-zinc-900/90 text-zinc-300 border-zinc-700 hover:bg-zinc-800'
                      }`}
                      title="Click to toggle visibility on website"
                    >
                      {togglingId === promo.id && <RotateCcw className="w-2.5 h-2.5 animate-spin text-gold" />}
                      <span>{promo.isActive ? 'Active on Web' : 'Hidden'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="font-serif text-xl font-bold text-warmwhite">{promo.title}</h3>
                      <div className="text-right whitespace-nowrap ml-2">
                        <span className="font-serif font-bold text-lg text-gold">₹{promo.price}</span>
                        {promo.originalPrice > promo.price && (
                          <span className="text-xs text-beige-muted line-through ml-2">₹{promo.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-beige mb-3">{promo.subtitle}</p>

                    {(promo.startDate || promo.endDate) && (
                      <div className="flex items-center space-x-1.5 text-[11px] text-gold/90 mb-3">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          Valid: {toDateInputValue(promo.startDate) || 'Now'} &rarr; {toDateInputValue(promo.endDate) || 'Ongoing'}
                        </span>
                      </div>
                    )}

                    <div className="space-y-1.5 mb-4 p-3 rounded-2xl bg-charcoal/60 border border-charcoal-border">
                      <span className="text-[10px] text-gold uppercase tracking-wider font-semibold block mb-1">
                        Included Items ({promo.serves}):
                      </span>
                      {promo.items.map((item, idx) => (
                        <div key={idx} className="text-xs text-warmwhite flex items-center space-x-1.5">
                          <span className="w-1 h-1 rounded-full bg-gold" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-charcoal-border/80 flex items-center justify-between text-xs">
                    <span className="text-beige-muted font-mono">Sort Order: #{promo.displayOrder}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenEdit(promo)}
                        className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                        title="Edit Offer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setIsDeleting(promo)}
                        className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit / Create Offer Modal */}
      {isModalOpen && editingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {editingPromo.id ? 'Edit Dining Offer' : 'Create Special Feast Combo'}
              </h2>
              <p className="text-beige text-[11px] mt-0.5">
                Set promotional pricing, validity dates, sort order, multi-dish flight inclusions and hero photo.
              </p>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-3.5">
              <div>
                <label className="block text-beige mb-1 font-medium">Offer Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Nawab Feast"
                  value={editingPromo.title || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Subtitle / Catchline</label>
                <input
                  type="text"
                  placeholder="Our signature multi-course grand dining experience..."
                  value={editingPromo.subtitle || ''}
                  onChange={(e) => setEditingPromo({ ...editingPromo, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Discounted Price (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingPromo.price ?? ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Original Strikethrough Price (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.originalPrice ?? ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Serves Count</label>
                  <input
                    type="text"
                    placeholder="e.g. 4 Guests"
                    value={editingPromo.serves || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, serves: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Ribbon Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Seller"
                    value={editingPromo.badge || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Sort Order (#)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.displayOrder ?? 1}
                    onChange={(e) => setEditingPromo({ ...editingPromo, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Start Date (Optional)</label>
                  <input
                    type="date"
                    value={toDateInputValue(editingPromo.startDate)}
                    onChange={(e) => setEditingPromo({ ...editingPromo, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">End Date (Optional)</label>
                  <input
                    type="date"
                    value={toDateInputValue(editingPromo.endDate)}
                    onChange={(e) => setEditingPromo({ ...editingPromo, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <ImageUploader
                value={editingPromo.image || ''}
                onChange={(url) => setEditingPromo({ ...editingPromo, image: url })}
                folder="hestiia_restaurant/promotions"
                label="Promotional Banner Photo"
              />

              <div>
                <label className="block text-beige mb-1 font-medium">Included Courses (One per line)</label>
                <textarea
                  rows={4}
                  placeholder={"Choice of Handi Paneer or Paneer Lababdar\nDahi Ke Kebab Platter (6 pcs)\n4 Butter Naans"}
                  value={itemsText}
                  onChange={(e) => setItemsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingPromo.isActive ?? true}
                    onChange={(e) => setEditingPromo({ ...editingPromo, isActive: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold focus:ring-gold"
                  />
                  <span className="text-warmwhite font-medium">Publish Active on Public Website</span>
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(isDeleting)}
        title="Delete Dining Offer"
        message={`Are you sure you want to remove promotion "${isDeleting?.title}" from the website?`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
};
