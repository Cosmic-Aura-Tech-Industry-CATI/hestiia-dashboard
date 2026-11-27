'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  Trash2,
  Tags,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  UtensilsCrossed,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<FoodCategory> | null>(null);
  const [isDeleting, setIsDeleting] = useState<FoodCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  // Filtered categories
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // Status filter
      if (statusFilter === 'active' && !cat.isActive) return false;
      if (statusFilter === 'inactive' && cat.isActive) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = cat.name.toLowerCase().includes(q);
        const matchesDesc = (cat.description || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [categories, statusFilter, searchQuery]);

  // Aggregate stats
  const totalDishesCount = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c.itemCount || 0), 0);
  }, [categories]);

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

  // 1-Click Status Toggle
  const handleToggleActive = async (category: FoodCategory) => {
    try {
      setTogglingId(category.id);
      const updatedStatus = !category.isActive;
      const res = await adminApi.updateCategory(category.id, { isActive: updatedStatus });
      if (res.success) {
        setCategories((prev) =>
          prev.map((c) => (c.id === category.id ? { ...c, isActive: updatedStatus } : c))
        );
        success(`'${category.name}' marked as ${updatedStatus ? 'Active' : 'Inactive'}.`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update category status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name?.trim()) {
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

    // Check if category has active dishes
    if (isDeleting.itemCount && isDeleting.itemCount > 0) {
      error(`Cannot delete '${isDeleting.name}' because it contains ${isDeleting.itemCount} dish(es). Please reassign or delete these dishes first.`);
      return;
    }

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
        subtitle="Organize dishes into intuitive culinary sections for diner browsing & digital ordering"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Aggregate Badges */}
            <div className="hidden sm:flex items-center space-x-2 text-xs text-beige bg-charcoal-card border border-charcoal-border px-3.5 py-2 rounded-xl">
              <span>Categories: <strong className="text-gold font-bold">{categories.length}</strong></span>
              <span className="text-charcoal-border">|</span>
              <span>Total Dishes: <strong className="text-gold font-bold">{totalDishesCount}</strong></span>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-charcoal border border-charcoal-border rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-gold text-charcoal-950 font-bold shadow-sm'
                    : 'text-beige hover:text-warmwhite'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-gold text-charcoal-950 font-bold shadow-sm'
                    : 'text-beige hover:text-warmwhite'
                }`}
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* Add Category Button */}
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Category</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search category name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Statuses ({categories.length})</option>
            <option value="active">Active Only ({categories.filter((c) => c.isActive).length})</option>
            <option value="inactive">Inactive Only ({categories.filter((c) => !c.isActive).length})</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <LoadingState message="Loading culinary categories..." />
      ) : filteredCategories.length === 0 ? (
        <EmptyState
          title="No Categories Found"
          description={
            searchQuery || statusFilter !== 'all'
              ? 'No categories match your search criteria. Try resetting the filters.'
              : 'Create your first food category (e.g. Starters, Main Course, Biryani).'
          }
          action={
            searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl"
              >
                Reset Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl"
              >
                Add First Category
              </button>
            )
          }
        />
      ) : viewMode === 'table' ? (
        /* ========================================================================= */
        /* HIGH-DENSITY COMPACT TABLE VIEW                                           */
        /* ========================================================================= */
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-3 font-semibold text-center w-14">Seq #</th>
                  <th className="py-3.5 px-4 font-semibold">Category Name</th>
                  <th className="py-3.5 px-4 font-semibold">Description</th>
                  <th className="py-3.5 px-4 font-semibold">Associated Dishes</th>
                  <th className="py-3.5 px-4 font-semibold">Digital Menu Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {filteredCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-charcoal/40 transition-colors">
                    {/* Sequence */}
                    <td className="py-3.5 px-3 text-center font-mono text-gold font-bold text-xs">
                      #{category.displayOrder ?? 0}
                    </td>

                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border text-gold">
                          <Tags className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-serif font-bold text-warmwhite text-sm">
                          {category.name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-4 text-beige max-w-xs truncate">
                      {category.description || <span className="text-beige-muted italic">No description</span>}
                    </td>

                    {/* Associated Dishes (Drill-Down Link) */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <Link
                        href={`/admin/menu?category=${encodeURIComponent(category.name)}`}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-gold text-[11px] font-semibold transition-all group"
                        title="View all dishes in this category"
                      >
                        <UtensilsCrossed className="w-3 h-3 text-gold" />
                        <span>{category.itemCount || 0} dish(es)</span>
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </td>

                    {/* Status with 1-Click Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={togglingId === category.id}
                        onClick={() => handleToggleActive(category)}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          category.isActive
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40'
                            : 'bg-zinc-800/60 text-zinc-400 border-zinc-700 hover:bg-zinc-700/60'
                        }`}
                        title="Click to toggle category visibility on digital menu"
                      >
                        {togglingId === category.id ? (
                          <RotateCcw className="w-3 h-3 animate-spin text-gold" />
                        ) : category.isActive ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-zinc-400" />
                        )}
                        <span>{category.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(category)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setIsDeleting(category)}
                          className={`p-1.5 rounded-lg bg-charcoal border transition-colors cursor-pointer ${
                            category.itemCount && category.itemCount > 0
                              ? 'border-amber-600/30 text-amber-400 hover:border-amber-500'
                              : 'border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400'
                          }`}
                          title={
                            category.itemCount && category.itemCount > 0
                              ? `Contains ${category.itemCount} dish(es) - Reassign before deleting`
                              : 'Delete Category'
                          }
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
      ) : (
        /* ========================================================================= */
        /* CARDS GRID VIEW                                                           */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCategories.map((category) => (
            <div
              key={category.id}
              className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all shadow-md flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Name, Seq # & Status Switch */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold flex-shrink-0">
                      <Tags className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-warmwhite text-lg">
                          {category.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-charcoal border border-charcoal-border text-gold">
                          #{category.displayOrder ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Status Switch */}
                  <button
                    type="button"
                    disabled={togglingId === category.id}
                    onClick={() => handleToggleActive(category)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer flex items-center space-x-1 ${
                      category.isActive
                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40'
                        : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                    }`}
                    title="Click to toggle category status"
                  >
                    {togglingId === category.id ? (
                      <RotateCcw className="w-2.5 h-2.5 animate-spin text-gold" />
                    ) : (
                      <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                    )}
                    <span>{category.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs text-beige line-clamp-2 mb-4 leading-relaxed min-h-[32px]">
                  {category.description || <span className="text-beige-muted italic">No description provided for this culinary category.</span>}
                </p>
              </div>

              {/* Bottom Footer: Drill-down & Action Buttons */}
              <div className="pt-3 border-t border-charcoal-border/70 flex items-center justify-between text-xs">
                {/* Drill-down link to Dishes */}
                <Link
                  href={`/admin/menu?category=${encodeURIComponent(category.name)}`}
                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold/60 text-gold text-[11px] font-medium transition-all group-hover:border-gold/40"
                  title="Click to view all dishes in this category"
                >
                  <UtensilsCrossed className="w-3 h-3" />
                  <span>
                    <strong>{category.itemCount || 0}</strong> dish(es)
                  </span>
                  <ArrowRight className="w-3 h-3 text-beige-muted group-hover:text-gold transition-colors" />
                </Link>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleOpenEdit(category)}
                    className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsDeleting(category)}
                    className={`p-1.5 rounded-lg bg-charcoal border transition-colors cursor-pointer ${
                      category.itemCount && category.itemCount > 0
                        ? 'border-amber-600/30 text-amber-400 hover:border-amber-500'
                        : 'border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400'
                    }`}
                    title={
                      category.itemCount && category.itemCount > 0
                        ? `Contains ${category.itemCount} dish(es) - Reassign before deleting`
                        : 'Delete Category'
                    }
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
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-5">
              <h2 className="font-serif text-xl font-bold text-warmwhite">
                {editingCategory.id ? `Edit: ${editingCategory.name}` : 'New Menu Category'}
              </h2>
              <p className="text-xs text-beige mt-1">
                Categories help guests explore specific courses, gravies, and dietary options.
              </p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-beige mb-1 font-medium">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Tandoor & Kebabs, Main Course"
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
                  <label className="block text-beige mb-1 font-medium">Display Sort Order (#)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingCategory.displayOrder || 1}
                    onChange={(e) => setEditingCategory({ ...editingCategory, displayOrder: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] text-beige-muted mt-0.5 block">1 = Top of digital menu</span>
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
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation / Protection Dialog */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-charcoal-card border border-rose-500/40 text-warmwhite p-6 rounded-3xl max-w-md w-full shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-charcoal-border pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-serif font-bold text-base text-warmwhite">Delete Category</h3>
              </div>
              <button
                onClick={() => setIsDeleting(null)}
                className="text-beige-muted hover:text-warmwhite transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Check if category has active dishes */}
            {isDeleting.itemCount && isDeleting.itemCount > 0 ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Deletion Blocked by Backend Security Rule</span>
                  </div>
                  <p className="leading-relaxed">
                    Category <strong>'{isDeleting.name}'</strong> currently contains{' '}
                    <strong className="text-amber-300">{isDeleting.itemCount} active food dish(es)</strong>.
                    To prevent orphaned menu items, the backend database requires that you reassign or remove these dishes first.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between space-x-3">
                  <Link
                    href={`/admin/menu?category=${encodeURIComponent(isDeleting.name)}`}
                    onClick={() => setIsDeleting(null)}
                    className="flex-1 py-2 px-3 rounded-xl bg-gold/15 border border-gold/30 hover:bg-gold hover:text-charcoal-950 text-gold text-xs font-bold text-center inline-flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>View {isDeleting.itemCount} Dishes in Menu</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setIsDeleting(null)}
                    className="px-4 py-2 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-warmwhite text-xs font-semibold"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="text-beige leading-relaxed">
                  Are you sure you want to permanently delete category <strong className="text-gold">'{isDeleting.name}'</strong>? This category contains 0 dishes and can be safely removed.
                </p>

                <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                  <button
                    type="button"
                    onClick={() => setIsDeleting(null)}
                    className="px-4 py-2 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-warmwhite text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleConfirmDelete}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Confirm Delete</span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
