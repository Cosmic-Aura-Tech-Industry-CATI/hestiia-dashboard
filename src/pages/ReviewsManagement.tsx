import React, { useState, useEffect } from 'react';
import {
  MessageSquareQuote,
  Star,
  CheckCircle2,
  XCircle,
  Search,
  MessageSquare,
  ExternalLink,
  QrCode,
  Send,
  AlertCircle,
  X,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { ReviewItem } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const ReviewsManagement: React.FC = () => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<ReviewItem | null>(null);
  const [replyInput, setReplyInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { success, error } = useToast();

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getReviews({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (res.success) {
        setReviews(res.reviews);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch customer reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const handleToggleApproval = async (review: ReviewItem) => {
    try {
      const res = await adminApi.toggleReviewApproval(review.id, !review.isApproved);
      if (res.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === review.id ? { ...r, isApproved: res.review.isApproved } : r))
        );
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
          prev.map((r) => (r.id === selectedReview.id ? { ...r, staffReply: replyInput } : r))
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

  const handleDeleteReview = async (id: string) => {
    try {
      const res = await adminApi.deleteReview(id);
      if (res.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        success(res.message);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete review.');
    }
  };

  // Google review destination URL for PAC Road, Shyam Nagar, Kanpur
  const googleReviewUrl = 'https://g.page/r/hestiia-restaurant-kanpur/review';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patron Reviews & Dining Feedback"
        subtitle="Manage customer testimonials, respond to guest reviews, and inspect Google Review verification"
      />

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
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by diner name, feedback keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none w-full sm:w-auto"
        >
          <option value="all">All Feedback</option>
          <option value="approved">Approved & Published on Web</option>
          <option value="pending">Pending Moderation</option>
        </select>
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
                    {rev.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-serif font-bold text-warmwhite text-base">{rev.customerName}</div>
                    <div className="text-[11px] text-beige-muted">
                      Source: <span className="capitalize font-medium text-beige">{rev.source}</span>
                      {rev.dishName && <span> • Dish: <strong className="text-gold">{rev.dishName}</strong></span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? 'fill-gold text-gold' : 'text-zinc-700'
                        }`}
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
              <p className="text-xs text-warmwhite leading-relaxed pl-1 italic">
                "{rev.comment}"
              </p>

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
              <div className="pt-3 border-t border-charcoal-border/70 flex items-center justify-between text-xs">
                <span className="text-[10px] text-beige-muted">
                  Logged: {new Date(rev.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleToggleApproval(rev)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
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
                    className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold transition-all"
                  >
                    {rev.staffReply ? 'Edit Reply' : 'Add Staff Reply'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
                    title="Delete Review"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Staff Reply Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedReview(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setSelectedReview(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                Respond to {selectedReview.customerName}
              </h2>
              <p className="text-beige text-[11px] mt-0.5 italic">
                "{selectedReview.comment}"
              </p>
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
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold uppercase tracking-wider shadow-gold-sm transition-all"
                >
                  {isUpdating ? 'Publishing...' : 'Save Management Reply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
