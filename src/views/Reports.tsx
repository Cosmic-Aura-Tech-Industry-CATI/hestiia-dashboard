'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CreditCard,
  Truck,
  Users,
  ShoppingBag,
  RefreshCw,
  Clock,
  Flame,
  Award,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Search,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UtensilsCrossed,
  Layers,
  Lock,
  FileSpreadsheet,
  Receipt,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { adminApi } from '../services/adminApi';
import { getCachedAuthUser, isStaffRole } from '../services/apiClient';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';
import {
  AdminUser,
  DatePreset,
  RevenueAnalytics,
  OrderAnalytics,
  ProductPerformanceAnalytics,
  CustomerAnalytics,
  PaymentAnalytics,
  ResolvedDateRange,
  TaxReportResponse,
  ReportsModuleStatus,
} from '../types';

type BiTab = 'revenue' | 'orders' | 'products' | 'customers' | 'payments' | 'tax';

const DATE_PRESETS: { label: string; value: DatePreset }[] = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 Days', value: 'last7days' },
  { label: 'This Month', value: 'thismonth' },
  { label: 'Last 30 Days', value: 'last30days' },
  { label: 'Previous Month', value: 'previousmonth' },
];

const PIE_COLORS = ['#d4af37', '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

function mapPresetToReportPeriod(preset: DatePreset): 'today' | '7days' | '30days' {
  if (preset === 'today') return 'today';
  if (preset === 'last7days') return '7days';
  return '30days';
}

export const Reports: React.FC = () => {
  const currentUser = getCachedAuthUser<AdminUser>();
  const isStaff = isStaffRole(currentUser?.role);

  const [activeTab, setActiveTab] = useState<BiTab>('revenue');
  const [preset, setPreset] = useState<DatePreset>('last30days');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState<string | null>(null);

  // Analytical Data Stores
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [ordersData, setOrdersData] = useState<OrderAnalytics | null>(null);
  const [productsData, setProductsData] = useState<ProductPerformanceAnalytics | null>(null);
  const [customersData, setCustomersData] = useState<CustomerAnalytics | null>(null);
  const [paymentsData, setPaymentsData] = useState<PaymentAnalytics | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReportResponse | null>(null);
  const [reportsStatus, setReportsStatus] = useState<ReportsModuleStatus | null>(null);
  const [dateRange, setDateRange] = useState<ResolvedDateRange | null>(null);

  // Search & Filter within products
  const [productSearch, setProductSearch] = useState('');

  const { error, success } = useToast();

  const fetchBiData = useCallback(async (isSilent = false) => {
    if (isStaff) {
      setIsLoading(false);
      return;
    }
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);

    const reportPeriod = mapPresetToReportPeriod(preset);

    try {
      const results = await Promise.allSettled([
        adminApi.getAnalyticsRevenue({ preset }),
        adminApi.getAnalyticsOrders({ preset }),
        adminApi.getAnalyticsProducts({ preset }),
        adminApi.getAnalyticsCustomers({ preset }),
        adminApi.getAnalyticsPayments({ preset }),
        adminApi.getTaxReport({ period: reportPeriod }),
        adminApi.getReportsStatus(),
      ]);

      if (results[0].status === 'fulfilled' && results[0].value.success) {
        setRevenueData(results[0].value.revenue);
        setDateRange(results[0].value.dateRange);
      }
      if (results[1].status === 'fulfilled' && results[1].value.success) {
        setOrdersData(results[1].value.orders);
      }
      if (results[2].status === 'fulfilled' && results[2].value.success) {
        setProductsData(results[2].value.products);
      }
      if (results[3].status === 'fulfilled' && results[3].value.success) {
        setCustomersData(results[3].value.customers);
      }
      if (results[4].status === 'fulfilled' && results[4].value.success) {
        setPaymentsData(results[4].value.payments);
      }
      if (results[5].status === 'fulfilled' && results[5].value.success) {
        setTaxReport(results[5].value);
      }
      if (results[6].status === 'fulfilled' && results[6].value.success) {
        setReportsStatus(results[6].value);
      }
    } catch (err: any) {
      error(err.message || 'Failed to load analytical metrics.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [preset, isStaff, error]);

  useEffect(() => {
    fetchBiData();
  }, [fetchBiData]);

  const handleDownloadCsv = async (type: 'orders' | 'customers' | 'tax' | 'menu-performance') => {
    const reportPeriod = mapPresetToReportPeriod(preset);
    try {
      setDownloadingCsv(type);
      const blob = await adminApi.downloadReportCsv(type, {
        period: reportPeriod,
        startDate: type === 'orders' ? dateRange?.startDate : undefined,
        endDate: type === 'orders' ? dateRange?.endDate : undefined,
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `hestiia_${type}_export_${preset}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      success(`Downloaded ${type} export successfully.`);
    } catch {
      error(`Failed to download ${type} export.`);
    } finally {
      setDownloadingCsv(null);
    }
  };

  // Safe Fallback Numbers
  const totalRev = revenueData?.collectedRevenue ?? 0;
  const netSales = revenueData?.netSales ?? 0;
  const grossSales = revenueData?.grossSales ?? 0;
  const totalDiscounts = revenueData?.discounts ?? 0;
  const totalRefunds = revenueData?.refundAmounts ?? 0;
  const revChange = revenueData?.comparison?.revenueChangePercent ?? 0;
  const orderChange = revenueData?.comparison?.ordersChangePercent ?? 0;

  const totalOrdersCount = ordersData?.totalOrders ?? 0;
  const avgOrderVal = ordersData?.averageOrderValue ?? revenueData?.averageOrderValue ?? 0;
  const avgPrepTime = ordersData?.averagePreparationTimeMinutes ?? 22;

  // Chart Data Preparation
  const revenueTrends = (revenueData?.trends || []).map((t) => ({
    date: t.date.slice(5),
    gross: t.grossSales,
    collected: t.collectedRevenue,
    orders: t.orderCount,
  }));

  const peakHoursData = (ordersData?.peakOrderingHours || []).map((h) => ({
    hour: h.formattedHour,
    count: h.orderCount,
    percentage: h.percentage,
  }));

  const fulfillmentData = ordersData ? [
    { name: 'Home Delivery', value: ordersData.ordersByType.delivery || 0, color: '#d4af37' },
    { name: 'Dine-In Table', value: ordersData.ordersByType.dineIn || 0, color: '#10b981' },
    { name: 'Self Pickup', value: ordersData.ordersByType.pickup || 0, color: '#3b82f6' },
  ].filter(item => item.value > 0) : [];

  const categoryData = (productsData?.categoryWiseSales || []).map((c, i) => ({
    name: c.category,
    value: c.revenue,
    quantity: c.quantitySold,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }));

  const filteredProducts = (productsData?.allProducts || []).filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (isStaff) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Business Intelligence & Analytics"
          subtitle="Audited financial performance, GST tax compliance, and CSV exports"
        />
        <div className="p-8 rounded-3xl bg-charcoal-card border border-charcoal-border text-center space-y-2">
          <Lock className="w-8 h-8 text-gold mx-auto" />
          <h3 className="font-serif text-xl font-bold text-warmwhite">Manager / Admin Access Required</h3>
          <p className="text-xs text-beige max-w-md mx-auto">
            Financial analytics, GST tax summaries, and CSV exports are restricted to Manager and Superadmin accounts.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingState message="Aggregating Restaurant Business Intelligence..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12 selection:bg-gold/30 selection:text-gold-light">
      {/* Page Header */}
      <PageHeader
        title="Business Intelligence & Analytics"
        subtitle="Audited financial performance, kitchen peak hours, menu engineering, and patron retention."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {/* Refresh Button */}
            <button
              onClick={() => fetchBiData(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-charcoal border border-charcoal-border text-beige-muted hover:text-gold hover:border-gold/40 transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-gold' : ''}`} />
            </button>

            {/* Export CSVs */}
            <button
              onClick={() => handleDownloadCsv('orders')}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-charcoal border border-charcoal-border text-xs text-warmwhite hover:border-gold/50 hover:text-gold transition-all cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Orders CSV</span>
            </button>
            <button
              onClick={() => handleDownloadCsv('customers')}
              className="inline-flex items-center space-x-1.5 py-2 px-3.5 rounded-xl bg-charcoal border border-charcoal-border text-xs text-warmwhite hover:border-gold/50 hover:text-gold transition-all cursor-pointer font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Patrons CSV</span>
            </button>
          </div>
        }
      />

      {/* Universal Date Preset Selector & Time Horizon Strip */}
      <div className="p-3 sm:p-4 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-beige-muted">
          <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="font-medium text-warmwhite">Time Horizon:</span>
        </div>

        {/* Preset Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {DATE_PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                preset === p.value
                  ? 'bg-gold text-charcoal-950 shadow-[0_2px_12px_rgba(212,175,55,0.35)]'
                  : 'bg-charcoal/80 text-beige hover:text-warmwhite hover:bg-charcoal border border-charcoal-border/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Period Comparison Badge */}
        {revenueData?.comparison && (
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-charcoal border border-charcoal-border text-xs">
            <span className="text-[11px] text-beige-muted">Revenue vs Prev Period:</span>
            <span
              className={`inline-flex items-center font-bold font-mono text-xs ${
                revChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {revChange >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {Math.abs(revChange)}%
            </span>
          </div>
        )}
      </div>

      {/* Top 4 Macro KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Collected Revenue */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-emerald-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-emerald-400 font-semibold tracking-wide uppercase text-[10px]">
              Collected Revenue
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-300">
            ₹{totalRev.toLocaleString('en-IN')}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-[11px]">
            <span className={revChange >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {revChange >= 0 ? `+${revChange}%` : `${revChange}%`}
            </span>
            <span className="text-beige-muted">vs previous period</span>
          </div>
        </div>

        {/* Total Dining Orders */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-beige font-semibold tracking-wide uppercase text-[10px]">
              Dining Orders
            </span>
            <div className="w-7 h-7 rounded-xl bg-gold/15 flex items-center justify-center text-gold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {totalOrdersCount}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-[11px]">
            <span className={orderChange >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              {orderChange >= 0 ? `+${orderChange}%` : `${orderChange}%`}
            </span>
            <span className="text-beige-muted">order volume growth</span>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-beige font-semibold tracking-wide uppercase text-[10px]">
              Average Order Value
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-gold">
            ₹{avgOrderVal.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-beige-muted mt-2">
            Per verified guest order
          </div>
        </div>

        {/* Customer Retention / Repeat Rate */}
        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-beige font-semibold tracking-wide uppercase text-[10px]">
              Repeat Guest Rate
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-purple-300">
            {customersData?.repeatPurchaseRate ?? 0}%
          </div>
          <div className="text-[11px] text-beige-muted mt-2">
            {customersData?.returningCustomers ?? 0} returning patrons
          </div>
        </div>
      </div>

      {/* Strategic 6-Tab Navigation Strip */}
      <div className="flex items-center space-x-2 border-b border-charcoal-border overflow-x-auto pb-px">
        {[
          { id: 'revenue', label: 'Financial & Revenue', icon: TrendingUp },
          { id: 'orders', label: 'Orders & Rush Hours', icon: Clock },
          { id: 'products', label: 'Menu Engineering', icon: UtensilsCrossed },
          { id: 'customers', label: 'Patron Retention & VIPs', icon: Users },
          { id: 'payments', label: 'Gateway Health', icon: CreditCard },
          { id: 'tax', label: 'GST Tax & Exports', icon: Receipt },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BiTab)}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-transparent text-beige hover:text-warmwhite hover:border-charcoal-border'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: FINANCIAL & REVENUE INTELLIGENCE                              */}
      {/* ===================================================================== */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Detailed Financial Breakdown Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[11px] text-beige-muted uppercase tracking-wider font-semibold">Gross Dish Sales</span>
              <div className="text-xl font-serif font-bold text-warmwhite mt-1">
                ₹{grossSales.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-beige-muted">Pre-discount item billings</span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[11px] text-amber-400 uppercase tracking-wider font-semibold">Promotional Discounts</span>
              <div className="text-xl font-serif font-bold text-amber-300 mt-1">
                -₹{totalDiscounts.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-beige-muted">Coupons and specials applied</span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold">Net Invoiced Sales</span>
              <div className="text-xl font-serif font-bold text-emerald-300 mt-1">
                ₹{netSales.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-beige-muted">Post-discount net billings</span>
            </div>
            <div className="p-4 rounded-2xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider font-semibold">Refunds Processed</span>
              <div className="text-xl font-serif font-bold text-rose-300 mt-1">
                ₹{totalRefunds.toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-beige-muted">{paymentsData?.refundCount || 0} reversed transactions</span>
            </div>
          </div>

          {/* Revenue Trend Area Chart */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-warmwhite">
                  Revenue Collection Curve
                </h3>
                <p className="text-xs text-beige-muted mt-0.5">
                  Daily net receipts trajectory across selected time horizon
                </p>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="flex items-center space-x-1.5 text-gold">
                  <span className="w-2.5 h-2.5 rounded-full bg-gold" />
                  <span>Collected Net</span>
                </span>
                <span className="flex items-center space-x-1.5 text-beige-muted">
                  <span className="w-2.5 h-2.5 rounded-full bg-charcoal-border" />
                  <span>Gross Billings</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {revenueTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrends}>
                    <defs>
                      <linearGradient id="revenueGoldGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d4af37" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#d4af37" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262320" />
                    <XAxis dataKey="date" stroke="#8c827a" fontSize={11} />
                    <YAxis
                      stroke="#8c827a"
                      fontSize={11}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171614',
                        borderColor: '#38332e',
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: '#f5f2eb',
                      }}
                      formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                    />
                    <Area
                      type="monotone"
                      dataKey="collected"
                      stroke="#d4af37"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#revenueGoldGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-beige-muted">
                  No revenue trend records available for this period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ORDERS, PEAK HOURS & FULFILLMENT                             */}
      {/* ===================================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          {/* Top Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center text-gold">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-beige-muted">Average Preparation Time</span>
                <div className="font-serif text-2xl font-bold text-warmwhite">
                  {avgPrepTime} mins
                </div>
                <span className="text-[10px] text-emerald-400">Kitchen order completion pace</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-beige-muted">Order Completion Rate</span>
                <div className="font-serif text-2xl font-bold text-emerald-400">
                  {totalOrdersCount > 0
                    ? `${Math.round(((ordersData?.completedOrders || 0) / totalOrdersCount) * 100)}%`
                    : '100%'}
                </div>
                <span className="text-[10px] text-beige-muted">{ordersData?.completedOrders || 0} successfully delivered</span>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-beige-muted">Order Cancellation Rate</span>
                <div className="font-serif text-2xl font-bold text-rose-300">
                  {totalOrdersCount > 0
                    ? `${Math.round(((ordersData?.cancelledOrders || 0) / totalOrdersCount) * 100)}%`
                    : '0%'}
                </div>
                <span className="text-[10px] text-rose-400/80">{ordersData?.cancelledOrders || 0} cancelled orders</span>
              </div>
            </div>
          </div>

          {/* 24-Hour Peak Ordering Hours Heatmap Bar Chart */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>24-Hour Peak Kitchen Rush Hours</span>
                </h3>
                <p className="text-xs text-beige-muted mt-0.5">
                  Order traffic distributed across time of day (Asia/Kolkata timezone)
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              {peakHoursData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={peakHoursData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262320" />
                    <XAxis dataKey="hour" stroke="#8c827a" fontSize={10} interval={1} />
                    <YAxis stroke="#8c827a" fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#171614',
                        borderColor: '#38332e',
                        borderRadius: '16px',
                        fontSize: '12px',
                        color: '#f5f2eb',
                      }}
                      formatter={(val: any) => [`${val} orders`, 'Volume']}
                    />
                    <Bar dataKey="count" fill="#d4af37" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-beige-muted">
                  No peak hour traffic recorded for this period.
                </div>
              )}
            </div>
          </div>

          {/* Fulfillment Mode Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
              <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
                <Truck className="w-5 h-5 text-gold" />
                <span>Dining Channels</span>
              </h3>
              <div className="space-y-3">
                {fulfillmentData.map((f, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-between">
                    <span className="text-xs text-warmwhite font-medium">{f.name}</span>
                    <span className="font-bold text-sm text-gold font-mono">{f.value} orders</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md flex flex-col justify-center">
              <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4">
                Fulfillment Share
              </h3>
              <div className="h-44 w-full flex items-center justify-center">
                {fulfillmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fulfillmentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                      >
                        {fulfillmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#171614',
                          borderColor: '#38332e',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#f5f2eb',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <span className="text-xs text-beige-muted">No orders available.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: MENU ENGINEERING & PRODUCT PERFORMANCE                       */}
      {/* ===================================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          {/* Top Star Dishes vs Dead Stock Low Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Best Sellers */}
            <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-warmwhite">Star Menu Dishes</h3>
                  <p className="text-xs text-beige-muted">Highest gross sales contribution</p>
                </div>
              </div>

              <div className="space-y-3">
                {(productsData?.bestSellingProducts || []).slice(0, 5).map((dish, idx) => (
                  <div
                    key={dish.dishId || idx}
                    className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-serif font-bold text-gold text-sm">#{idx + 1}</span>
                      <div>
                        <span className="text-xs font-semibold text-warmwhite block">{dish.name}</span>
                        <span className="text-[10px] text-beige-muted">{dish.category} &bull; {dish.quantitySold} servings</span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-sm text-gold">
                      ₹{dish.revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Performers / Dead Stock Alert */}
            <div className="p-6 rounded-3xl bg-charcoal-card border border-amber-500/30 shadow-md">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-amber-200">Underperforming Dishes</h3>
                  <p className="text-xs text-beige-muted">Dishes with zero or low demand in selected period</p>
                </div>
              </div>

              <div className="space-y-3">
                {(productsData?.lowPerformingProducts || []).slice(0, 5).map((dish, idx) => (
                  <div
                    key={dish.dishId || idx}
                    className="p-3.5 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-semibold text-warmwhite block">{dish.name}</span>
                      <span className="text-[10px] text-amber-400/80">{dish.category} &bull; Only {dish.quantitySold} sold</span>
                    </div>
                    <span className="text-[11px] font-mono font-medium px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30">
                      Needs Review
                    </span>
                  </div>
                ))}
                {(productsData?.lowPerformingProducts || []).length === 0 && (
                  <p className="text-xs text-emerald-400 p-4 text-center">
                    All menu dishes performed with healthy sales velocity in this period!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Full Product Performance Roster with Search */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-warmwhite">
                  All Dishes Sales Performance
                </h3>
                <p className="text-xs text-beige-muted">
                  Audited volume, unit pricing, and revenue across the culinary menu
                </p>
              </div>

              {/* Search Field */}
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-beige-muted absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter dishes or category..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-charcoal border border-charcoal-border text-warmwhite text-xs placeholder-beige-muted focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Dish Name</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Unit Price</th>
                    <th className="py-3 px-4 font-semibold">Servings Sold</th>
                    <th className="py-3 px-4 font-semibold text-right">Gross Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/50">
                  {filteredProducts.map((p, idx) => (
                    <tr key={p.dishId || idx} className="hover:bg-charcoal/40 transition-colors">
                      <td className="py-3 px-4 font-serif font-bold text-warmwhite text-sm">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-beige">{p.category}</td>
                      <td className="py-3 px-4 text-warmwhite font-mono">₹{p.unitPrice}</td>
                      <td className="py-3 px-4 text-warmwhite font-semibold">{p.quantitySold}</td>
                      <td className="py-3 px-4 font-serif font-bold text-gold text-right">
                        ₹{p.revenue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PATRON RETENTION & VIP DINERS                                */}
      {/* ===================================================================== */}
      {activeTab === 'customers' && (
        <div className="space-y-6">
          {/* Retention Cohort Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[10px] text-beige-muted uppercase tracking-wider font-semibold">Unique Diners</span>
              <div className="text-2xl font-serif font-bold text-warmwhite mt-1">
                {customersData?.totalUniqueCustomers || 0}
              </div>
              <span className="text-[10px] text-beige-muted">Total distinct guests</span>
            </div>
            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">New Guests</span>
              <div className="text-2xl font-serif font-bold text-emerald-300 mt-1">
                {customersData?.newCustomers || 0}
              </div>
              <span className="text-[10px] text-beige-muted">First order in this period</span>
            </div>
            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[10px] text-purple-400 uppercase tracking-wider font-semibold">Loyal Regulars</span>
              <div className="text-2xl font-serif font-bold text-purple-300 mt-1">
                {customersData?.returningCustomers || 0}
              </div>
              <span className="text-[10px] text-beige-muted">Multi-visit patrons</span>
            </div>
            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
              <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">Avg Spend / Guest</span>
              <div className="text-2xl font-serif font-bold text-gold mt-1">
                ₹{(customersData?.averageCustomerSpending || 0).toLocaleString('en-IN')}
              </div>
              <span className="text-[10px] text-beige-muted">Lifetime dining expenditure</span>
            </div>
          </div>

          {/* Highest Value VIP Customers Leaderboard */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <h3 className="font-serif text-lg font-semibold text-warmwhite mb-2 flex items-center space-x-2">
              <Award className="w-5 h-5 text-gold" />
              <span>Hestiia VIP Patron Leaderboard</span>
            </h3>
            <p className="text-xs text-beige-muted mb-4">
              Top patrons ranked by cumulative dining expenditure and dining frequency
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 font-semibold">Patron Name</th>
                    <th className="py-3 px-4 font-semibold">Phone Number</th>
                    <th className="py-3 px-4 font-semibold">Total Orders</th>
                    <th className="py-3 px-4 font-semibold">VIP Tier</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Lifetime Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-charcoal-border/50">
                  {(customersData?.highestValueCustomers || []).map((vip, idx) => (
                    <tr key={vip.phone || idx} className="hover:bg-charcoal/40 transition-colors">
                      <td className="py-3 px-4 font-serif font-bold text-warmwhite text-sm flex items-center space-x-2">
                        <span>{vip.name || 'Hestiia Guest'}</span>
                        {idx === 0 && <span className="text-xs">👑</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-beige">{vip.phone}</td>
                      <td className="py-3 px-4 font-semibold text-warmwhite">{vip.totalOrders} dining orders</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30">
                          {idx < 3 ? 'Platinum VIP' : 'Gold Patron'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-serif font-bold text-emerald-400 text-sm text-right">
                        ₹{vip.totalSpent.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {(customersData?.highestValueCustomers || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-beige-muted">
                        No customer spending records available for this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 5: PAYMENT GATEWAY HEALTH & CHANNELS                             */}
      {/* ===================================================================== */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          {/* Gateway Success Rate Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-charcoal-card border border-emerald-500/30">
              <span className="text-xs text-emerald-400 font-semibold uppercase text-[10px]">Gateway Success Rate</span>
              <div className="font-serif text-3xl font-bold text-emerald-300 mt-1">
                {paymentsData?.paymentSuccessRate ?? 100}%
              </div>
              <span className="text-[10px] text-beige-muted">Authorized transaction throughput</span>
            </div>

            <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
              <span className="text-xs text-beige font-semibold uppercase text-[10px]">Successful Transactions</span>
              <div className="font-serif text-3xl font-bold text-warmwhite mt-1">
                {paymentsData?.successfulPayments ?? 0}
              </div>
              <span className="text-[10px] text-beige-muted">Captured settlements</span>
            </div>

            <div className="p-5 rounded-3xl bg-charcoal-card border border-rose-500/30">
              <span className="text-xs text-rose-400 font-semibold uppercase text-[10px]">Failed Attempts</span>
              <div className="font-serif text-3xl font-bold text-rose-300 mt-1">
                {paymentsData?.failedPayments ?? 0}
              </div>
              <span className="text-[10px] text-rose-400/80">Declined or dropped off</span>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
            <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-gold" />
              <span>Settlement Channel Breakdown</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-xs text-warmwhite font-medium block">UPI Instant QR</span>
                <span className="text-xl font-serif font-bold text-emerald-400 block mt-1">
                  {paymentsData?.paymentMethodDistribution.upi ?? 0}
                </span>
                <span className="text-[10px] text-beige-muted">Direct UPI transactions</span>
              </div>

              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-xs text-warmwhite font-medium block">Cards / Netbanking</span>
                <span className="text-xl font-serif font-bold text-emerald-400 block mt-1">
                  {paymentsData?.paymentMethodDistribution.online ?? 0}
                </span>
                <span className="text-[10px] text-beige-muted">Online gateway checkout</span>
              </div>

              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-xs text-warmwhite font-medium block">Cash on Counter / COD</span>
                <span className="text-xl font-serif font-bold text-amber-400 block mt-1">
                  {paymentsData?.paymentMethodDistribution.cod ?? 0}
                </span>
                <span className="text-[10px] text-beige-muted">Physical dining collection</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 6: GST TAX SUMMARY & ACCOUNTING EXPORTS                          */}
      {/* ===================================================================== */}
      {activeTab === 'tax' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-charcoal-card border border-gold/30 shadow-md space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
                  <Receipt className="w-5 h-5 text-gold" />
                  <span>GST Tax Summary (GSTR-1 / GSTR-3B)</span>
                </h3>
                <p className="text-xs text-beige-muted mt-0.5">
                  Period: <span className="text-gold font-mono">{taxReport?.period || mapPresetToReportPeriod(preset)}</span> •{' '}
                  {taxReport?.paidOrdersCount ?? 0} paid orders included
                </p>
              </div>
              {reportsStatus && (
                <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-600/40 text-emerald-300 text-[11px] font-semibold">
                  Reports Engine: {reportsStatus.status} ({reportsStatus.database})
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Gross Sales</span>
                <span className="font-serif text-xl font-bold text-warmwhite mt-1 block">
                  ₹{(taxReport?.grossSales ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-amber-300 uppercase tracking-wider block">Discounts / Exempt</span>
                <span className="font-serif text-xl font-bold text-amber-300 mt-1 block">
                  ₹{(taxReport?.exemptOrDiscount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-beige-muted uppercase tracking-wider block">Taxable Value</span>
                <span className="font-serif text-xl font-bold text-warmwhite mt-1 block">
                  ₹{(taxReport?.taxableSales ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-sky-300 uppercase tracking-wider block">CGST (2.5%)</span>
                <span className="font-serif text-xl font-bold text-sky-300 mt-1 block">
                  ₹{(taxReport?.cgstAmount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-charcoal border border-charcoal-border">
                <span className="text-[10px] text-sky-300 uppercase tracking-wider block">SGST (2.5%)</span>
                <span className="font-serif text-xl font-bold text-sky-300 mt-1 block">
                  ₹{(taxReport?.sgstAmount ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-charcoal border border-emerald-600/30">
                <span className="text-[10px] text-emerald-300 uppercase tracking-wider block">Total GST (5%)</span>
                <span className="font-serif text-xl font-bold text-emerald-300 mt-1 block">
                  ₹{(taxReport?.totalGst ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md space-y-4">
            <h3 className="font-serif text-lg font-semibold text-warmwhite flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-gold" />
              <span>Accounting &amp; Audit CSV Export Center</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              {(
                [
                  {
                    type: 'orders',
                    title: 'Orders Registry CSV',
                    desc: 'Complete order breakdown, totals, taxes & fulfillment',
                  },
                  {
                    type: 'customers',
                    title: 'Patrons CRM CSV',
                    desc: 'Customer directory with lifetime spend & visit counts',
                  },
                  {
                    type: 'tax',
                    title: 'GST Tax Audit CSV',
                    desc: 'Paid invoices with taxable value, CGST & SGST',
                  },
                  {
                    type: 'menu-performance',
                    title: 'Menu Performance CSV',
                    desc: 'Top-selling dishes, quantities & gross revenue',
                  },
                ] as const
              ).map((item) => (
                <div
                  key={item.type}
                  className="p-4 rounded-2xl bg-charcoal border border-charcoal-border flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="font-semibold text-warmwhite text-sm">{item.title}</div>
                    <p className="text-[11px] text-beige-muted mt-1">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    disabled={downloadingCsv === item.type}
                    onClick={() => handleDownloadCsv(item.type)}
                    className="w-full py-2 px-3 rounded-xl bg-charcoal-card border border-gold/40 hover:border-gold text-gold font-semibold flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloadingCsv === item.type ? 'Exporting...' : 'Download CSV'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
