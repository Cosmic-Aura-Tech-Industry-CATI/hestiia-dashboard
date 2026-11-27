'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Mail,
  Phone,
  Search,
  RefreshCw,
  Trash2,
  X,
  Clock,
  CheckCircle2,
  MessageSquare,
  Archive,
  Calendar,
  Eye,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser } from '../services/apiClient';
import { AdminUser, ContactInquiry, ContactStats, ContactStatus } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

const SUBJECT_OPTIONS = [
  { value: 'all', label: 'All Subjects' },
  { value: 'general', label: 'General Inquiry' },
  { value: 'feedback', label: 'Dining Feedback' },
  { value: 'complaint', label: 'Complaint / Issue' },
  { value: 'catering', label: 'Catering' },
  { value: 'events', label: 'Private Events' },
  { value: 'partnership', label: 'Business Partnership' },
  { value: 'careers', label: 'Careers' },
  { value: 'other', label: 'Other' },
];

function getStatusBadge(status: ContactStatus) {
  if (status === 'new') return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  if (status === 'in_progress') return 'bg-sky-950/60 text-sky-300 border-sky-500/40';
  if (status === 'responded') return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40';
  return 'bg-zinc-800/80 text-zinc-400 border-zinc-700';
}

export const ContactInquiries: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isSuperadmin = (currentUser?.role || '').toUpperCase() === 'SUPERADMIN';
  const { success, error } = useToast();

  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [countsByStatus, setCountsByStatus] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail & Response Modal
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [editStatus, setEditStatus] = useState<ContactStatus>('in_progress');
  const [responseNotes, setResponseNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Confirmation (Superadmin Only)
  const [deletingInquiry, setDeletingInquiry] = useState<ContactInquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminApi.getContactStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch {
      // Non-critical stats
    }
  }, []);

  const fetchInquiries = useCallback(
    async (silent = false, targetPage = page) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminApi.getContactInquiries({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          subject: subjectFilter !== 'all' ? subjectFilter : undefined,
          search: searchQuery.trim() || undefined,
          page: targetPage,
          limit: 20,
        });
        if (res.success) {
          setInquiries(res.inquiries || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? res.inquiries?.length ?? 0);
          setCountsByStatus(res.countsByStatus || {});
        }
      } catch (err: any) {
        error(err.message || 'Failed to load contact inquiries.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, subjectFilter, searchQuery, page]
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    fetchInquiries(false, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, subjectFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchInquiries(false, 1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setSubjectFilter('all');
    setPage(1);
    adminApi
      .getContactInquiries({ page: 1, limit: 20 })
      .then((res) => {
        if (res.success) {
          setInquiries(res.inquiries || []);
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? 0);
          setCountsByStatus(res.countsByStatus || {});
        }
      })
      .catch(() => {});
  };

  const handleOpenModal = (inq: ContactInquiry) => {
    setSelectedInquiry(inq);
    setEditStatus(inq.status);
    setResponseNotes(inq.responseNotes || '');
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;

    try {
      setIsSaving(true);
      const res = await adminApi.updateContactInquiry(selectedInquiry.id, {
        status: editStatus,
        responseNotes: responseNotes.trim(),
      });
      if (res.success) {
        success(res.message || 'Contact inquiry updated.');
        setSelectedInquiry(null);
        fetchInquiries(true, page);
        fetchStats();
      }
    } catch (err: any) {
      error(err.message || 'Failed to update contact inquiry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInquiry) return;
    try {
      setIsDeleting(true);
      const res = await adminApi.deleteContactInquiry(deletingInquiry.id);
      if (res.success) {
        success(res.message || 'Contact inquiry deleted.');
        setDeletingInquiry(null);
        fetchInquiries(true, page);
        fetchStats();
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete contact inquiry.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Inquiries & Messages"
        subtitle="Manage guest inquiries, feedback, catering questions, and partnership messages from the website"
        action={
          <button
            type="button"
            onClick={() => {
              fetchInquiries(true, page);
              fetchStats();
            }}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border flex items-center justify-between">
          <div>
            <span className="text-[11px] text-beige-muted uppercase tracking-wider font-medium">Total</span>
            <div className="font-serif text-2xl font-bold text-warmwhite mt-1">
              {stats?.total ?? countsByStatus.total ?? total}
            </div>
          </div>
          <Mail className="w-5 h-5 text-beige-muted" />
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-amber-300 uppercase tracking-wider font-medium">New</span>
            <div className="font-serif text-2xl font-bold text-amber-300 mt-1">
              {stats?.new ?? countsByStatus.new ?? 0}
            </div>
          </div>
          <Clock className="w-5 h-5 text-amber-300" />
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-sky-500/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-sky-300 uppercase tracking-wider font-medium">In Progress</span>
            <div className="font-serif text-2xl font-bold text-sky-300 mt-1">
              {stats?.in_progress ?? countsByStatus.in_progress ?? 0}
            </div>
          </div>
          <MessageSquare className="w-5 h-5 text-sky-300" />
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-600/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-emerald-300 uppercase tracking-wider font-medium">Responded</span>
            <div className="font-serif text-2xl font-bold text-emerald-300 mt-1">
              {stats?.responded ?? countsByStatus.responded ?? 0}
            </div>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="p-4 rounded-2xl bg-charcoal-card border border-gold/30 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gold uppercase tracking-wider font-medium">Last 7 Days</span>
            <div className="font-serif text-2xl font-bold text-gold mt-1">{stats?.recentWeekCount ?? 0}</div>
          </div>
          <Calendar className="w-5 h-5 text-gold" />
        </div>
      </div>

      {/* Status Pills + Search & Subject Filter */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { value: 'all', label: 'All' },
              { value: 'new', label: 'New' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'responded', label: 'Responded' },
              { value: 'archived', label: 'Archived' },
            ] as const
          ).map((st) => (
            <button
              key={st.value}
              type="button"
              onClick={() => setStatusFilter(st.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                statusFilter === st.value
                  ? 'bg-gold/15 border-gold text-gold'
                  : 'bg-charcoal border-charcoal-border text-beige hover:text-warmwhite'
              }`}
            >
              {st.label}
              {countsByStatus[st.value === 'all' ? 'total' : st.value] !== undefined &&
                ` (${countsByStatus[st.value === 'all' ? 'total' : st.value]})`}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          <form onSubmit={handleSearchSubmit} className="lg:col-span-8 flex gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by sender name, email, phone, subject, or message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
                  title="Clear filters"
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

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="lg:col-span-4 px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inquiries Table */}
      {isLoading ? (
        <LoadingState message="Loading contact inquiries..." />
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No Contact Messages Found"
          description="Guest messages submitted via the website contact form will appear here."
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Sender</th>
                  <th className="py-3.5 px-4 font-semibold">Subject &amp; Message</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold">Received</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite text-sm">{inq.name}</div>
                      <div className="text-[11px] text-beige">{inq.email}</div>
                      {inq.phone && <div className="text-[10px] text-beige-muted">{inq.phone}</div>}
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-semibold uppercase mb-1">
                        {inq.subject}
                      </span>
                      <p className="text-xs text-beige line-clamp-2">{inq.message}</p>
                      {inq.responseNotes && (
                        <p className="text-[10px] text-emerald-300 mt-1 line-clamp-1">
                          Note: {inq.responseNotes}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize ${getStatusBadge(
                          inq.status
                        )}`}
                      >
                        {inq.status.replace('_', ' ')}
                      </span>
                      {inq.respondedBy && (
                        <div className="text-[10px] text-beige-muted mt-1">By: {inq.respondedBy}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-beige-muted text-[11px]">
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleString('en-IN') : 'N/A'}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(inq)}
                          className="px-3 py-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                        {isSuperadmin && (
                          <button
                            type="button"
                            onClick={() => setDeletingInquiry(inq)}
                            className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 cursor-pointer"
                            title="Delete Inquiry (Superadmin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of{' '}
                <strong className="text-warmwhite">{totalPages}</strong> ({total} inquiries)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchInquiries(false, p);
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
                    fetchInquiries(false, p);
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

      {/* Review & Respond Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedInquiry(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[92vh] overflow-y-auto text-xs space-y-4">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-[10px] font-semibold uppercase">
                {selectedInquiry.subject}
              </span>
              <h2 className="font-serif text-2xl font-bold text-warmwhite mt-2">{selectedInquiry.name}</h2>
              <div className="flex flex-wrap gap-3 text-[11px] text-beige mt-1">
                <a href={`mailto:${selectedInquiry.email}`} className="text-gold hover:underline inline-flex items-center space-x-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{selectedInquiry.email}</span>
                </a>
                {selectedInquiry.phone && (
                  <a href={`tel:${selectedInquiry.phone}`} className="text-gold hover:underline inline-flex items-center space-x-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{selectedInquiry.phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border text-warmwhite leading-relaxed whitespace-pre-wrap">
              {selectedInquiry.message}
            </div>

            <form onSubmit={handleSaveResponse} className="space-y-3.5">
              <div>
                <label className="block text-beige mb-1 font-medium">Workflow Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as ContactStatus)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                >
                  <option value="new">New</option>
                  <option value="in_progress">In Progress</option>
                  <option value="responded">Responded</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Internal Response Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record call summary, email reply sent, or resolution notes..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Update Inquiry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingInquiry)}
        title="Delete Contact Inquiry"
        message={`Are you sure you want to permanently delete the inquiry from "${deletingInquiry?.name}"?`}
        confirmLabel="Delete Inquiry"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingInquiry(null)}
      />
    </div>
  );
};
