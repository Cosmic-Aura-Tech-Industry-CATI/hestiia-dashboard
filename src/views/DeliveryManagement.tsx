'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Truck,
  Search,
  RefreshCw,
  Plus,
  Edit2,
  X,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  ShieldCheck,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import {
  AdminUser,
  DeliveryAssignment,
  DeliveryTrackingStatus,
  DeliveryZone,
} from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

type DeliveryTab = 'dispatches' | 'zones';

function getTrackingBadge(status: DeliveryTrackingStatus) {
  if (status === 'delivered') return 'bg-emerald-950/60 text-emerald-300 border-emerald-600/40';
  if (status === 'on_the_way' || status === 'picked_up') return 'bg-sky-950/60 text-sky-300 border-sky-500/40';
  if (status === 'assigned') return 'bg-amber-950/60 text-amber-300 border-amber-500/40';
  if (status === 'failed' || status === 'cancelled') return 'bg-rose-950/60 text-rose-300 border-rose-500/40';
  return 'bg-zinc-800/80 text-zinc-400 border-zinc-700';
}

export const DeliveryManagement: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<DeliveryTab>('dispatches');

  // Dispatches State
  const [deliveries, setDeliveries] = useState<DeliveryAssignment[]>([]);
  const [countsByStatus, setCountsByStatus] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | DeliveryTrackingStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Assign Rider Modal
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignForm, setAssignForm] = useState({
    orderNumber: '',
    riderName: '',
    riderPhone: '',
    vehicleNumber: '',
    estimatedMinutes: 35,
    deliveryNotes: '',
  });
  const [isAssigning, setIsAssigning] = useState(false);

  // Verify OTP Modal
  const [otpModalTarget, setOtpModalTarget] = useState<DeliveryAssignment | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Zones State
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [isLoadingZones, setIsLoadingZones] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [pincodesInput, setPincodesInput] = useState('');
  const [isSavingZones, setIsSavingZones] = useState(false);

  const fetchDeliveries = useCallback(
    async (silent = false, targetPage = page) => {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminApi.getDeliveries({
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery.trim() || undefined,
          page: targetPage,
          limit: 20,
        });
        if (res.success) {
          setDeliveries(res.deliveries || []);
          setCountsByStatus(res.countsByStatus || {});
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? res.deliveries?.length ?? 0);
        }
      } catch (err: any) {
        error(err.message || 'Failed to load delivery dispatches.');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusFilter, searchQuery, page]
  );

  const fetchZones = useCallback(async () => {
    try {
      setIsLoadingZones(true);
      const res = await adminApi.getDeliveryZones();
      if (res.success) {
        setZones(res.zones || []);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load delivery zones.');
    } finally {
      setIsLoadingZones(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    fetchDeliveries(false, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDeliveries(false, 1);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
    adminApi
      .getDeliveries({ page: 1, limit: 20 })
      .then((res) => {
        if (res.success) {
          setDeliveries(res.deliveries || []);
          setCountsByStatus(res.countsByStatus || {});
          setTotalPages(res.pagination?.totalPages || 1);
          setTotal(res.pagination?.total ?? 0);
        }
      })
      .catch(() => {});
  };

  const handleOpenAssign = (existing?: DeliveryAssignment) => {
    setAssignForm({
      orderNumber: existing?.orderNumber || '',
      riderName: existing?.riderName || '',
      riderPhone: existing?.riderPhone || '',
      vehicleNumber: existing?.vehicleNumber || '',
      estimatedMinutes: 35,
      deliveryNotes: existing?.deliveryNotes || '',
    });
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.orderNumber.trim() || !assignForm.riderName.trim() || !assignForm.riderPhone.trim()) {
      error('Order number, rider name, and rider phone are required.');
      return;
    }

    try {
      setIsAssigning(true);
      const res = await adminApi.assignDeliveryRider(assignForm.orderNumber.trim(), {
        riderName: assignForm.riderName.trim(),
        riderPhone: assignForm.riderPhone.trim(),
        vehicleNumber: assignForm.vehicleNumber.trim() || undefined,
        estimatedMinutes: Number(assignForm.estimatedMinutes) || 35,
        deliveryNotes: assignForm.deliveryNotes.trim() || undefined,
      });
      if (res.success) {
        success(res.message || `Rider assigned to ${assignForm.orderNumber}.`);
        setIsAssignOpen(false);
        fetchDeliveries(true, page);
      }
    } catch (err: any) {
      error(err.message || 'Failed to assign delivery rider.');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusChange = async (orderNumber: string, status: DeliveryTrackingStatus) => {
    try {
      setUpdatingOrder(orderNumber);
      const res = await adminApi.updateDeliveryStatus(orderNumber, { status });
      if (res.success) {
        success(res.message || `Tracking updated to ${status}.`);
        fetchDeliveries(true, page);
      }
    } catch (err: any) {
      error(err.message || 'Failed to update tracking status.');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpModalTarget || !otpInput.trim()) return;
    try {
      setIsVerifyingOtp(true);
      const res = await adminApi.verifyDeliveryOtp(otpModalTarget.orderNumber, otpInput.trim());
      if (res.success) {
        success(res.message || 'Delivery confirmed via OTP.');
        setOtpModalTarget(null);
        setOtpInput('');
        fetchDeliveries(true, page);
      }
    } catch (err: any) {
      error(err.message || 'Invalid OTP or verification failed.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Zone handlers
  const handleOpenCreateZone = () => {
    setEditingZone({
      id: 'zone_' + Date.now(),
      name: '',
      pincodes: [],
      minOrderValue: 299,
      deliveryFee: 40,
      estimatedMinutes: 35,
      isActive: true,
    });
    setPincodesInput('');
    setIsZoneModalOpen(true);
  };

  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone({ ...zone });
    setPincodesInput(zone.pincodes.join(', '));
    setIsZoneModalOpen(true);
  };

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingZone || !editingZone.name.trim()) {
      error('Zone name is required.');
      return;
    }

    const parsedPincodes = pincodesInput
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const updatedZone: DeliveryZone = {
      ...editingZone,
      name: editingZone.name.trim(),
      pincodes: parsedPincodes,
      minOrderValue: Number(editingZone.minOrderValue) || 0,
      deliveryFee: Number(editingZone.deliveryFee) || 0,
      estimatedMinutes: Number(editingZone.estimatedMinutes) || 30,
    };

    const exists = zones.some((z) => z.id === updatedZone.id);
    const nextZones = exists
      ? zones.map((z) => (z.id === updatedZone.id ? updatedZone : z))
      : [...zones, updatedZone];

    try {
      setIsSavingZones(true);
      const res = await adminApi.updateDeliveryZones(nextZones);
      if (res.success) {
        setZones(res.zones || nextZones);
        setIsZoneModalOpen(false);
        success(res.message || 'Delivery zones updated.');
      }
    } catch (err: any) {
      error(err.message || 'Failed to update delivery zones.');
    } finally {
      setIsSavingZones(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Dispatch & Zones"
        subtitle="Assign delivery riders, verify customer handoff OTPs, and configure serviceable pincode zones"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchDeliveries(true, page)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Refresh Dispatches"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            {activeTab === 'zones' && !isStaff ? (
              <button
                type="button"
                onClick={handleOpenCreateZone}
                className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Zone</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAssign()}
                className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Assign Rider</span>
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-charcoal-border pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('dispatches')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'dispatches'
              ? 'bg-gold text-charcoal-950 shadow-md'
              : 'bg-charcoal-card border border-charcoal-border text-beige hover:text-warmwhite'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Live Dispatches ({countsByStatus.total ?? total})</span>
        </button>

        {!isStaff && (
          <button
            type="button"
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
              activeTab === 'zones'
                ? 'bg-gold text-charcoal-950 shadow-md'
                : 'bg-charcoal-card border border-charcoal-border text-beige hover:text-warmwhite'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Zones ({zones.length})</span>
          </button>
        )}
      </div>

      {/* TAB 1: LIVE DISPATCHES */}
      {activeTab === 'dispatches' && (
        <div className="space-y-5">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Total</span>
              <span className="font-serif text-2xl font-bold text-warmwhite mt-1 block">
                {countsByStatus.total ?? total}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-amber-500/30">
              <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Assigned</span>
              <span className="font-serif text-2xl font-bold text-amber-300 mt-1 block">
                {countsByStatus.assigned ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-sky-500/30">
              <span className="text-[10px] text-sky-300 uppercase tracking-wider block">Picked Up</span>
              <span className="font-serif text-2xl font-bold text-sky-300 mt-1 block">
                {countsByStatus.picked_up ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-sky-500/30">
              <span className="text-[10px] text-sky-300 uppercase tracking-wider block">On The Way</span>
              <span className="font-serif text-2xl font-bold text-sky-300 mt-1 block">
                {countsByStatus.on_the_way ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-emerald-600/30">
              <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Delivered</span>
              <span className="font-serif text-2xl font-bold text-emerald-300 mt-1 block">
                {countsByStatus.delivered ?? 0}
              </span>
            </div>
          </div>

          {/* Search & Status Pills */}
          <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border space-y-3">
            <div className="flex flex-wrap gap-2">
              {(['all', 'assigned', 'picked_up', 'on_the_way', 'delivered', 'failed'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-gold/15 border-gold text-gold'
                      : 'bg-charcoal border-charcoal-border text-beige hover:text-warmwhite'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search order #, rider name, phone, customer, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-beige-muted hover:text-warmwhite cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-xs font-semibold text-warmwhite hover:text-gold cursor-pointer shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Table */}
          {isLoading ? (
            <LoadingState message="Loading active delivery dispatches..." />
          ) : deliveries.length === 0 ? (
            <EmptyState
              title="No Delivery Dispatches Found"
              description="Assign a rider to a delivery order to begin live tracking."
              action={
                <button
                  onClick={() => handleOpenAssign()}
                  className="px-4 py-2 bg-gold text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Assign First Rider
                </button>
              }
            />
          ) : (
            <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                      <th className="py-3.5 px-4 font-semibold">Order</th>
                      <th className="py-3.5 px-4 font-semibold">Customer &amp; Destination</th>
                      <th className="py-3.5 px-4 font-semibold">Assigned Rider</th>
                      <th className="py-3.5 px-4 font-semibold">Tracking Status</th>
                      <th className="py-3.5 px-4 font-semibold">OTP / ETA</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Dispatch Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-charcoal-border/60">
                    {deliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-charcoal/40 transition-colors">
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-gold">
                          {d.orderNumber}
                        </td>
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-warmwhite">{d.customerName || 'Guest'}</div>
                          <div className="text-[11px] text-beige line-clamp-1">{d.destinationAddress}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-warmwhite">{d.riderName}</div>
                          <div className="text-[11px] text-beige flex items-center space-x-1 font-mono">
                            <Phone className="w-3 h-3 text-gold" />
                            <span>{d.riderPhone}</span>
                            {d.vehicleNumber && <span>• {d.vehicleNumber}</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border capitalize ${getTrackingBadge(
                              d.trackingStatus
                            )}`}
                          >
                            {d.trackingStatus.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-beige">
                          {d.otp && (
                            <div className="font-mono text-gold font-bold">OTP: {d.otp}</div>
                          )}
                          {d.estimatedArrival && (
                            <div className="text-[10px] text-beige-muted flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(d.estimatedArrival).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {d.trackingStatus === 'assigned' && (
                              <button
                                type="button"
                                disabled={updatingOrder === d.orderNumber}
                                onClick={() => handleStatusChange(d.orderNumber, 'picked_up')}
                                className="px-2.5 py-1 rounded-lg bg-sky-950/50 border border-sky-500/40 text-sky-300 text-[11px] font-semibold cursor-pointer"
                              >
                                Picked Up
                              </button>
                            )}
                            {(d.trackingStatus === 'assigned' || d.trackingStatus === 'picked_up') && (
                              <button
                                type="button"
                                disabled={updatingOrder === d.orderNumber}
                                onClick={() => handleStatusChange(d.orderNumber, 'on_the_way')}
                                className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 text-[11px] font-semibold cursor-pointer"
                              >
                                On Way
                              </button>
                            )}
                            {d.trackingStatus !== 'delivered' && d.trackingStatus !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setOtpInput('');
                                  setOtpModalTarget(d);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-[11px] font-semibold inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Verify OTP</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenAssign(d)}
                              className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold cursor-pointer"
                              title="Reassign Rider"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
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
                    Page <strong className="text-warmwhite">{page}</strong> of{' '}
                    <strong className="text-warmwhite">{totalPages}</strong>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => {
                        const p = page - 1;
                        setPage(p);
                        fetchDeliveries(false, p);
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
                        fetchDeliveries(false, p);
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
        </div>
      )}

      {/* TAB 2: DELIVERY ZONES */}
      {activeTab === 'zones' && !isStaff && (
        <div className="space-y-4">
          {isLoadingZones ? (
            <LoadingState message="Loading delivery zones..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border hover:border-gold/40 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-warmwhite">{z.name}</h3>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          z.isActive
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-600/40'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {z.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenEditZone(z)}
                      className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold text-beige hover:text-gold cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {z.pincodes.map((pin) => (
                      <span
                        key={pin}
                        className="px-2 py-0.5 rounded-lg bg-charcoal border border-charcoal-border text-gold font-mono text-[11px]"
                      >
                        {pin}
                      </span>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-charcoal-border/60 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-beige-muted block">Delivery Fee</span>
                      <strong className="text-warmwhite">₹{z.deliveryFee}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-beige-muted block">Min Order</span>
                      <strong className="text-warmwhite">₹{z.minOrderValue}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-beige-muted block">ETA</span>
                      <strong className="text-gold">{z.estimatedMinutes} mins</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ASSIGN RIDER MODAL */}
      {isAssignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsAssignOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setIsAssignOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-serif text-xl font-bold text-warmwhite">Assign Delivery Rider</h2>

            <form onSubmit={handleAssignSubmit} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Order Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HST-2026-1001"
                  value={assignForm.orderNumber}
                  onChange={(e) => setAssignForm({ ...assignForm, orderNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-gold font-mono focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Rider Name *</label>
                  <input
                    type="text"
                    required
                    value={assignForm.riderName}
                    onChange={(e) => setAssignForm({ ...assignForm, riderName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Rider Phone *</label>
                  <input
                    type="tel"
                    required
                    value={assignForm.riderPhone}
                    onChange={(e) => setAssignForm({ ...assignForm, riderPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite font-mono focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-beige mb-1 font-medium">Vehicle Number</label>
                  <input
                    type="text"
                    placeholder="UP 78 AB 1234"
                    value={assignForm.vehicleNumber}
                    onChange={(e) => setAssignForm({ ...assignForm, vehicleNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite uppercase focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Est. Minutes</label>
                  <input
                    type="number"
                    min="5"
                    value={assignForm.estimatedMinutes}
                    onChange={(e) => setAssignForm({ ...assignForm, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-beige mb-1 font-medium">Dispatch Notes</label>
                <input
                  type="text"
                  placeholder="Call customer at gate..."
                  value={assignForm.deliveryNotes}
                  onChange={(e) => setAssignForm({ ...assignForm, deliveryNotes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige hover:text-warmwhite cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAssigning}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isAssigning ? 'Assigning...' : 'Assign Rider'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VERIFY OTP MODAL */}
      {otpModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setOtpModalTarget(null)} />
          <div className="relative w-full max-w-sm bg-charcoal-card border border-emerald-500/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <h3 className="font-serif text-xl font-bold text-warmwhite">Confirm Delivery OTP</h3>
            <p className="text-beige">
              Enter the 4-digit OTP shared by customer for order{' '}
              <strong className="text-gold font-mono">{otpModalTarget.orderNumber}</strong>.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="4-digit OTP"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                className="w-full px-3 py-2.5 text-center text-lg tracking-widest font-mono rounded-xl bg-charcoal border border-charcoal-border text-gold focus:border-gold focus:outline-none"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOtpModalTarget(null)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase tracking-wider inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isVerifyingOtp ? 'Verifying...' : 'Confirm Delivered'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT / CREATE ZONE MODAL */}
      {isZoneModalOpen && editingZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="absolute inset-0" onClick={() => setIsZoneModalOpen(false)} />
          <div className="relative w-full max-w-md bg-charcoal-card border border-gold/40 rounded-3xl p-6 shadow-2xl z-10 text-xs space-y-4">
            <button
              onClick={() => setIsZoneModalOpen(false)}
              className="absolute top-5 right-5 text-beige hover:text-warmwhite cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="font-serif text-xl font-bold text-warmwhite">Configure Delivery Zone</h2>
            <form onSubmit={handleSaveZone} className="space-y-3">
              <div>
                <label className="block text-beige mb-1 font-medium">Zone Name *</label>
                <input
                  type="text"
                  required
                  value={editingZone.name}
                  onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-beige mb-1 font-medium">Pincodes (Comma separated) *</label>
                <input
                  type="text"
                  required
                  placeholder="208013, 208001, 208011"
                  value={pincodesInput}
                  onChange={(e) => setPincodesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal border border-charcoal-border text-gold font-mono focus:border-gold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-beige mb-1 font-medium">Fee (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingZone.deliveryFee}
                    onChange={(e) => setEditingZone({ ...editingZone, deliveryFee: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">Min Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={editingZone.minOrderValue}
                    onChange={(e) => setEditingZone({ ...editingZone, minOrderValue: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-beige mb-1 font-medium">ETA (mins)</label>
                  <input
                    type="number"
                    min="5"
                    value={editingZone.estimatedMinutes}
                    onChange={(e) => setEditingZone({ ...editingZone, estimatedMinutes: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editingZone.isActive}
                  onChange={(e) => setEditingZone({ ...editingZone, isActive: e.target.checked })}
                  className="rounded bg-charcoal border-charcoal-border text-gold"
                />
                <span className="text-warmwhite">Zone Active for Checkout</span>
              </label>
              <div className="flex justify-end space-x-2 pt-3 border-t border-charcoal-border">
                <button
                  type="button"
                  onClick={() => setIsZoneModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-charcoal-border text-beige cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingZones}
                  className="px-5 py-2 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                >
                  {isSavingZones ? 'Saving...' : 'Save Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
