import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Flame, Users, CheckCircle2, XCircle, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { Promotion } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageUploader } from '../components/common/ImageUploader';
import { useToast } from '../components/common/ToastContext';

export const PromotionsManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Partial<Promotion> | null>(null);
  const [isDeleting, setIsDeleting] = useState<Promotion | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchPromotions = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPromotions();
      if (res.success) {
        setPromotions(res.promotions);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch promotions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleOpenCreate = () => {
    setEditingPromo({
      title: '',
      subtitle: '',
      price: 999,
      originalPrice: 1299,
      serves: '2 Guests',
      badge: 'Special Offer',
      items: ['Course 1', 'Course 2', 'Dessert'],
      image: '/images/dishes/handi-paneer.jpg',
      isActive: true,
      displayOrder: promotions.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo({ ...promo });
    setIsModalOpen(true);
  };

  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromo || !editingPromo.title || editingPromo.price === undefined) {
      error('Offer title and price are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPromo.id) {
        const res = await adminApi.updatePromotion(editingPromo.id, editingPromo);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchPromotions();
        }
      } else {
        const res = await adminApi.createPromotion(editingPromo);
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
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Dining Combo</span>
          </button>
        }
      />

      {isLoading ? (
        <LoadingState message="Fetching dining promotions..." />
      ) : promotions.length === 0 ? (
        <EmptyState
          title="No Active Dining Offers"
          description="Create your first curated dining feast or banquet combo."
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl"
            >
              Add First Offer
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all overflow-hidden shadow-lg flex flex-col justify-between"
            >
              <div className="relative h-44 w-full bg-charcoal overflow-hidden">
                <img src={promo.image} alt={promo.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-card via-transparent to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-gold text-charcoal-950 font-bold text-[10px] uppercase tracking-wider shadow-md">
                    {promo.badge}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      promo.isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {promo.isActive ? 'Active on Web' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-serif text-xl font-bold text-warmwhite">{promo.title}</h3>
                    <div className="text-right">
                      <span className="font-serif font-bold text-lg text-gold">₹{promo.price}</span>
                      {promo.originalPrice > promo.price && (
                        <span className="text-xs text-beige-muted line-through ml-2">₹{promo.originalPrice}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-beige mb-3">{promo.subtitle}</p>

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
                  <span className="text-beige-muted">Sort Order: {promo.displayOrder}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(promo)}
                      className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors"
                      title="Edit Offer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(promo)}
                      className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors"
                      title="Delete Offer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Offer Modal */}
      {isModalOpen && editingPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {editingPromo.id ? 'Edit Dining Offer' : 'Create Special Feast Combo'}
              </h2>
              <p className="text-beige text-[11px] mt-0.5">
                Set promotional pricing, multi-dish flight inclusions and hero photo.
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
                    value={editingPromo.price || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Original Strikethrough Price (INR ₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingPromo.originalPrice || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, originalPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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
                  <label className="block text-beige mb-1 font-medium">Promotional Ribbon Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. Best Seller, Limited Edition"
                    value={editingPromo.badge || ''}
                    onChange={(e) => setEditingPromo({ ...editingPromo, badge: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <ImageUploader
                value={editingPromo.image || ''}
                onChange={(url) => setEditingPromo({ ...editingPromo, image: url })}
                label="Promotional Banner Photo"
              />

              <div>
                <label className="block text-beige mb-1 font-medium">Included Courses (One per line)</label>
                <textarea
                  rows={4}
                  placeholder={"Choice of Handi Paneer or Paneer Lababdar\nDahi Ke Kebab Platter (6 pcs)\n4 Butter Naans"}
                  value={Array.isArray(editingPromo.items) ? editingPromo.items.join('\n') : ''}
                  onChange={(e) =>
                    setEditingPromo({
                      ...editingPromo,
                      items: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean),
                    })
                  }
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
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider shadow-gold-sm transition-all"
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
