'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  PartyPopper,
  Search,
  Phone,
  Calendar,
  Users,
  Edit2,
  X,
  Send,
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { PartyInquiry } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

const EVENT_TYPE_OPTIONS: Array<{ value: PartyInquiry['eventType']; label: string }> = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'corporate', label: 'Corporate Event' },
  { value: 'family_gathering', label: 'Family Gathering' },
  { value: 'other', label: 'Other Celebration' },
];

const STATUS_OPTIONS: Array<{ value: PartyInquiry['status']; label: string }> = [
  { value: 'new', label: 'New Requests' },
  { value: 'contacted', label: 'Under Discussion (Contacted)' },
  { value: 'quoted', label: 'Quote / Package Sent' },
  { value: 'confirmed', label: 'Banquet Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
];

function buildWhatsAppLink(inquiry: PartyInquiry): string {
  const cleanPhone = inquiry.phone.replace(/\D/g, '');
  const message =
    inquiry.status === 'confirmed'
      ? `Namaste ${inquiry.customerName}! 🎉 Your banquet/party booking at Hestiia Restaurant for ${inquiry.guestCount} guests on ${inquiry.preferredDate} is CONFIRMED! Our team looks forward to hosting your celebration.`
      : `Namaste ${inquiry.customerName}! 🎉 This is the Banquet Coordinator at Hestiia Restaurant, Shyam Nagar. Regarding your party inquiry for ${inquiry.guestCount} guests on ${inquiry.preferredDate}: We have exciting curated culinary packages ready for you!`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

const INITIAL_NEW_INQUIRY = {
  customerName: '',
  phone: '',
  email: '',
  eventType: 'birthday' as PartyInquiry['eventType'],
  preferredDate: new Date().toISOString().split('T')[0],
  guestCount: 25,
  budgetRange: '',
  specialRequirements: '',
};

export const PartyInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<PartyInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInquiries, setTotalInquiries] = useState(0);

  // Manage Drawer State
  const [selectedInquiry, setSelectedInquiry] = useState<PartyInquiry | null>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Create Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newInquiry, setNewInquiry] = useState(INITIAL_NEW_INQUIRY);
  const [isCreating, setIsCreating] = useState(false);

  // Delete Confirm State
  const [deletingInquiry, setDeletingInquiry] = useState<PartyInquiry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchPartyInquiries = useCallback(
    async (targetPage = page) => {
      try {
        setIsLoading(true);
        const res = await adminApi.getPartyInquiries({
          search: searchQuery.trim() || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          eventType: eventTypeFilter !== 'all' ? eventTypeFilter : undefined,
          page: targetPage,
          limit: 15,
        });
        if (res.success) {
          setInquiries(res.inquiries || []);
          setTotalPages(res.totalPages || 1);
          setTotalInquiries(res.total ?? (res.inquiries?.length || 0));
        }
      } catch (err: any) {
        error(err.message || 'Failed to fetch party and banquet inquiries.');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, eventTypeFilter, searchQuery, page]
  );

  useEffect(() => {
    setPage(1);
    fetchPartyInquiries(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, eventTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchPartyInquiries(1);
  };

  const handleOpenManage = (inquiry: PartyInquiry) => {
    setSelectedInquiry(inquiry);
    setStaffNotes(inquiry.staffNotes || '');
    setFollowUpDate(inquiry.followUpDate || '');
  };

  const handleUpdateStatus = async (status?: PartyInquiry['status']) => {
    if (!selectedInquiry) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updatePartyStatus(
        selectedInquiry.id,
        status || selectedInquiry.status,
        staffNotes,
        followUpDate
      );
      if (res.success) {
        success(res.message);
        setInquiries((prev) => prev.map((item) => (item.id === res.inquiry.id ? res.inquiry : item)));
        setSelectedInquiry(res.inquiry);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update party inquiry status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInquiry.customerName.trim() || !newInquiry.phone.trim() || !newInquiry.preferredDate) {
      error('Customer name, phone, and preferred date are required.');
      return;
    }
    try {
      setIsCreating(true);
      const res = await adminApi.createPartyInquiry({
        customerName: newInquiry.customerName.trim(),
        phone: newInquiry.phone.trim(),
        email: newInquiry.email.trim() || undefined,
        eventType: newInquiry.eventType,
        preferredDate: newInquiry.preferredDate,
        guestCount: Number(newInquiry.guestCount) || 10,
        budgetRange: newInquiry.budgetRange.trim() || undefined,
        specialRequirements: newInquiry.specialRequirements.trim() || undefined,
      });
      if (res.success) {
        success('Party inquiry logged successfully!');
        setIsNewModalOpen(false);
        setNewInquiry(INITIAL_NEW_INQUIRY);
        setPage(1);
        fetchPartyInquiries(1);
      }
    } catch (err: any) {
      error(err.message || 'Failed to create party inquiry.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingInquiry) return;
    try {
      setIsDeleting(true);
      const res = await adminApi.deletePartyInquiry(deletingInquiry.id);
      if (res.success) {
        success(res.message || 'Party inquiry deleted successfully.');
        setInquiries((prev) => prev.filter((item) => item.id !== deletingInquiry.id));
        setTotalInquiries((prev) => Math.max(0, prev - 1));
        setDeletingInquiry(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete party inquiry.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Party, Banquet & Corporate Event Inquiries"
        subtitle="Manage large gatherings, birthday bashes, family feasts, custom catering quotes and follow-ups"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex items-center text-xs text-beige bg-charcoal-card border border-charcoal-border px-3.5 py-2 rounded-xl">
              <span>
                Total Inquiries: <strong className="text-gold font-bold">{totalInquiries}</strong>
              </span>
            </div>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Party Inquiry</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
        <form onSubmit={handleSearchSubmit} className="relative md:col-span-2">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patron name, phone, email, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </form>

        <select
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
        >
          <option value="all">All Event Types</option>
          {EVENT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
        >
          <option value="all">All Inquiry Statuses</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <LoadingState message="Loading event inquiry files..." />
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No Banquet Inquiries"
          description="No inquiries match your selected filters. Try resetting filters or log a new inquiry."
          action={
            searchQuery || statusFilter !== 'all' || eventTypeFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setEventTypeFilter('all');
                }}
                className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset All Filters
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
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">Date &amp; Guests</th>
                  <th className="py-3.5 px-4 font-semibold">Budget</th>
                  <th className="py-3.5 px-4 font-semibold">Requirements</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {inquiries.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite text-sm">{inquiry.customerName}</div>
                      <div className="text-[10px] text-beige-muted font-mono flex items-center space-x-1">
                        <Phone className="w-2.5 h-2.5 text-gold" />
                        <span>{inquiry.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="capitalize px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border text-gold font-semibold text-[11px]">
                        {inquiry.eventType.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-warmwhite flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gold" />
                        <span>{inquiry.preferredDate}</span>
                      </div>
                      <div className="text-[10px] text-beige flex items-center space-x-1 mt-0.5">
                        <Users className="w-3 h-3 text-gold" />
                        <span>{inquiry.guestCount} Guests</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-serif font-bold text-warmwhite whitespace-nowrap">
                      {inquiry.budgetRange || 'Flexible'}
                    </td>

                    <td className="py-3.5 px-4 text-beige max-w-[200px] truncate" title={inquiry.specialRequirements || ''}>
                      {inquiry.specialRequirements || <span className="text-beige-muted italic">Standard buffet</span>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={inquiry.status} type="booking" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenManage(inquiry)}
                          className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Manage</span>
                        </button>
                        <button
                          onClick={() => setDeletingInquiry(inquiry)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
                Page <strong className="text-warmwhite">{page}</strong> of <strong className="text-warmwhite">{totalPages}</strong> ({totalInquiries} total inquiries)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchPartyInquiries(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold transition-colors cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => {
                    const p = page + 1;
                    setPage(p);
                    fetchPartyInquiries(p);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-charcoal-border bg-charcoal disabled:opacity-40 text-warmwhite hover:border-gold transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedInquiry(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-charcoal-border pb-4">
              <div className="inline-flex items-center space-x-1.5 text-gold text-[10px] font-semibold uppercase tracking-wider mb-1">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>Event Inquiry #{selectedInquiry.id}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {selectedInquiry.customerName}
              </h2>
              <div className="flex items-center space-x-3 text-beige mt-1">
                <span>{selectedInquiry.phone}</span>
                <span>• {selectedInquiry.guestCount} Guests</span>
                <span className="capitalize">• {selectedInquiry.eventType.replace('_', ' ')}</span>
              </div>
            </div>

            {/* Event Specs */}
            <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border space-y-2">
              <div className="flex justify-between text-warmwhite">
                <span>Preferred Date:</span>
                <span className="font-bold text-gold">{selectedInquiry.preferredDate}</span>
              </div>
              <div className="flex justify-between text-warmwhite">
                <span>Budget Allocation:</span>
                <span className="font-bold text-gold">{selectedInquiry.budgetRange || 'Flexible'}</span>
              </div>
              <div>
                <span className="text-beige-muted block">Special Event &amp; Catering Requirements:</span>
                <p className="text-warmwhite italic mt-0.5">
                  "{selectedInquiry.specialRequirements || 'Standard party menu and beverage service.'}"
                </p>
              </div>
            </div>

            {/* Quick WhatsApp Action */}
            <a
              href={buildWhatsAppLink(selectedInquiry)}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-green-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Chat with Host on WhatsApp</span>
            </a>

            {/* Follow-up date & Staff Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Follow-Up Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Current Status</label>
                <div className="pt-2">
                  <StatusBadge status={selectedInquiry.status} type="booking" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-beige mb-1 font-medium">Coordinator Internal Follow-Up Log</label>
              <textarea
                rows={2}
                placeholder="e.g. Sent buffet rate card, waiting for guest count confirmation"
                value={staffNotes}
                onChange={(e) => setStaffNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
              />
            </div>

            {/* Status Actions */}
            <div className="space-y-2 pt-2 border-t border-charcoal-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gold">
                  Advance Inquiry Status
                </span>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus()}
                  className="text-[11px] text-gold hover:underline font-semibold cursor-pointer"
                >
                  Save Notes Only
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('contacted')}
                  className="py-2 px-2.5 rounded-xl bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/50 text-sky-300 font-semibold text-center cursor-pointer"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('quoted')}
                  className="py-2 px-2.5 rounded-xl bg-indigo-950/60 border border-indigo-600/40 hover:bg-indigo-900/50 text-indigo-300 font-semibold text-center cursor-pointer"
                >
                  Mark Quote Sent
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('confirmed')}
                  className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center cursor-pointer"
                >
                  Confirm Banquet
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('cancelled')}
                  className="py-2 px-2.5 rounded-xl bg-charcoal border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 font-semibold text-center cursor-pointer"
                >
                  Cancel Inquiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Party Inquiry Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsNewModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsNewModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-charcoal-border pb-3">
              <div className="inline-flex items-center space-x-1.5 text-gold text-[10px] font-semibold uppercase tracking-wider mb-1">
                <PartyPopper className="w-3.5 h-3.5" />
                <span>Banquet Desk</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">New Party / Event Inquiry</h2>
              <p className="text-xs text-beige mt-0.5">
                Log a phone or walk-in banquet inquiry directly into MongoDB Atlas.
              </p>
            </div>

            <form onSubmit={handleCreateInquiry} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={newInquiry.customerName}
                    onChange={(e) => setNewInquiry({ ...newInquiry, customerName: e.target.value })}
                    placeholder="e.g. Rajesh Verma"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newInquiry.phone}
                    onChange={(e) => setNewInquiry({ ...newInquiry, phone: e.target.value })}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Event Type *</label>
                  <select
                    value={newInquiry.eventType}
                    onChange={(e) =>
                      setNewInquiry({ ...newInquiry, eventType: e.target.value as PartyInquiry['eventType'] })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  >
                    {EVENT_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={newInquiry.preferredDate}
                    onChange={(e) => setNewInquiry({ ...newInquiry, preferredDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Estimated Guest Count *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newInquiry.guestCount}
                    onChange={(e) => setNewInquiry({ ...newInquiry, guestCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Budget Range (Optional)</label>
                  <input
                    type="text"
                    value={newInquiry.budgetRange}
                    onChange={(e) => setNewInquiry({ ...newInquiry, budgetRange: e.target.value })}
                    placeholder="e.g. ₹25,000 - ₹40,000"
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Special Requirements</label>
                <textarea
                  rows={2}
                  value={newInquiry.specialRequirements}
                  onChange={(e) => setNewInquiry({ ...newInquiry, specialRequirements: e.target.value })}
                  placeholder="Custom Jain buffet, stage decor, DJ, cake..."
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Log Party Inquiry</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingInquiry)}
        title="Delete Party Inquiry"
        message={`Are you sure you want to permanently remove the banquet inquiry from "${deletingInquiry?.customerName}"? This action is logged in the security audit trail.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingInquiry(null)}
      />
    </div>
  );
};
