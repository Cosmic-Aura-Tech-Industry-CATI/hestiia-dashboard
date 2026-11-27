'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Clock,
  Users,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Edit2,
  X,
  Send,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  RefreshCw,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { TableBooking } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../components/common/ToastContext';

export const TableBookings: React.FC = () => {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState(''); // YYYY-MM-DD or empty for all
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  // Manage Drawer Modal State
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [allocatedTableInput, setAllocatedTableInput] = useState('');
  const [confirmationMethod, setConfirmationMethod] = useState<'on-screen' | 'whatsapp' | 'call'>('whatsapp');

  // New Table Reservation Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newBookingData, setNewBookingData] = useState({
    customerName: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    time: '08:00 PM',
    guests: '2 Guests',
    occasion: 'Dining',
    specialRequests: '',
  });

  // Delete Dialog State
  const [isDeleting, setIsDeleting] = useState<TableBooking | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const { success, error } = useToast();

  // Helper date strings
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const fetchBookings = async (targetPage = page) => {
    try {
      setIsLoading(true);
      const res = await adminApi.getBookings({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        date: dateFilter || undefined,
        page: targetPage,
        limit: 15,
      });
      if (res.success) {
        setBookings(res.bookings);
        setTotalPages(res.totalPages || 1);
        setTotalBookings(res.total ?? res.bookings.length);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch table reservation inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchBookings(1);
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchBookings(1);
  };

  const handleOpenManage = (booking: TableBooking) => {
    setSelectedBooking(booking);
    setStaffNoteInput(booking.staffNotes || '');
    setAllocatedTableInput(booking.allocatedTable || '');
    setConfirmationMethod(booking.confirmationMethod || 'whatsapp');
  };

  const handleUpdateBookingStatus = async (status: string) => {
    if (!selectedBooking) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updateBookingStatus(selectedBooking.id, {
        status,
        staffNotes: staffNoteInput,
        allocatedTable: allocatedTableInput || undefined,
        confirmationMethod,
      });
      if (res.success) {
        success(res.message);
        setBookings((prev) => prev.map((b) => (b.id === res.booking.id ? res.booking : b)));
        setSelectedBooking(res.booking);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update reservation status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookingData.customerName.trim() || !newBookingData.phone.trim()) {
      error('Please provide guest name and mobile phone number.');
      return;
    }
    try {
      setIsCreating(true);
      const res = await adminApi.createBooking({
        customerName: newBookingData.customerName.trim(),
        phone: newBookingData.phone.trim(),
        email: newBookingData.email.trim() || undefined,
        date: newBookingData.date,
        time: newBookingData.time,
        guests: newBookingData.guests,
        occasion: newBookingData.occasion,
        specialRequests: newBookingData.specialRequests.trim() || undefined,
      });
      if (res.success) {
        success(`Table reservation #${res.bookingRef} created successfully!`);
        setIsNewModalOpen(false);
        setNewBookingData({
          customerName: '',
          phone: '',
          email: '',
          date: new Date().toISOString().split('T')[0],
          time: '08:00 PM',
          guests: '2 Guests',
          occasion: 'Dining',
          specialRequests: '',
        });
        setPage(1);
        fetchBookings(1);
      }
    } catch (err: any) {
      error(err.message || 'Failed to create reservation.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!isDeleting) return;
    try {
      setIsDeleteSubmitting(true);
      const res = await adminApi.deleteBooking(isDeleting.id);
      if (res.success) {
        success(res.message || `Booking #${isDeleting.bookingRef || isDeleting.id} was removed.`);
        setBookings((prev) => prev.filter((b) => b.id !== isDeleting.id));
        setTotalBookings((prev) => Math.max(0, prev - 1));
        setIsDeleting(null);
      }
    } catch (err: any) {
      error(err.message || 'Failed to delete booking.');
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Table Reservation Inquiries"
        subtitle="Manage guest dining reservations, seating allocations, anniversary celebrations and shift bookings"
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-beige bg-charcoal-card border border-charcoal-border px-3.5 py-2 rounded-xl">
              <span>Total Bookings: <strong className="text-gold font-bold">{totalBookings}</strong></span>
            </div>

            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Table Reservation</span>
            </button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative md:col-span-2">
            <Search className="w-4 h-4 text-beige-muted absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search patron name, phone, booking ref, table or staff notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
            />
          </form>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
          >
            <option value="all">All Inquiry Statuses</option>
            <option value="new">New Inquiries (Review Required)</option>
            <option value="contacted">Customer Contacted</option>
            <option value="confirmed">Table Confirmed & Locked</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Visit Completed</option>
            <option value="rejected">Declined</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Quick Shift Date Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-charcoal-border/70 text-xs">
          <span className="text-beige-muted text-[11px] font-medium mr-1">Shift Date:</span>

          <button
            type="button"
            onClick={() => setDateFilter('')}
            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              !dateFilter
                ? 'bg-gold text-charcoal-950 border-gold shadow-sm'
                : 'bg-charcoal text-beige border-charcoal-border hover:border-gold/50'
            }`}
          >
            All Dates
          </button>

          <button
            type="button"
            onClick={() => setDateFilter(todayStr)}
            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              dateFilter === todayStr
                ? 'bg-gold text-charcoal-950 border-gold shadow-sm'
                : 'bg-charcoal text-beige border-charcoal-border hover:border-gold/50'
            }`}
          >
            Today's Shift
          </button>

          <button
            type="button"
            onClick={() => setDateFilter(tomorrowStr)}
            className={`px-3 py-1 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              dateFilter === tomorrowStr
                ? 'bg-gold text-charcoal-950 border-gold shadow-sm'
                : 'bg-charcoal text-beige border-charcoal-border hover:border-gold/50'
            }`}
          >
            Tomorrow
          </button>

          {/* Date Picker Input */}
          <div className="flex items-center space-x-1.5 ml-auto">
            <span className="text-beige-muted text-[11px]">Pick Calendar:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-1 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                className="text-beige-muted hover:text-warmwhite p-1 text-[11px]"
                title="Clear date filter"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching dining table inquiries..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Table Inquiries Found"
          description={
            dateFilter || searchQuery || statusFilter !== 'all'
              ? 'No reservations match your current filters. Try resetting the filters.'
              : 'Inquiries submitted via the public table booking modal will be queued here for host review.'
          }
          action={
            dateFilter || searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setDateFilter('');
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold rounded-xl cursor-pointer"
              >
                Reset All Filters
              </button>
            ) : (
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Record Walk-In Booking
              </button>
            )
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Guest & Booking Ref</th>
                  <th className="py-3.5 px-4 font-semibold">Reserved Slot</th>
                  <th className="py-3.5 px-4 font-semibold">Party Size & Occasion</th>
                  <th className="py-3.5 px-4 font-semibold">Special Requests</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/60">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-charcoal/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite text-sm">{booking.customerName}</div>
                      <div className="text-[10px] text-beige-muted flex items-center space-x-1.5 font-mono mt-0.5">
                        <Phone className="w-2.5 h-2.5 text-gold" />
                        <span>{booking.phone}</span>
                        {booking.bookingRef && (
                          <span className="text-[9px] bg-charcoal border border-gold/30 text-gold px-1.5 py-0.5 rounded font-mono font-medium">
                            #{booking.bookingRef}
                          </span>
                        )}
                      </div>
                      {booking.allocatedTable && (
                        <div className="mt-1 text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                          <span>🪑</span>
                          <span>{booking.allocatedTable}</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-warmwhite flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gold" />
                        <span>{booking.date}</span>
                        {booking.date === todayStr && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[9px] font-bold">
                            Today
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-beige flex items-center space-x-1 mt-0.5">
                        <Clock className="w-3 h-3 text-gold" />
                        <span>{booking.time}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-warmwhite flex items-center space-x-1">
                        <Users className="w-3 h-3 text-gold" />
                        <span>{booking.guests}</span>
                      </div>
                      <div className="text-[10px] text-beige-muted">{booking.occasion}</div>
                    </td>

                    <td className="py-3.5 px-4 text-beige max-w-[200px] truncate" title={booking.specialRequests || 'None'}>
                      {booking.specialRequests || <span className="text-beige-muted italic">Standard dining table</span>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} type="booking" />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenManage(booking)}
                          className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Allocate / Update</span>
                        </button>
                        <button
                          onClick={() => setIsDeleting(booking)}
                          className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-rose-500 text-beige hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Reservation"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-charcoal-border flex items-center justify-between text-xs text-beige">
              <div>
                Page <strong className="text-warmwhite">{page}</strong> of <strong className="text-warmwhite">{totalPages}</strong> ({totalBookings} total inquiries)
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => {
                    const p = page - 1;
                    setPage(p);
                    fetchBookings(p);
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
                    fetchBookings(p);
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

      {/* Booking Management Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-charcoal-border pb-4">
              <div className="inline-flex items-center space-x-1.5 text-gold text-[10px] font-semibold uppercase tracking-wider mb-1">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Inquiry #{selectedBooking.bookingRef || selectedBooking.id}</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                {selectedBooking.customerName}
              </h2>
              <div className="flex items-center space-x-3 text-beige mt-1">
                <span>{selectedBooking.phone}</span>
                <span>• {selectedBooking.guests}</span>
                <span>• {selectedBooking.occasion}</span>
              </div>
            </div>

            {/* Timing & Special Requests */}
            <div className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border space-y-2">
              <div className="flex justify-between text-warmwhite">
                <span>Requested Slot:</span>
                <span className="font-bold text-gold">{selectedBooking.date} at {selectedBooking.time}</span>
              </div>
              <div>
                <span className="text-beige-muted block">Guest Notes & Special Requests:</span>
                <p className="text-warmwhite italic mt-0.5">
                  "{selectedBooking.specialRequests || 'No special dietary requests stated.'}"
                </p>
              </div>
            </div>

            {/* Seating & Table Allocation Selection */}
            <div>
              <label className="block text-beige mb-1 font-medium">Assigned Table / Seating Area</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Leather Booth B3, Table T7"
                  value={allocatedTableInput}
                  onChange={(e) => setAllocatedTableInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) setAllocatedTableInput(e.target.value);
                  }}
                  className="px-2 py-2 rounded-xl bg-charcoal border border-charcoal-border text-gold text-xs focus:outline-none cursor-pointer"
                  value=""
                >
                  <option value="" disabled>Quick Select Table</option>
                  <option value="Leather Booth B1 (4 Seats)">Leather Booth B1 (4 Seats)</option>
                  <option value="Leather Booth B2 (4 Seats)">Leather Booth B2 (4 Seats)</option>
                  <option value="Leather Booth B3 (6 Seats)">Leather Booth B3 (6 Seats)</option>
                  <option value="Dining Hall Table T1 (2 Seats)">Dining Hall Table T1 (2 Seats)</option>
                  <option value="Dining Hall Table T4 (4 Seats)">Dining Hall Table T4 (4 Seats)</option>
                  <option value="Dining Hall Table T8 (6 Seats)">Dining Hall Table T8 (6 Seats)</option>
                  <option value="Private Dining Enclave P1">Private Dining Enclave P1</option>
                  <option value="Banquet & Celebration Area">Banquet & Celebration Area</option>
                </select>
              </div>
            </div>

            {/* Confirmation Method */}
            <div>
              <label className="block text-beige mb-1 font-medium">Confirmation Channel</label>
              <select
                value={confirmationMethod}
                onChange={(e) => setConfirmationMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
              >
                <option value="whatsapp">WhatsApp Direct Confirmation</option>
                <option value="call">Phone Call Verified</option>
                <option value="on-screen">Direct On-Screen Confirmation</option>
              </select>
            </div>

            {/* Quick WhatsApp Action (Context-Aware) */}
            <div>
              <a
                href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  selectedBooking.status === 'confirmed'
                    ? `Namaste ${selectedBooking.customerName}! 🍽️✨ Your table reservation at Hestiia Restaurant is CONFIRMED!\n\n📋 Booking Ref: #${selectedBooking.bookingRef || selectedBooking.id}\n📅 Date: ${selectedBooking.date} | ${selectedBooking.time}\n👥 Guests: ${selectedBooking.guests}\n🪑 Seating: ${allocatedTableInput || selectedBooking.allocatedTable || 'Table Reserved'}\n📍 Venue: 1-B, Ram Puram, Shyam Nagar, Kanpur\n⏱️ Table Hold Policy: 15 minutes beyond reservation time.\n\nWe look forward to hosting you for an unforgettable dining experience! 🙏`
                    : `Namaste ${selectedBooking.customerName}! 🍽️ This is the Front Desk at Hestiia Restaurant, Shyam Nagar. Regarding your table reservation inquiry for ${selectedBooking.guests} on ${selectedBooking.date} at ${selectedBooking.time}: We would love to welcome you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-green-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {selectedBooking.status === 'confirmed' ? 'Send Official Confirmation on WhatsApp' : 'Chat with Guest on WhatsApp'}
                </span>
              </a>
            </div>

            {/* Staff Internal Notes */}
            <div>
              <label className="block text-beige mb-1 font-medium">Internal Host Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. VIP guest, anniversary cake ordered, high chair required"
                value={staffNoteInput}
                onChange={(e) => setStaffNoteInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none resize-none"
              />
            </div>

            {/* Status Transition Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-charcoal-border">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-gold mb-1">
                Update Reservation Status
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('contacted')}
                  className="py-2 px-3 rounded-xl bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/50 text-sky-300 font-semibold cursor-pointer"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('confirmed')}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Confirm Table Booking
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('completed')}
                  className="py-2 px-3 rounded-xl bg-teal-950/60 border border-teal-600/40 hover:bg-teal-900/50 text-teal-300 font-semibold cursor-pointer"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('rejected')}
                  className="py-2 px-3 rounded-xl bg-charcoal border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 font-semibold cursor-pointer"
                >
                  Decline Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Walk-In / Phone Table Reservation Modal */}
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
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Hostess Reception Desk</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-warmwhite">
                New Table Reservation
              </h2>
              <p className="text-xs text-beige mt-0.5">
                Record a direct phone call or walk-in guest table reservation into the system.
              </p>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Guest Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swatantra Singh"
                    value={newBookingData.customerName}
                    onChange={(e) => setNewBookingData({ ...newBookingData, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Mobile Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={newBookingData.phone}
                    onChange={(e) => setNewBookingData({ ...newBookingData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Reservation Date *</label>
                  <input
                    type="date"
                    required
                    value={newBookingData.date}
                    onChange={(e) => setNewBookingData({ ...newBookingData, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Time Slot *</label>
                  <select
                    value={newBookingData.time}
                    onChange={(e) => setNewBookingData({ ...newBookingData, time: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="12:30 PM">12:30 PM (Lunch)</option>
                    <option value="01:00 PM">01:00 PM (Lunch)</option>
                    <option value="01:30 PM">01:30 PM (Lunch)</option>
                    <option value="02:00 PM">02:00 PM (Lunch)</option>
                    <option value="07:00 PM">07:00 PM (Dinner)</option>
                    <option value="07:30 PM">07:30 PM (Dinner)</option>
                    <option value="08:00 PM">08:00 PM (Dinner Peak)</option>
                    <option value="08:30 PM">08:30 PM (Dinner Peak)</option>
                    <option value="09:00 PM">09:00 PM (Dinner)</option>
                    <option value="09:30 PM">09:30 PM (Dinner)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Party Size *</label>
                  <select
                    value={newBookingData.guests}
                    onChange={(e) => setNewBookingData({ ...newBookingData, guests: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="2 Guests">2 Guests (Couple / Pair)</option>
                    <option value="4 Guests">4 Guests (Standard Family)</option>
                    <option value="6 Guests">6 Guests (Large Table)</option>
                    <option value="8 Guests">8 Guests (Celebration Table)</option>
                    <option value="10+ Guests">10+ Guests (Private Dining)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-beige mb-1 font-medium">Occasion</label>
                  <select
                    value={newBookingData.occasion}
                    onChange={(e) => setNewBookingData({ ...newBookingData, occasion: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
                  >
                    <option value="Dining">Regular Fine Dining</option>
                    <option value="Anniversary">Anniversary Celebration</option>
                    <option value="Birthday">Birthday Celebration</option>
                    <option value="Business Meeting">Business Dining</option>
                    <option value="Family Gathering">Family Gathering</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Special Requests / Seating Preference</label>
                <input
                  type="text"
                  placeholder="e.g. Quiet corner booth, anniversary cake, baby chair"
                  value={newBookingData.specialRequests}
                  onChange={(e) => setNewBookingData({ ...newBookingData, specialRequests: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
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
                  className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isCreating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Creating Booking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Confirm & Lock Table</span>
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
        isOpen={Boolean(isDeleting)}
        title="Remove Table Reservation"
        message={`Are you sure you want to permanently delete the table reservation for "${isDeleting?.customerName}" (Ref #${isDeleting?.bookingRef || isDeleting?.id})? This action will be recorded in the security audit logs.`}
        confirmLabel="Confirm Delete"
        isDestructive={true}
        isLoading={isDeleteSubmitting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setIsDeleting(null)}
      />
    </div>
  );
};
