import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Image as ImageIcon, Sparkles, Star, CheckCircle2, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { GalleryPhoto } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageUploader } from '../components/common/ImageUploader';
import { useToast } from '../components/common/ToastContext';

export const GalleryManagement: React.FC = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Partial<GalleryPhoto> | null>(null);
  const [isDeleting, setIsDeleting] = useState<GalleryPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchGallery = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getGallery();
      if (res.success) {
        setPhotos(res.gallery);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load ambience gallery.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleOpenCreate = () => {
    setEditingPhoto({
      title: '',
      category: 'Interior',
      image: '/images/ambience/ambience-1.jpg',
      description: '',
      isFeatured: false,
      displayOrder: photos.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (photo: GalleryPhoto) => {
    setEditingPhoto({ ...photo });
    setIsModalOpen(true);
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto || !editingPhoto.title || !editingPhoto.image) {
      error('Photo title and image are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPhoto.id) {
        const res = await adminApi.updateGalleryPhoto(editingPhoto.id, editingPhoto);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchGallery();
        }
      } else {
        const res = await adminApi.addGalleryPhoto(editingPhoto);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchGallery();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save gallery photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi.deleteGalleryPhoto(isDeleting.id);
      if (res.success) {
        success(res.message);
        setIsDeleting(null);
        fetchGallery();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete photo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ambience & Dining Photography Gallery"
        subtitle="Manage interior photography, private leather dining booths, artisanal bar counter, and exterior facade"
        action={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ambience Photo</span>
          </button>
        }
      />

      {isLoading ? (
        <LoadingState message="Fetching restaurant photography catalogue..." />
      ) : photos.length === 0 ? (
        <EmptyState
          title="No Ambience Photos Added"
          description="Upload architectural photographs of your restaurant dining hall."
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl"
            >
              Upload First Photo
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all overflow-hidden shadow-lg flex flex-col justify-between"
            >
              <div className="relative h-48 w-full bg-charcoal overflow-hidden group">
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-charcoal/80 backdrop-blur-md border border-charcoal-border text-gold font-semibold text-[10px] uppercase tracking-wider">
                    {photo.category}
                  </span>
                </div>
                {photo.isFeatured && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2 py-1 rounded-full bg-gold text-charcoal-950 font-bold text-[10px] uppercase flex items-center space-x-1 shadow-md">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Featured</span>
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-lg font-bold text-warmwhite mb-1">{photo.title}</h3>
                  <p className="text-xs text-beige line-clamp-2 leading-relaxed">
                    {photo.description || 'No caption entered.'}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-charcoal-border/80 flex items-center justify-between text-xs">
                  <span className="text-beige-muted">Display Order: {photo.displayOrder}</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEdit(photo)}
                      className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors"
                      title="Edit Photo"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsDeleting(photo)}
                      className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors"
                      title="Delete Photo"
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

      {/* Edit / Create Modal */}
      {isModalOpen && editingPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {editingPhoto.id ? 'Edit Ambience Photo' : 'Upload Ambience Photography'}
              </h2>
              <p className="text-beige text-[11px] mt-0.5">
                Feature interior booths, candlelit tables and architectural dining views.
              </p>
            </div>

            <form onSubmit={handleSavePhoto} className="space-y-3.5">
              <div>
                <label className="block text-beige mb-1 font-medium">Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Golden Dining Sanctuary"
                  value={editingPhoto.title || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Category / Zone</label>
                  <input
                    type="text"
                    placeholder="e.g. Interior, Seating, Bar & Lounge"
                    value={editingPhoto.category || ''}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={editingPhoto.displayOrder || 1}
                    onChange={(e) => setEditingPhoto({ ...editingPhoto, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <ImageUploader
                value={editingPhoto.image || ''}
                onChange={(url) => setEditingPhoto({ ...editingPhoto, image: url })}
                label="Ambience Photograph"
              />

              <div>
                <label className="block text-beige mb-1 font-medium">Description / Ambience Caption</label>
                <textarea
                  rows={2}
                  placeholder="Warm ambient pendant lights and plush velvet seating..."
                  value={editingPhoto.description || ''}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="featured-check"
                  checked={editingPhoto.isFeatured || false}
                  onChange={(e) => setEditingPhoto({ ...editingPhoto, isFeatured: e.target.checked })}
                  className="rounded bg-charcoal border-charcoal-border text-gold focus:ring-gold"
                />
                <label htmlFor="featured-check" className="text-warmwhite font-medium cursor-pointer">
                  Feature prominently on homepage ambience gallery
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
                  {isSubmitting ? 'Saving...' : 'Save Gallery Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(isDeleting)}
        title="Delete Ambience Photo"
        message={`Are you sure you want to remove photo "${isDeleting?.title}" from the gallery?`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
};
