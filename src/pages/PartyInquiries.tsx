import React, { useState, useEffect } from 'react';
import {
  PartyPopper,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Edit2,
  X,
  Send,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { PartyInquiry } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const PartyInquiries: React.FC = () => {
  const [inquiries, setInquiries] = useState<PartyInquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState<PartyInquiry | null>(null);
  const [staffNotes, setStaffNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const { success, error } = useToast();

  const fetchPartyInquiries = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getPartyInquiries({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (res.success) {
        setInquiries(res.inquiries);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch party and banquet inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartyInquiries();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPartyInquiries();
  };

  const handleOpenManage = (p: PartyInquiry) => {
    setSelectedInquiry(p);
    setStaffNotes(p.staffNotes || '');
    setFollowUpDate(p.followUpDate || '');
  };

  const handleUpdateStatus = async (status: string) => {
    if (!selectedInquiry) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updatePartyStatus(selectedInquiry.id, status, staffNotes, followUpDate);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Party, Banquet & Corporate Event Inquiries"
        subtitle="Manage large gatherings, birthday bashes, family feasts, custom catering menus and follow-ups"
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search patron name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none w-full sm:w-auto"
          >
            <option value="all">All Inquiry Statuses</option>
            <option value="new">New Requests</option>
            <option value="contacted">Under Discussion (Contacted)</option>
            <option value="confirmed">Banquet Confirmed</option>
            <option value="rejected">Declined</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Loading event inquiry files..." />
      ) : inquiries.length === 0 ? (
        <EmptyState
          title="No Banquet Inquiries"
          description="Inquiries for large gatherings, anniversaries, and corporate dinners will appear here."
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Customer</th>
                  <th className="py-3.5 px-4 font-semibold">Event Type</th>
                  <th className="py-3.5 px-4 font-semibold">Date & Guests</th>
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

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenManage(inquiry)}
                        className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Manage Inquiry</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail Drawer / Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedInquiry(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setSelectedInquiry(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
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
                <span className="text-beige-muted block">Special Event & Catering Requirements:</span>
                <p className="text-warmwhite italic mt-0.5">
                  "{selectedInquiry.specialRequirements || 'Standard party menu and beverage service.'}"
                </p>
              </div>
            </div>

            {/* Quick WhatsApp Action */}
            <div>
              <a
                href={`https://wa.me/${selectedInquiry.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Namaste ${selectedInquiry.customerName}! 🎉 This is the Banquet Coordinator at Hestiia Restaurant, Shyam Nagar. Regarding your party inquiry for ${selectedInquiry.guestCount} guests on ${selectedInquiry.preferredDate}: We have exciting curated culinary packages ready for you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-green-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Chat with Host on WhatsApp</span>
              </a>
            </div>

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
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-gold mb-1">
                Advance Inquiry Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('contacted')}
                  className="py-2 px-2.5 rounded-xl bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/50 text-sky-300 font-semibold text-center"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('confirmed')}
                  className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-center"
                >
                  Confirm Event
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateStatus('rejected')}
                  className="py-2 px-2.5 rounded-xl bg-charcoal border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 font-semibold text-center"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
