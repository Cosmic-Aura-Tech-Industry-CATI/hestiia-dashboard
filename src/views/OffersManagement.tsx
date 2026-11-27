'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  TicketPercent,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Copy,
  Check,
  Sparkles,
  Megaphone,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Calendar,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { AdminUser, Offer, OfferCounts, OfferDiscountType, OfferFulfillmentType, OfferValidationResult } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

const FULFILLMENT_CHANNELS: Array<{ value: OfferFulfillmentType; label: string }> = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'dine-in', label: 'Dine-In' },
  { value: 'pickup', label: 'Pickup' },
];

function formatDiscountLabel(offer: Offer): string {
  if (offer.discountType === 'percentage') {
    const cap = offer.maxDiscountAmount ? ` (Max ₹${offer.maxDiscountAmount})` : '';
    return `${offer.discountValue}% OFF${cap}`;
  }
  if (offer.discountType === 'fixed') {
    return `Flat ₹${offer.discountValue} OFF`;
  }
  return `Free Delivery (₹${offer.discountValue} credit)`;
}

function toDateInputValue(dateStr?: string): string {
  if (!dateStr) return '';
  return String(dateStr).split('T')[0];
}

const INITIAL_OFFER: Partial<Offer> = {
  code: '',
  title: '',
  description: '',
  discountType: 'percentage',
  discountValue: 10,
  maxDiscountAmount: 150,
  minOrderValue: 299,
  usageLimit: undefined,
  perUserLimit: 1,
  applicableFulfillment: ['delivery', 'dine-in', 'pickup'],
  displayOnBanner: false,
  bannerText: '',
  startDate: '',
  endDate: '',
  isActive: true,
};

export const OffersManagement: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [counts, setCounts] = useState<OfferCounts>({ total: 0, active: 0, inactive: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal & Action State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingOffer, setDeletingOffer] = useState<Offer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Live Coupon Tester State
  const [testCode, setTestCode] = useState('');
  const [testSubtotal, setTestSubtotal] = useState(500);
  const [testFulfillment, setTestFulfillment] = useState<OfferFulfillmentType>('delivery');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; discountAmount?: number } | null>(null);

  const { success, error } = useToast();
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);

  const fetchOffers = useCallback(
    async (targetPage = page) => {
      try {
        setIsLoading(true);
        const res = await adminApi.getOffers({
          search: searchQuery.trim() || undefined,
          isActive: statusFilter !== 'all' ? statusFilter : undefined,
          page: targetPage,
          limit: 20,
        });
        if (res.success) {
          setOffers(res.offers || []);
          setCounts(res.counts || { total: res.offers?.length || 0, active: 0, inactive: 0 });
          setTotalPages(res.pagination?.totalPages || 1);
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch promotional offers.');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, searchQuery, page]
  );

  useEffect(() => {
    setPage(1);
    fetchOffers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const totalRedemptions = useMemo(
    () => offers.reduce((sum, o) => sum + (o.usedCount || 0), 0),
    [offers]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOffers(1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
    // Fetch unfiltered list immediately
    adminApi
      .getOffers({ page: 1, limit: 20 })
      .then((res) => {
        if (res.success) {
          setOffers(res.offers || []);
          setCounts(res.counts || { total: res.offers?.length || 0, active: 0, inactive: 0 });
          setTotalPages(res.pagination?.totalPages || 1);
        }
      })
      .catch(() => {});
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTestCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const handleOpenCreate = () => {
    setEditingOffer({ ...INITIAL_OFFER });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    setEditingOffer({
      ...offer,
      startDate: toDateInputValue(offer.startDate),
      endDate: toDateInputValue(offer.endDate),
    });
    setIsModalOpen(true);
  };

  const handleToggleField = async (offer: Offer, field: 'isActive' | 'displayOnBanner') => {
    if (isStaff) return;
    try {
      setTogglingId(offer.id);
      const nextVal = !offer[field];
      const res = await adminApi.updateOffer(offer.id, { [field]: nextVal });
      if (res.success) {
        success(
          field === 'isActive'
            ? `Coupon '${offer.code}' ${nextVal ? 'activated' : 'paused'}.`
            : `Banner ribbon ${nextVal ? 'enabled' : 'disabled'} for '${offer.code}'.`
        );
        fetchOffers(page);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update offer.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleFulfillmentToggle = (channel: OfferFulfillmentType) => {
    if (!editingOffer) return;
    const current = editingOffer.applicableFulfillment || [];
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    setEditingOffer({ ...editingOffer, applicableFulfillment: next });
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer || !editingOffer.code?.trim() || !editingOffer.title?.trim()) {
      error('Coupon code and offer title are required.');
      return;
    }

    const payload: Partial<Offer> = {
      ...editingOffer,
      code: editingOffer.code.trim().toUpperCase(),
      title: editingOffer.title.trim(),
      description: (editingOffer.description || '').trim(),
      discountValue: Number(editingOffer.discountValue) || 0,
      minOrderValue: Number(editingOffer.minOrderValue) || 0,
      maxDiscountAmount: editingOffer.maxDiscountAmount ? Number(editingOffer.maxDiscountAmount) : undefined,
      usageLimit: editingOffer.usageLimit ? Number(editingOffer.usageLimit) : undefined,
      perUserLimit: Number(editingOffer.perUserLimit) || 1,
      startDate: editingOffer.startDate || undefined,
      endDate: editingOffer.endDate || undefined,
      applicableFulfillment:
        editingOffer.applicableFulfillment && editingOffer.applicableFulfillment.length > 0
          ? editingOffer.applicableFulfillment
          : ['delivery', 'dine-in', 'pickup'],
    };

    try {
      setIsSubmitting(true);
      if (editingOffer.id) {
        const res = await adminApi.updateOffer(editingOffer.id, payload);
        if (res.success) {
          success(res.message || 'Offer updated successfully.');
          setIsModalOpen(false);
          fetchOffers(page);
        }
      } else {
        const res = await adminApi.createOffer(payload);
        if (res.success) {
          success(res.message || 'Offer created successfully.');
          setIsModalOpen(false);
          setPage(1);
          fetchOffers(1);
        }
      }
    } catch (err: any) {
      error(err.message || 'Failed to save promotional offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingOffer) return;
    try {
      setIsDeleting(true);
      const res = await adminApi.deleteOffer(deletingOffer.id);
      if (res.success) {
        success(res.message || `Coupon '${deletingOffer.code}' deleted.`);
        setDeletingOffer(null);
        fetchOffers(page);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete coupon offer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTestCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testCode.trim()) {
      error('Enter a coupon code to validate.');
      return;
    }
    try {
      setIsTesting(true);
      setTestResult(null);
      const res = await adminApi.validateOffer({
        code: testCode.trim().toUpperCase(),
        subtotal: Number(testSubtotal) || 0,
        fulfillmentType: testFulfillment,
      });
      setTestResult({
        ok: true,
        message: res.message,
        discountAmount: res.discountAmount,
      });
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: err.message || 'Coupon validation failed.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupon Codes & Offers"
        subtitle="Manage promo codes, checkout discounts, usage limits, and homepage announcement banners"
        action={
          !isStaff && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Coupon Offer</span>
            </button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Total Coupons</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite mt-1">{counts.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-charcoal border border-charcoal-border flex items-center justify-center text-beige-muted">
            <TicketPercent className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-emerald-600/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-medium">Active Offers</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-300 mt-1">{counts.active}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Paused / Inactive</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-beige mt-1">{counts.inactive}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-charcoal border border-charcoal-border flex items-center justify-center text-zinc-400">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-gold/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold uppercase tracking-wider font-medium">Redemptions (Page)</span>
            <div className="font-serif text-2xl sm:text-3xl font-bold text-gold mt-1">{totalRedemptions}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search/Filter + Live Coupon Validator */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        <div className="xl:col-span-7 p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-0 flex gap-2">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search coupon code, title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  title="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-xs font-semibold text-warmwhite hover:text-gold transition-colors cursor-pointer shrink-0"
            >
              Search
            </button>
          </form>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'true' | 'false')}
            className="w-full sm:w-44 px-3 py-2.5 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer shrink-0"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Paused Only</option>
          </select>
        </div>

        {/* Live Coupon Validator */}
        <form
          onSubmit={handleTestCoupon}
          className="xl:col-span-5 p-4 rounded-2xl bg-charcoal-card border border-gold/30 space-y-2.5 text-xs overflow-hidden"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 text-gold font-semibold uppercase tracking-wider text-[10px]">
              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
              <span>Live Coupon Validator</span>
            </div>
            <span className="text-[10px] text-beige-muted hidden sm:inline">Test checkout discount rules</span>
          </div>

          <div className="grid grid-cols-12 gap-2 items-center">
            <input
              type="text"
              placeholder="CODE"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value.toUpperCase())}
              className="col-span-5 sm:col-span-4 min-w-0 px-2.5 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted font-mono uppercase focus:border-gold focus:outline-none"
            />
            <div className="col-span-4 sm:col-span-3 relative min-w-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-beige-muted text-[11px] pointer-events-none">
                ₹
              </span>
              <input
                type="number"
                min="0"
                placeholder="500"
                value={testSubtotal}
                onChange={(e) => setTestSubtotal(Number(e.target.value))}
                className="w-full min-w-0 pl-6 pr-2 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              />
            </div>
            <select
              value={testFulfillment}
              onChange={(e) => setTestFulfillment(e.target.value as OfferFulfillmentType)}
              className="col-span-3 sm:col-span-3 min-w-0 px-2 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
            >
              {FULFILLMENT_CHANNELS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isTesting}
              className="col-span-12 sm:col-span-2 px-3 py-2 rounded-xl bg-gold text-charcoal-950 font-bold hover:bg-gold-light transition-colors cursor-pointer disabled:opacity-50 text-center"
            >
              {isTesting ? '...' : 'Test'}
            </button>
          </div>
          {testResult && (
            <div
              className={`p-2.5 rounded-xl text-[11px] border flex items-center justify-between gap-2 ${
                testResult.ok
                  ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-600/40 text-rose-300'
              }`}
            >
              <span>{testResult.message}</span>
              {typeof testResult.discountAmount === 'number' && testResult.ok && (
                <span className="font-mono font-bold text-emerald-200 shrink-0">
                  -₹{testResult.discountAmount}
                </span>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Offers Table */}
      {isLoading ? (
        <LoadingState message="Loading promotional coupon codes..." />
      ) : offers.length === 0 ? (
        <EmptyState
          title="No Coupon Offers Found"
          description="Create your first promo code or adjust your filters."
          action={
            !isStaff ? (
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2.5 bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md inline-flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Offer</span>
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Coupon Code</th>
                  <th className="py-3.5 px-4 font-semibold">Offer Title &amp; Rules</th>
                  <th className="py-3.5 px-4 font-semibold">Discount</th>
                  <th className="py-3.5 px-4 font-semibold">Usage</th>
                  <th className="py-3.5 px-4 font-semibold">Banner</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  {!isStaff && <th className="py-3.5 px-4 font-semibold text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(offer.code)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-charcoal border border-gold/40 text-gold font-mono font-bold text-xs hover:bg-gold/10 transition-colors cursor-pointer"
                        title="Click to copy & load into validator"
                      >
                        <TicketPercent className="w-3.5 h-3.5" />
                        <span>{offer.code}</span>
                        {copiedCode === offer.code ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-beige-muted" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite text-sm">{offer.title}</div>
                      {offer.description && (
                        <div className="text-[11px] text-beige line-clamp-1 max-w-xs">{offer.description}</div>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] text-beige-muted">
                        <span>Min: ₹{offer.minOrderValue || 0}</span>
                        <span>•</span>
                        <span className="capitalize">{(offer.applicableFulfillment || []).join(', ')}</span>
                        {(offer.startDate || offer.endDate) && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center space-x-1 text-gold/80">
                              <Calendar className="w-2.5 h-2.5" />
                              <span>
                                {toDateInputValue(offer.startDate) || 'Now'} &rarr; {toDateInputValue(offer.endDate) || '∞'}
                              </span>
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-serif font-bold text-gold">
                      {formatDiscountLabel(offer)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-beige">
                      <strong className="text-warmwhite">{offer.usedCount || 0}</strong>
                      {offer.usageLimit ? ` / ${offer.usageLimit}` : ' uses'}
                      <div className="text-[10px] text-beige-muted">{offer.perUserLimit || 1}/user limit</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isStaff || togglingId === offer.id}
                        onClick={() => handleToggleField(offer, 'displayOnBanner')}
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all ${
                          isStaff ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          offer.displayOnBanner
                            ? 'bg-gold/15 text-gold border-gold/40'
                            : 'bg-charcoal text-beige-muted border-charcoal-border'
                        }`}
                      >
                        <Megaphone className="w-3 h-3" />
                        <span>{offer.displayOnBanner ? 'On Banner' : 'Off'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isStaff || togglingId === offer.id}
                        onClick={() => handleToggleField(offer, 'isActive')}
                        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                          isStaff ? 'cursor-default' : 'cursor-pointer'
                        } ${
                          offer.isActive
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                            : 'bg-zinc-800/60 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {togglingId === offer.id ? (
                          <RotateCcw className="w-3 h-3 animate-spin text-gold" />
                        ) : offer.isActive ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-zinc-400" />
                        )}
                        <span>{offer.isActive ? 'Active' : 'Paused'}</span>
                      </button>
                    </td>

                    {!isStaff && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenEdit(offer)}
                            className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold transition-colors cursor-pointer"
                            title="Edit Offer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingOffer(offer)}
                            className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete Offer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of <strong className="text-warmwhite">{totalPages}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchOffers(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchOffers(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-xl bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {editingOffer.id ? `Edit Offer: ${editingOffer.code}` : 'Create Promotional Coupon'}
              </h2>
              <p className="text-beige text-[11px] mt-0.5">
                Configure coupon code, discount logic, usage caps, and homepage banner ribbon.
              </p>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g. WELCOME10"
                    value={editingOffer.code || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-gold font-mono uppercase focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Offer Title *</label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    placeholder="e.g. First Dining Welcome Offer"
                    value={editingOffer.title || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Description</label>
                <input
                  type="text"
                  placeholder="Get 10% off on your order above ₹299..."
                  value={editingOffer.description || ''}
                  onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Discount Type *</label>
                  <select
                    value={editingOffer.discountType || 'percentage'}
                    onChange={(e) =>
                      setEditingOffer({ ...editingOffer, discountType: e.target.value as OfferDiscountType })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Flat (₹)</option>
                    <option value="free_shipping">Free Delivery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">
                    {editingOffer.discountType === 'percentage'
                      ? 'Discount (%) *'
                      : editingOffer.discountType === 'fixed'
                        ? 'Discount (₹) *'
                        : 'Delivery Credit (₹) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={editingOffer.discountType === 'free_shipping' ? 0 : 1}
                    max={editingOffer.discountType === 'percentage' ? 100 : undefined}
                    value={editingOffer.discountValue ?? ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Max Cap (₹)</label>
                  <input
                    type="number"
                    min="0"
                    disabled={editingOffer.discountType !== 'percentage'}
                    placeholder={editingOffer.discountType === 'percentage' ? 'Optional' : 'N/A'}
                    value={editingOffer.discountType === 'percentage' ? (editingOffer.maxDiscountAmount ?? '') : ''}
                    onChange={(e) =>
                      setEditingOffer({
                        ...editingOffer,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Min Order Value (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingOffer.minOrderValue ?? 0}
                    onChange={(e) => setEditingOffer({ ...editingOffer, minOrderValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Total Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={editingOffer.usageLimit ?? ''}
                    onChange={(e) =>
                      setEditingOffer({
                        ...editingOffer,
                        usageLimit: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Per User Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={editingOffer.perUserLimit ?? 1}
                    onChange={(e) => setEditingOffer({ ...editingOffer, perUserLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={toDateInputValue(editingOffer.startDate)}
                    onChange={(e) => setEditingOffer({ ...editingOffer, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none [color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={toDateInputValue(editingOffer.endDate)}
                    onChange={(e) => setEditingOffer({ ...editingOffer, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1.5 font-medium">Applicable Fulfillment Modes</label>
                <div className="flex flex-wrap gap-2">
                  {FULFILLMENT_CHANNELS.map((c) => {
                    const checked = (editingOffer.applicableFulfillment || []).includes(c.value);
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => handleFulfillmentToggle(c.value)}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
                          checked
                            ? 'bg-gold/15 border-gold/50 text-gold'
                            : 'bg-charcoal border-charcoal-border text-beige-muted hover:text-warmwhite'
                        }`}
                      >
                        <Check className={`w-3 h-3 ${checked ? 'opacity-100' : 'opacity-25'}`} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-charcoal/80 border border-charcoal-border space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingOffer.displayOnBanner ?? false}
                    onChange={(e) => setEditingOffer({ ...editingOffer, displayOnBanner: e.target.checked })}
                    className="rounded bg-charcoal border-charcoal-border text-gold"
                  />
                  <span className="text-warmwhite font-medium">Display on Website Announcement Banner</span>
                </label>
                {editingOffer.displayOnBanner && (
                  <input
                    type="text"
                    placeholder="e.g. Use code WELCOME10 for 10% off on your dining order!"
                    value={editingOffer.bannerText || ''}
                    onChange={(e) => setEditingOffer({ ...editingOffer, bannerText: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal-card border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                )}
              </div>

              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingOffer.isActive ?? true}
                  onChange={(e) => setEditingOffer({ ...editingOffer, isActive: e.target.checked })}
                  className="rounded bg-charcoal border-charcoal-border text-gold"
                />
                <span className="text-warmwhite font-medium">Offer Active for Checkout</span>
              </label>

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
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Saving...' : 'Save Offer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingOffer)}
        title="Delete Coupon Offer"
        message={`Are you sure you want to permanently delete coupon '${deletingOffer?.code}'? Customers will no longer be able to redeem it.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingOffer(null)}
      />
    </div>
  );
};
