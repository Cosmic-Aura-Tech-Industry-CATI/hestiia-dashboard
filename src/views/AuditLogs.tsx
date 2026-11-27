'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  User,
  Globe,
  Trash2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  KeyRound,
  UtensilsCrossed,
  Users,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Lock,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { AdminUser, AuditLogEntry, AuditStats } from '../types';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../components/common/ToastContext';

type ActionCategory = 'ALL' | 'AUTH' | 'USER' | 'MENU' | 'BOOKINGS';

export const AuditLogs: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // Filter Drafts vs Applied Query (prevents per-keystroke API spam)
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    user: '',
    action: 'all',
    startDate: '',
    endDate: '',
  });

  const [category, setCategory] = useState<ActionCategory>('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Purge Modal
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [daysToKeep, setDaysToKeep] = useState(90);
  const [isPurging, setIsPurging] = useState(false);

  const { success, error } = useToast();

  const fetchLogs = useCallback(
    async (silent = false) => {
      if (isStaff) {
        setIsLoading(false);
        return;
      }
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      try {
        const res = await adminApi.getAuditLogs({
          page,
          limit,
          search: appliedFilters.search || undefined,
          user: appliedFilters.user || undefined,
          action: appliedFilters.action !== 'all' ? appliedFilters.action : undefined,
          startDate: appliedFilters.startDate || undefined,
          endDate: appliedFilters.endDate || undefined,
        });

        if (res.success) {
          setAccessDenied(false);
          setLogs(res.logs || []);
          setTotalPages(res.totalPages || 1);
          setTotalLogs(res.total || 0);
        }
      } catch (err: any) {
        if (err?.status === 403) {
          setAccessDenied(true);
        } else if (!silent) {
          error(err.message || 'Failed to retrieve audit log trail.');
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [isStaff, page, limit, appliedFilters]
  );

  const fetchStats = useCallback(async () => {
    if (isStaff) return;
    try {
      const res = await adminApi.getAuditStats();
      if (res.success) {
        setStats(res.stats);
      }
    } catch {
      // Non-critical stats failover
    }
  }, [isStaff]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleApplyFilters = (e?: React.FormEvent) => {
    e?.preventDefault();
    setPage(1);
    setAppliedFilters({
      search: searchQuery.trim(),
      user: userFilter.trim(),
      action: actionFilter,
      startDate,
      endDate,
    });
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setUserFilter('');
    setActionFilter('all');
    setStartDate('');
    setEndDate('');
    setCategory('ALL');
    setPage(1);
    setAppliedFilters({
      search: '',
      user: '',
      action: 'all',
      startDate: '',
      endDate: '',
    });
  };

  const handleQuickActionFilter = (actionTag: string) => {
    const nextAction = actionFilter === actionTag ? 'all' : actionTag;
    setActionFilter(nextAction);
    setPage(1);
    setAppliedFilters((prev) => ({
      ...prev,
      action: nextAction,
    }));
  };

  const handlePurgeLogs = async () => {
    try {
      setIsPurging(true);
      const res = await adminApi.purgeAuditLogs(daysToKeep);
      if (res.success) {
        success(res.message || `Audit logs older than ${daysToKeep} days purged.`);
        setIsPurgeModalOpen(false);
        fetchLogs();
        fetchStats();
      }
    } catch (err: any) {
      error(err.message || 'Failed to purge historical logs.');
    } finally {
      setIsPurging(false);
    }
  };

  const topActions = useMemo(() => {
    if (!stats?.actionBreakdown) return [];
    return Object.entries(stats.actionBreakdown).slice(0, 8);
  }, [stats]);

  // Category Client Filtering
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (category === 'ALL') return true;
      const act = (log.action || '').toUpperCase();
      if (category === 'AUTH') {
        return (
          act.includes('AUTH') ||
          act.includes('LOGIN') ||
          act.includes('TOKEN') ||
          act.includes('PASSWORD') ||
          act.includes('OTP')
        );
      }
      if (category === 'USER') {
        return act.includes('USER') || act.includes('ROLE') || act.includes('STATUS');
      }
      if (category === 'MENU') {
        return act.includes('CATEGORY') || act.includes('DISH') || act.includes('MENU');
      }
      if (category === 'BOOKINGS') {
        return act.includes('BOOKING') || act.includes('PARTY') || act.includes('RESERVATION');
      }
      return true;
    });
  }, [logs, category]);

  const hasActiveFilters = Boolean(
    appliedFilters.search ||
      appliedFilters.user ||
      appliedFilters.action !== 'all' ||
      appliedFilters.startDate ||
      appliedFilters.endDate ||
      category !== 'ALL'
  );

  // Action Badge Color Styler
  const getActionBadgeClass = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('FAILED') || act.includes('REJECTED') || act.includes('DELETE')) {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (act.includes('SUCCESS') || act.includes('CREATE') || act.includes('ADD')) {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (act.includes('UPDATE') || act.includes('REFRESH') || act.includes('STATUS')) {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Security & System Audit Trail"
          subtitle="Immutable chronological ledger of administrative access, staff operations, and security events."
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            The Security &amp; System Audit Trail is restricted to Manager and Superadmin accounts.
          </p>
        </div>
      </div>
    );
  }

  // Derive top security stats
  const failedLoginsCount = stats?.actionBreakdown?.FAILED_LOGIN_ATTEMPT ?? 0;
  const accessRejectionsCount = stats?.actionBreakdown?.AUTH_ADMIN_LOGIN_REJECTED ?? 0;
  const totalSecurityAlerts = failedLoginsCount + accessRejectionsCount;

  return (
    <div className="space-y-6 animate-fadeIn pb-12 selection:bg-gold/30 selection:text-gold-light">
      {/* Header */}
      <PageHeader
        title="Security & System Audit Trail"
        subtitle="Immutable chronological ledger of administrative access, staff operations, and security events."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                fetchLogs(true);
                fetchStats();
              }}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige-muted hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Refresh Audit Trail"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-charcoal border border-rose-500/30 text-xs text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/60 transition-all cursor-pointer font-medium"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge History</span>
            </button>
          </div>
        }
      />

      {/* Top 4 Security & System Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-beige uppercase tracking-wider font-semibold">Total Audit Logs</span>
            <div className="w-7 h-7 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {stats?.totalLogs ?? totalLogs}
          </div>
          <span className="text-[10px] text-beige-muted">Recorded system actions</span>
        </div>

        {/* Unique System Actors */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-beige uppercase tracking-wider font-semibold">Distinct Actors</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-blue-300">
            {stats?.uniqueUsersCount ?? 0}
          </div>
          <span className="text-[10px] text-beige-muted">Staff, Admins &amp; Services</span>
        </div>

        {/* Security Alerts */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-rose-500/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-rose-300 uppercase tracking-wider font-semibold">Security Alerts</span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-rose-300">{totalSecurityAlerts}</div>
          <span className="text-[10px] text-rose-400/80">Failed logins &amp; access rejections</span>
        </div>

        {/* Successful Logins */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-emerald-300 uppercase tracking-wider font-semibold">Auth Successes</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-300">
            {stats?.actionBreakdown?.AUTH_LOGIN_SUCCESS ?? 0}
          </div>
          <span className="text-[10px] text-emerald-400/80">Authorized portal sessions</span>
        </div>
      </div>

      {/* Top Action Breakdown Chips */}
      {topActions.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-charcoal-card border border-charcoal-border flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-beige-muted font-semibold mr-1">
            Top Events:
          </span>
          {topActions.map(([actName, count]) => {
            const active = actionFilter === actName;
            return (
              <button
                key={actName}
                type="button"
                onClick={() => handleQuickActionFilter(actName)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-mono border transition-all cursor-pointer flex items-center space-x-1.5 ${
                  active
                    ? 'bg-gold/15 border-gold text-gold font-bold'
                    : 'bg-charcoal border-charcoal-border text-beige hover:border-gold/40 hover:text-warmwhite'
                }`}
              >
                <span>{actName}</span>
                <span className="text-beige-muted">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Action Category Filter Pills */}
      <div className="flex items-center space-x-2 border-b border-charcoal-border overflow-x-auto pb-px">
        {[
          { id: 'ALL', label: 'All Activities', icon: Layers },
          { id: 'AUTH', label: 'Auth & Access', icon: KeyRound },
          { id: 'USER', label: 'Staff Roles', icon: Users },
          { id: 'MENU', label: 'Menu & Dishes', icon: UtensilsCrossed },
          { id: 'BOOKINGS', label: 'Bookings & Parties', icon: Calendar },
        ].map((c) => {
          const Icon = c.icon;
          const isActive = category === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id as ActionCategory)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-beige hover:text-warmwhite hover:border-charcoal-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search, Actor, Action & Date Range Filter Bar */}
      <form
        onSubmit={handleApplyFilters}
        className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
      >
        <div className="md:col-span-4 relative min-w-0">
          <Search className="w-4 h-4 text-beige-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action tag, details, IP..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </div>

        <div className="md:col-span-2 min-w-0">
          <input
            type="text"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="Actor (e.g. admin)"
            className="w-full px-3 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite placeholder-beige-muted focus:border-gold focus:outline-none"
          />
        </div>

        <div className="md:col-span-2 min-w-0">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            title="Start Date"
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none [color-scheme:dark]"
          />
        </div>

        <div className="md:col-span-2 min-w-0">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            title="End Date"
            className="w-full px-2.5 py-2 text-xs rounded-xl bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none [color-scheme:dark]"
          />
        </div>

        <div className="md:col-span-2 flex items-center gap-2">
          <button
            type="submit"
            className="flex-1 py-2 px-3 rounded-xl bg-gold hover:bg-gold-light text-charcoal-950 font-bold text-xs cursor-pointer transition-colors"
          >
            Filter
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              title="Clear all filters"
              className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-beige-muted hover:text-warmwhite cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-charcoal-border/60 text-xs">
          <div className="flex items-center space-x-2">
            {actionFilter !== 'all' && (
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-gold/15 border border-gold/40 text-gold text-[10px] font-mono">
                <span>Action: {actionFilter}</span>
                <button
                  type="button"
                  onClick={() => handleQuickActionFilter(actionFilter)}
                  className="hover:text-warmwhite cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-beige-muted">Rows per page:</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-charcoal border border-charcoal-border text-warmwhite focus:border-gold focus:outline-none cursor-pointer"
            >
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
              <option value={100}>100 / page</option>
            </select>
          </div>
        </div>
      </form>

      {/* Audit Ledger Table */}
      {accessDenied ? (
        <div className="p-8 rounded-3xl bg-charcoal-card border border-rose-500/40 text-center space-y-3 shadow-lg">
          <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-warmwhite">Administrator Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto leading-relaxed">
            The Security &amp; System Audit Trail is restricted to{' '}
            <strong className="text-gold">Admin / Manager</strong> accounts.
          </p>
        </div>
      ) : isLoading ? (
        <div className="py-20 flex justify-center">
          <LoadingState message="Retrieving System Audit Trail..." />
        </div>
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No Audit Logs Found"
          description={
            hasActiveFilters
              ? 'No audit log entries match your active search filters.'
              : 'The audit logging ledger is currently empty.'
          }
        />
      ) : (
        <div className="bg-charcoal-card border border-charcoal-border rounded-3xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-3.5 px-4 font-semibold">Action Event</th>
                  <th className="py-3.5 px-4 font-semibold">Actor / User</th>
                  <th className="py-3.5 px-4 font-semibold">Description &amp; Details</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50">
                {filteredLogs.map((log) => {
                  const time = formatTimestamp(log.timestamp || log.createdAt || '');
                  return (
                    <tr key={log.id} className="hover:bg-charcoal/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-warmwhite text-xs font-semibold">{time.date}</div>
                        <div className="text-[10px] text-beige-muted font-mono">{time.time}</div>
                      </td>

                      {/* Action Event Tag */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      {/* Actor / User */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5 font-medium text-warmwhite">
                          <User className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                          <span className="truncate max-w-[160px]">{log.user}</span>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-beige leading-relaxed max-w-xl">{log.details}</p>
                      </td>

                      {/* Client IP */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 font-mono text-[11px] text-beige-muted px-2 py-0.5 rounded bg-charcoal border border-charcoal-border">
                          <Globe className="w-3 h-3 text-beige-muted" />
                          <span>{log.ip || 'unknown'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-charcoal-border/60 bg-charcoal/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-beige-muted text-[11px]">
              Showing <strong className="text-warmwhite font-semibold">{filteredLogs.length}</strong> of{' '}
              <strong className="text-warmwhite font-semibold">{totalLogs}</strong> audited events
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border text-beige-muted hover:text-gold hover:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs text-beige font-mono px-2">
                Page <strong className="text-gold">{page}</strong> of{' '}
                <strong className="text-warmwhite">{totalPages}</strong>
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                className="p-1.5 rounded-lg bg-charcoal border border-charcoal-border text-beige-muted hover:text-gold hover:border-gold/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purge Historical Logs Modal */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md p-6 rounded-3xl bg-charcoal-card border border-rose-500/40 shadow-2xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-warmwhite">Purge Historical Audit Logs</h3>
                <p className="text-xs text-beige-muted">Database retention &amp; maintenance</p>
              </div>
            </div>

            <p className="text-xs text-beige leading-relaxed mb-4">
              Select the cutoff threshold. All historical system logs older than the chosen days will be permanently
              wiped from both MongoDB and in-memory audit store.
            </p>

            <div className="mb-6 space-y-2">
              <label className="block text-xs font-medium text-beige">Retention Threshold:</label>
              <select
                value={daysToKeep}
                onChange={(e) => setDaysToKeep(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite text-xs focus:border-rose-500 focus:outline-none"
              >
                <option value={30}>Purge older than 30 days (1 Month)</option>
                <option value={60}>Purge older than 60 days (2 Months)</option>
                <option value={90}>Purge older than 90 days (Quarterly)</option>
                <option value={180}>Purge older than 180 days (6 Months)</option>
                <option value={365}>Purge older than 365 days (1 Year)</option>
              </select>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={() => setIsPurgeModalOpen(false)}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-charcoal border border-charcoal-border text-beige hover:text-warmwhite text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeLogs}
                disabled={isPurging}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isPurging ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Purge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogs;
