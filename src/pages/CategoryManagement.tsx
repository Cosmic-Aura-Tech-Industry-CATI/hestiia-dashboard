import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tags, CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { FoodCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<FoodCategory> | null>(null);
  const [isDeleting, setIsDeleting] = useState<FoodCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAllCategories();
      if (res.success) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch categories.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenCreate = () => {
    setEditingCategory({
      name: '',
      description: '',
      displayOrder: categories.length + 1,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: FoodCategory) => {
    setEditingCategory({ ...category });
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name) {
      error('Category name is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory.id) {
        const res = await adminApi.updateCategory(editingCategory.id, editingCategory);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchCategories();
        }
      } else {
        const res = await adminApi.createCategory(editingCategory);
        if (res.success) {
          success(res.message);
          setIsModalOpen(false);
          fetchCategories();
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi.deleteCategory(isDeleting.id);
      if (res.success) {
        success(res.message);
        setIsDeleting(null);
        fetchCategories();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete category.');
      setIsDeleting(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu Category Architecture"
        subtitle="Organize dishes into intuitive culinary sections for diner browsing"
        action={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        }
      />

      {isLoading ? (
        <LoadingState message="Loading culinary categories..." />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No Categories Defined"
          description="Create your first food category (e.g. Starters, Main Course, Biryani)."
          action={
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl"
            >
              Add First Category
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold">
                      <Tags className="w-4 h-4" />
                    </div>
                    <span className="font-serif font-bold text-warmwhite text-lg">{category.name}</span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      category.isActive
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-xs text-beige line-clamp-2 mb-4 leading-relaxed">
                  {category.description || 'No description added.'}
                </p>
              </div>

              <div className="pt-3 border-t border-charcoal-border/70 flex items-center justify-between text-xs">
                <span className="text-beige-muted">
                  <strong>{category.itemCount || 0}</strong> active dish(es)
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDeleting(category)}
                    className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      {isModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="font-serif text-xl font-bold text-warmwhite">
                {editingCategory.id ? `Edit: ${editingCategory.name}` : 'New Menu Category'}
              </h2>
              <p className="text-xs text-beige mt-1">
                Categories help guests explore specific courses and dietary options.
              </p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-beige mb-1 font-medium">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Tandoor, Main Course"
                  value={editingCategory.name || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short introductory note shown in digital menu..."
                  value={editingCategory.description || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Display Sort Order</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.displayOrder || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center space-x-2 pb-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingCategory.isActive ?? true}
                      onChange={(e) => setEditingCategory({ ...editingCategory, isActive: e.target.checked })}
                      className="rounded bg-charcoal border-charcoal-border text-gold focus:ring-gold"
                    />
                    <span className="text-warmwhite font-medium">Category Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-charcoal-border">
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
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(isDeleting)}
        title="Delete Menu Category"
        message={`Are you sure you want to delete category "${isDeleting?.name}"? The system will verify that no active food items belong to this category before proceeding.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
};
