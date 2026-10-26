import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  AlertCircle,
  X,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { FoodItem, FoodCategory } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ImageUploader } from '../components/common/ImageUploader';
import { useToast } from '../components/common/ToastContext';

export const MenuManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dishes, setDishes] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDiet, setSelectedDiet] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>(searchParams.get('available') || 'all');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<Partial<FoodItem> | null>(null);
  const [isDeleting, setIsDeleting] = useState<FoodItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchMenuData = async () => {
    try {
      setIsLoading(true);
      const [dishesRes, catsRes] = await Promise.all([
        adminApi.getAllDishes({
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          available: selectedAvailability !== 'all' ? selectedAvailability : undefined,
          search: searchQuery || undefined,
        }),
        adminApi.getAllCategories(),
      ]);

      if (dishesRes.success) setDishes(dishesRes.dishes);
      if (catsRes.success) setCategories(catsRes.categories);
    } catch (err: any) {
      error(err.message || 'Failed to fetch food menu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
  }, [selectedCategory, selectedAvailability]);

  // Handle URL param 'new=true'
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      handleOpenCreate();
      setSearchParams({});
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMenuData();
  };

  const handleOpenCreate = () => {
    setEditingDish({
      name: '',
      category: categories[0]?.name || 'Main Course',
      description: '',
      fullDescription: '',
      price: 250,
      compareAtPrice: 0,
      image: '/images/dishes/handi-paneer.jpg',
      isVeg: true,
      isSignature: false,
      spiceLevel: 2,
      preparationTime: '20 mins',
      ingredients: [],
      chefNote: '',
      available: true,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (dish: FoodItem) => {
    setEditingDish({ ...dish });
    setIsEditModalOpen(true);
  };

  const handleToggleAvailability = async (dish: FoodItem) => {
    try {
      const res = await adminApi.toggleDishAvailability(dish.id, !dish.available);
      if (res.success) {
        setDishes((prev) =>
          prev.map((d) => (d.id === dish.id ? { ...d, available: res.dish.available } : d))
        );
        success(res.message);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update availability.');
    }
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editingDish.name || !editingDish.category || editingDish.price === undefined) {
      error('Please complete all required dish attributes.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingDish.id) {
        // Update
        const res = await adminApi.updateDish(editingDish.id, editingDish);
        if (res.success) {
          setDishes((prev) => prev.map((d) => (d.id === res.dish.id ? res.dish : d)));
          success(res.message);
          setIsEditModalOpen(false);
        }
      } else {
        // Create
        const res = await adminApi.createDish(editingDish);
        if (res.success) {
          setDishes((prev) => [res.dish, ...prev]);
          success(res.message);
          setIsEditModalOpen(false);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save dish record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    try {
      setIsSubmitting(true);
      const res = await adminApi.deleteDish(isDeleting.id);
      if (res.success) {
        success(res.message);
        setDishes((prev) => prev.filter((d) => d.id !== isDeleting.id));
        setIsDeleting(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete dish.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered in-memory if dietary filter active
  const displayedDishes = dishes.filter((d) => {
    if (selectedDiet === 'veg') return d.isVeg;
    if (selectedDiet === 'non-veg') return !d.isVeg;
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food Menu Management"
        subtitle="Manage signature handi gravies, kebabs, prices, dietary badges and real-time availability"
        action={
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Dish</span>
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search dish, ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
          </form>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Dietary Filter */}
          <select
            value={selectedDiet}
            onChange={(e) => setSelectedDiet(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Dietary Types</option>
            <option value="veg">Pure Vegetarian Only</option>
            <option value="non-veg">Non-Vegetarian Only</option>
          </select>

          {/* Availability Filter */}
          <select
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="true">Active & In Stock</option>
            <option value="false">Sold Out / Unavailable (86’d)</option>
          </select>
        </div>
      </div>

      {/* Dishes Table / Cards */}
      {isLoading ? (
        <LoadingState message="Fetching restaurant culinary catalogue..." />
      ) : displayedDishes.length === 0 ? (
        <EmptyState
          title="No Food Items Found"
          description="No dishes match your selected filter criteria. Try resetting filters or adding a new culinary item."
          action={
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSelectedDiet('all');
                setSelectedAvailability('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl"
            >
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Dish & Details</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Spice / Prep</th>
                  <th className="py-3.5 px-4 font-semibold">Availability</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {displayedDishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-charcoal/40 transition-colors">
                    {/* Dish Name & Thumbnail */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-charcoal overflow-hidden border border-charcoal-border flex-shrink-0 relative">
                          <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                          {dish.isSignature && (
                            <span className="absolute top-1 right-1 p-0.5 rounded bg-gold text-charcoal-950">
                              <Sparkles className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center p-0.5 ${
                                dish.isVeg ? 'border-green-500' : 'border-red-500'
                              }`}
                              title={dish.isVeg ? 'Pure Veg' : 'Non-Veg'}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  dish.isVeg ? 'bg-green-500' : 'bg-red-500'
                                }`}
                              />
                            </span>
                            <span className="font-serif font-bold text-warmwhite text-sm">{dish.name}</span>
                          </div>
                          <p className="text-[11px] text-beige max-w-sm line-clamp-1 mt-0.5">
                            {dish.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border text-beige text-[11px] font-medium">
                        {dish.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <div className="font-serif font-bold text-warmwhite text-sm">
                        ₹{dish.price}
                      </div>
                      {dish.compareAtPrice && dish.compareAtPrice > dish.price && (
                        <div className="text-[10px] text-beige-muted line-through">
                          ₹{dish.compareAtPrice}
                        </div>
                      )}
                    </td>

                    {/* Spice / Prep */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-1 text-gold text-xs">
                        {[...Array(dish.spiceLevel || 1)].map((_, i) => (
                          <Flame key={i} className="w-3.5 h-3.5 fill-gold text-gold" />
                        ))}
                      </div>
                      <div className="text-[10px] text-beige-muted mt-0.5 flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{dish.preparationTime}</span>
                      </div>
                    </td>

                    {/* Availability Switch */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(dish)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          dish.available
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40'
                            : 'bg-rose-950/40 text-rose-300 border-rose-600/40 hover:bg-rose-900/40'
                        }`}
                        title="Click to toggle availability"
                      >
                        {dish.available ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>In Stock</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Sold Out</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(dish)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors"
                          title="Edit Dish"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIsDeleting(dish)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors"
                          title="Archive or Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit / Create Dish Modal */}
      {isEditModalOpen && editingDish && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsEditModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6">
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {editingDish.id ? `Edit: ${editingDish.name}` : 'Add New Culinary Creation'}
              </h2>
              <p className="text-xs text-beige mt-1">
                Configure dish descriptions, selling price, ingredients and stock availability.
              </p>
            </div>

            <form onSubmit={handleSaveDish} className="space-y-4 text-xs">
              {/* Dish Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-beige mb-1 font-medium">Dish Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Handi Paneer"
                    value={editingDish.name || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Category *</label>
                  <select
                    value={editingDish.category || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Price & Compare Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-beige mb-1 font-medium">Selling Price (INR ₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="325"
                    value={editingDish.price || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, price: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Original / Strikethrough Price (Optional)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="360"
                    value={editingDish.compareAtPrice || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, compareAtPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Dietary Type, Spice Level, Prep Time */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-beige mb-1 font-medium">Dietary Type</label>
                  <select
                    value={editingDish.isVeg ? 'true' : 'false'}
                    onChange={(e) => setEditingDish({ ...editingDish, isVeg: e.target.value === 'true' })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="true">Pure Vegetarian (Green Dot)</option>
                    <option value="false">Non-Vegetarian (Red Dot)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Spice Level</label>
                  <select
                    value={editingDish.spiceLevel || 2}
                    onChange={(e) => setEditingDish({ ...editingDish, spiceLevel: Number(e.target.value) as 1 | 2 | 3 })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="1">1 - Mild / Delicate</option>
                    <option value="2">2 - Medium Indian Spiced</option>
                    <option value="3">3 - Fiery & Spicy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Prep Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 20 mins"
                    value={editingDish.preparationTime || '20 mins'}
                    onChange={(e) => setEditingDish({ ...editingDish, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Uploader */}
              <ImageUploader
                value={editingDish.image || ''}
                onChange={(url) => setEditingDish({ ...editingDish, image: url })}
                label="Dish Photograph"
              />

              {/* Short & Detailed Description */}
              <div>
                <label className="block text-beige mb-1 font-medium">Short Description</label>
                <input
                  type="text"
                  placeholder="Rich, aromatic curry with soft paneer cubes..."
                  value={editingDish.description || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Full Epicurean Description</label>
                <textarea
                  rows={3}
                  placeholder="Fresh malai paneer simmered in an earthenware clay pot..."
                  value={editingDish.fullDescription || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, fullDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              {/* Ingredients & Chef Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-beige mb-1 font-medium">Key Ingredients (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Malai Paneer, Earthen Pot Masala, Desi Ghee"
                    value={Array.isArray(editingDish.ingredients) ? editingDish.ingredients.join(', ') : ''}
                    onChange={(e) =>
                      setEditingDish({
                        ...editingDish,
                        ingredients: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Chef's Secret Note</label>
                  <input
                    type="text"
                    placeholder="Slow-simmered in clay handi to impart authentic smoky earthiness..."
                    value={editingDish.chefNote || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, chefNote: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkboxes: Signature & Available */}
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.isSignature || false}
                    onChange={(e) => setEditingDish({ ...editingDish, isSignature: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold focus:ring-gold"
                  />
                  <span className="text-warmwhite font-medium">Mark as Chef's Signature Dish</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingDish.available ?? true}
                    onChange={(e) => setEditingDish({ ...editingDish, available: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold focus:ring-gold"
                  />
                  <span className="text-warmwhite font-medium">Immediately Available on Website</span>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider shadow-gold-sm transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Dish Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Archive Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(isDeleting)}
        title="Remove Dish from Menu"
        message={`Are you sure you want to remove "${isDeleting?.name}"? If this item has previous customer orders, the system will safely archive it and mark it unavailable rather than corrupting financial order histories.`}
        confirmLabel="Archive / Remove"
        isDestructive={true}
        isLoading={isSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
};
