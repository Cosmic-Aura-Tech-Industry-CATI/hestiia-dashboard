import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { TableBooking } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

export const TableBookings: React.FC = () => {
  const [bookings, setBookings] = useState<TableBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<TableBooking | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [staffNoteInput, setStaffNoteInput] = useState('');
  const [allocatedTableInput, setAllocatedTableInput] = useState('');

  const { success, error } = useToast();

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getBookings({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err: any) {
      error(err.message || 'Failed to fetch table reservation inquiries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleOpenManage = (booking: TableBooking) => {
    setSelectedBooking(booking);
    setStaffNoteInput(booking.staffNotes || '');
    setAllocatedTableInput(booking.allocatedTable || '');
  };

  const handleUpdateBookingStatus = async (status: string) => {
    if (!selectedBooking) return;
    try {
      setIsUpdating(true);
      const res = await adminApi.updateBookingStatus(selectedBooking.id, {
        status,
        staffNotes: staffNoteInput,
        allocatedTable: allocatedTableInput || undefined,
        confirmationMethod: status === 'confirmed' ? 'whatsapp' : undefined,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Table Reservation Inquiries"
        subtitle="Manage guest dining reservations, seating allocations, anniversary celebrations and special dietary requests"
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
            <option value="new">New Inquiries</option>
            <option value="contacted">Customer Contacted</option>
            <option value="confirmed">Table Confirmed</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Visit Completed</option>
            <option value="rejected">Declined</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Fetching dining table inquiries..." />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No Table Inquiries"
          description="Inquiries submitted via the public table booking modal will be queued here for host review."
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Guest</th>
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
                      {booking.specialRequests || <span className="text-beige-muted italic">Standard table</span>}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={booking.status} type="booking" />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenManage(booking)}
                        className="px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Allocate / Update</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Management Drawer / Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-w-lg bg-charcoal-card border border-gold/40 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 animate-scaleUp text-xs space-y-4">
            <button
              onClick={() => setSelectedBooking(null)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite transition-colors"
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
                  placeholder="e.g. Booth B3, Table T7"
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
                  <option value="" disabled>Quick Select</option>
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

            {/* Quick WhatsApp Action (Context-Aware) */}
            <div>
              <a
                href={`https://wa.me/${selectedBooking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                  selectedBooking.status === 'confirmed'
                    ? `Namaste ${selectedBooking.customerName}! 🍽️✨ Your table reservation at Hestiia Restaurant is CONFIRMED!\n\n📋 Booking Ref: #${selectedBooking.bookingRef || selectedBooking.id}\n📅 Date: ${selectedBooking.date} | ${selectedBooking.time}\n👥 Guests: ${selectedBooking.guests}\n🪑 Seating: ${allocatedTableInput || selectedBooking.allocatedTable || 'Table Reserved'}\n📍 Venue: 1-B, Ram Puram, Shyam Nagar, Kanpur\n⏱️ Table Hold Policy: 15 minutes beyond reservation time.\n\nWe look forward to hosting you for an unforgettable dining experience! 🙏`
                    : `Namaste ${selectedBooking.customerName}! 🍽️ This is the Front Desk at Hestiia Restaurant, Shyam Nagar. Regarding your table inquiry for ${selectedBooking.guests} on ${selectedBooking.date} at ${selectedBooking.time}: We would love to welcome you!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 px-3 rounded-xl bg-forest hover:bg-green-600 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md"
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
                  className="py-2 px-3 rounded-xl bg-sky-950/60 border border-sky-600/40 hover:bg-sky-900/50 text-sky-300 font-semibold"
                >
                  Mark Contacted
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('confirmed')}
                  className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Confirm Table Booking
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('completed')}
                  className="py-2 px-3 rounded-xl bg-teal-950/60 border border-teal-600/40 hover:bg-teal-900/50 text-teal-300 font-semibold"
                >
                  Mark Completed
                </button>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => handleUpdateBookingStatus('rejected')}
                  className="py-2 px-3 rounded-xl bg-charcoal border border-rose-600/40 text-rose-400 hover:bg-rose-950/40 font-semibold"
                >
                  Decline Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
