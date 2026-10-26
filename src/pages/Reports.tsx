import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  CreditCard,
  Truck,
  Users,
  ShoppingBag,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { PageHeader } from '../components/common/PageHeader';
import { LoadingState } from '../components/common/LoadingState';
import { useToast } from '../components/common/ToastContext';

export const Reports: React.FC = () => {
  const [period, setPeriod] = useState<'7days' | '30days' | '90days'>('30days');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { error, success } = useToast();

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await adminApi.getAnalyticsReport(period);
      if (res.success) {
        setReport(res);
      }
    } catch (err: any) {
      error(err.message || 'Failed to generate analytical report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [period]);

  const handleDownloadCsv = (type: 'orders' | 'customers') => {
    const token = localStorage.getItem('hestiia_admin_token') || '';
    const url = `/api/admin/reports/export/${type}.csv`;
    
    // Fetch with auth header and trigger browser download
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `hestiia_${type}_export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        success(`${type.toUpperCase()} spreadsheet downloaded successfully.`);
      })
      .catch(() => error('Failed to download CSV export.'));
  };

  if (isLoading || !report) {
    return <LoadingState message="Compiling verified restaurant financial report..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Restaurant Intelligence & Reports"
        subtitle="Audited operational metrics, revenue breakdowns, sales taxes, and certified CSV exports"
        action={
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleDownloadCsv('orders')}
              className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export Orders CSV</span>
            </button>
            <button
              onClick={() => handleDownloadCsv('customers')}
              className="px-3.5 py-2 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-gold text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Users className="w-4 h-4" />
              <span>Export Patrons CSV</span>
            </button>
          </div>
        }
      />

      {/* Period Selection Controls */}
      <div className="flex border-b border-charcoal-border">
        {(['7days', '30days', '90days'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`py-3 px-5 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
              period === p
                ? 'border-gold text-gold bg-gold/5'
                : 'border-transparent text-beige hover:text-warmwhite'
            }`}
          >
            {p === '7days' ? 'Last 7 Days' : p === '30days' ? 'Last 30 Days' : 'Last 90 Days'}
          </button>
        ))}
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-charcoal-card border border-emerald-600/30">
          <span className="text-xs text-emerald-400 font-medium">Total Verified Revenue</span>
          <div className="font-serif text-3xl font-bold text-emerald-300 mt-1">
            ₹{report.totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-emerald-400/80">Net paid collections</span>
        </div>

        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
          <span className="text-xs text-beige font-medium">Order Count</span>
          <div className="font-serif text-3xl font-bold text-warmwhite mt-1">
            {report.totalOrders}
          </div>
          <span className="text-[10px] text-beige-muted">Total orders placed in period</span>
        </div>

        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
          <span className="text-xs text-beige font-medium">Average Order Value (AOV)</span>
          <div className="font-serif text-3xl font-bold text-gold mt-1">
            ₹{report.averageOrderValue}
          </div>
          <span className="text-[10px] text-beige-muted">Per paid dining order</span>
        </div>

        <div className="p-5 rounded-3xl bg-charcoal-card border border-charcoal-border">
          <span className="text-xs text-beige font-medium">5% GST Collected</span>
          <div className="font-serif text-3xl font-bold text-warmwhite mt-1">
            ₹{report.totalTax.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-beige-muted">Audited tax liability</span>
        </div>
      </div>

      {/* Dual Section: Fulfillment & Channel Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fulfillment Channels */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
            <Truck className="w-5 h-5 text-gold" />
            <span>Fulfillment Channel Breakdown</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">Home Delivery</span>
              <span className="font-bold text-gold">{report.fulfillmentBreakdown.delivery} orders</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">Dine-In Table</span>
              <span className="font-bold text-gold">{report.fulfillmentBreakdown.dineIn} orders</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">Self-Pickup Counter</span>
              <span className="font-bold text-gold">{report.fulfillmentBreakdown.pickup} orders</span>
            </div>
          </div>
        </div>

        {/* Payment Channels */}
        <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-gold" />
            <span>Payment Method Distribution</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">Online Gateway (Razorpay/Cards)</span>
              <span className="font-bold text-emerald-400">{report.paymentBreakdown.online} orders</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">UPI QR Instant Pay</span>
              <span className="font-bold text-emerald-400">{report.paymentBreakdown.upi} orders</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-charcoal border border-charcoal-border">
              <span className="text-warmwhite font-medium">Cash on Delivery / Counter (COD)</span>
              <span className="font-bold text-amber-400">{report.paymentBreakdown.cod} orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling Food Items */}
      <div className="p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
        <h3 className="font-serif text-lg font-semibold text-warmwhite mb-4 flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-gold" />
          <span>Top Performing Dishes in Selected Period</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-charcoal-border bg-charcoal/60 text-beige-muted uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Rank</th>
                <th className="py-3 px-4 font-semibold">Dish Name</th>
                <th className="py-3 px-4 font-semibold">Quantity Sold</th>
                <th className="py-3 px-4 font-semibold text-right">Gross Sales Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-border/60">
              {report.topDishes.map((dish: any, idx: number) => (
                <tr key={idx} className="hover:bg-charcoal/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-gold">#{idx + 1}</td>
                  <td className="py-3 px-4 font-serif font-bold text-warmwhite text-sm">{dish.name}</td>
                  <td className="py-3 px-4 text-warmwhite font-semibold">{dish.quantity} servings</td>
                  <td className="py-3 px-4 font-serif font-bold text-warmwhite text-sm text-right">
                    ₹{dish.revenue.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
