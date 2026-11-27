'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Star,
  Search,
  ExternalLink,
  QrCode,
  X,
  Lock,
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { AdminUser, ReviewItem } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

export const ReviewsManagement: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);
  const { success, error } = useToast();

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const [deletingReview, setDeletingReview] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchReviews = useCallback(
    async (targetPage = page) => {
      if (isStaff) return;
      try {
        setIsLoading(true);
        const res = await adminApi.getReviews({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          rating: ratingFilter !== 'all' ? ratingFilter : undefined,
          search: searchQuery.trim() || undefined,
          page: targetPage,
          limit: 20,
        });
        if (res.success) {
          setReviews(res.reviews || []);
          setTotalReviews(res.total ?? res.reviews?.length ?? 0);
          setTotalPages(res.totalPages || 1);
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch customer reviews.');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStaff, statusFilter, ratingFilter, searchQuery, page]
  );

  useEffect(() => {
    if (!isStaff) {
      setPage(1);
      fetchReviews(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff, statusFilter, ratingFilter]);

  const approvedCount = useMemo(() => reviews.filter((r) => r.isApproved).length, [reviews]);
  const pendingCount = useMemo(() => reviews.filter((r) => !r.isApproved).length, [reviews]);
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setRatingFilter('all');
    setPage(1);
    adminApi
      .getReviews({ page: 1, limit: 20 })
      .then((res) => {
        if (res.success) {
          setReviews(res.reviews || []);
          setTotalReviews(res.total ?? 0);
          setTotalPages(res.totalPages || 1);
        }
      })
      .catch(() => {});
  };

  const handleToggleApproval = async (review: ReviewItem) => {
    try {
      const res = await adminApi.toggleReviewApproval(review.id, !review.isApproved);
      if (res.success) {
        const nextVal = res.review?.isApproved ?? !review.isApproved;
        setReviews((prev) => prev.map((r) => (r.id === review.id ? { ...r, isApproved: nextVal } : r)));
        success(res.message);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update review approval.');
    }
  };

  const handleOpenReplyModal = (r: ReviewItem) => {
    setSelectedReview(r);
    setReplyInput(r.staffReply || '');
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    try {
      setIsUpdating(true);
      const res = await adminApi.replyReview(selectedReview.id, replyInput);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === selectedReview.id ? { ...r, staffReply: replyInput.trim() } : r))
        );
        success('Staff response published.');
        setSelectedReview(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to record staff response.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReview) return;
    try {
      setIsDeleting(true);
      const res = await adminApi.deleteReview(deletingReview.id);
      if (res.success) {
        setDeletingReview(null);
        success(res.message);
        fetchReviews(page);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete review.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Patron Reviews & Dining Feedback"
          subtitle="Manage customer testimonials, respond to guest reviews, and moderate feedback"
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            Review moderation, publishing, and management responses are restricted to Manager and Admin accounts.
          </p>
        </div>
      </div>
    );
  }

  // Google review destination URL for PAC Road, Shyam Nagar, Kanpur
  const googleReviewUrl = 'https://g.page/r/hestiia-restaurant-kanpur/review';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patron Reviews & Dining Feedback"
        subtitle="Manage customer testimonials, respond to guest reviews, and inspect Google Review verification"
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Total Reviews</span>
            <div className="font-serif text-2xl font-bold text-warmwhite mt-1">{totalReviews}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-charcoal border border-charcoal-border flex items-center justify-center text-beige-muted">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-600/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-medium">Published (Page)</span>
            <div className="font-serif text-2xl font-bold text-emerald-300 mt-1">{approvedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-600/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-medium">Pending (Page)</span>
            <div className="font-serif text-2xl font-bold text-amber-300 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center text-amber-300">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-gold/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold uppercase tracking-wider font-medium">Avg Rating (Page)</span>
            <div className="font-serif text-2xl font-bold text-gold mt-1">{avgRating} ★</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
            <Star className="w-5 h-5 fill-gold" />
          </div>
        </div>
      </div>

      {/* Google Review Integration Card & QR Helper */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-charcoal-card via-espresso-light/40 to-charcoal-card border border-gold/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-center text-gold flex-shrink-0">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-base font-bold text-warmwhite">Direct Google Review Destination</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-600/40 text-[10px] font-semibold">
                Legitimate Source
              </span>
            </div>
            <p className="text-xs text-beige mt-0.5">
              Encourage real diners to leave reviews using your verified Google Business profile link.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <span>Open Review Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="lg:col-span-6 flex gap-2 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by diner name, dish, or feedback keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearFilters}
                title="Clear search & filters"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-xs font-semibold text-warmwhite hover:text-gold transition-colors cursor-pointer shrink-0"
          >
            Search
          </button>
        </form>

        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
          >
            <option value="all">All Feedback</option>
            <option value="approved">Approved &amp; Published on Web</option>
            <option value="pending">Pending Moderation</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars Only</option>
            <option value="4">4 Stars Only</option>
            <option value="3">3 Stars Only</option>
            <option value="2">2 Stars Only</option>
            <option value="1">1 Star Only</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <LoadingState message="Fetching dining feedback..." />
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No Reviews Found"
          description="Customer testimonials and feedback submitted through the dining site will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-md space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/40 text-gold font-bold flex items-center justify-center flex-shrink-0">
                    {(rev.customerName || 'G').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-serif font-bold text-warmwhite text-base">{rev.customerName}</div>
                    <div className="text-[11px] text-beige-muted">
                      Source: <span className="capitalize font-medium text-beige">{rev.source}</span>
                      {rev.dishName && (
                        <span>
                          {' '}
                          • Dish: <strong className="text-gold">{rev.dishName}</strong>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < rev.rating ? 'fill-gold text-gold' : 'text-zinc-700'}`}
                      />
                    ))}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      rev.isApproved
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40'
                        : 'bg-amber-950/60 text-amber-300 border-amber-600/40'
                    }`}
                  >
                    {rev.isApproved ? 'Published' : 'Pending Moderation'}
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-xs text-warmwhite leading-relaxed pl-1 italic">&ldquo;{rev.comment}&rdquo;</p>

              {/* Staff Reply if any */}
              {rev.staffReply && (
                <div className="p-3.5 rounded-2xl bg-charcoal/80 border border-charcoal-border text-xs space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-gold font-bold block">
                    Official Hestiia Management Reply:
                  </span>
                  <p className="text-beige text-[11px]">{rev.staffReply}</p>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-3 border-t border-charcoal-border/70 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-[10px] text-beige-muted">
                  Logged:{' '}
                  {rev.createdAt
                    ? new Date(rev.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })
                    : 'N/A'}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(rev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      rev.isApproved
                        ? 'border-charcoal-border text-beige hover:text-warmwhite hover:bg-charcoal'
                        : 'border-emerald-600/50 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                    }`}
                  >
                    {rev.isApproved ? 'Unpublish from Web' : 'Approve for Web'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenReplyModal(rev)}
                    className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold transition-all cursor-pointer"
                  >
                    {rev.staffReply ? 'Edit Reply' : 'Add Staff Reply'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeletingReview(rev)}
                    className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of{' '}
                <strong className="text-warmwhite">{totalPages}</strong> ({totalReviews} reviews)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchReviews(p);
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
                    fetchReviews(p);
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

      {/* Staff Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedReview(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                Respond to {selectedReview.customerName}
              </h2>
              <p className="text-beige text-[11px] mt-0.5 italic">&ldquo;{selectedReview.comment}&rdquo;</p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              <div>
                <label className="block text-beige mb-1 font-medium">Public Management Response</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Thank you for dining with us! We appreciate your kind words regarding our Handi Paneer..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider shadow-gold-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isUpdating ? 'Publishing...' : 'Save Management Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingReview)}
        title="Delete Customer Review"
        message={`Are you sure you want to permanently remove the review from "${deletingReview?.customerName}"?`}
        confirmLabel="Delete Review"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingReview(null)}
      />
    </div>
  );
};
