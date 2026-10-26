import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  Flame,
  CheckCircle2,
  TrendingUp,
  Users,
  CalendarCheck,
  PartyPopper,
  AlertCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminApi } from '../services/adminApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState } from '../components/common/LoadingState';

export const DashboardOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminApi.getDashboardOverview();
      if (res.success) {
        setData(res);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load restaurant dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (isLoading) {
    return <LoadingState message="Aggregating live restaurant analytics..." />;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-charcoal-card border border-rose-600/30 rounded-2xl">
        <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h3 className="font-serif text-lg text-warmwhite font-semibold">Unable to load dashboard metrics</h3>
        <p className="text-xs text-beige max-w-md mx-auto my-2">{error}</p>
        <button
          onClick={fetchOverview}
          className="mt-3 px-4 py-2 bg-gold text-charcoal-950 rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { metrics, salesTrend, statusDistribution, popularItems, recentOrders, recentBookings, recentParties } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-charcoal-card via-espresso-light/60 to-charcoal-card border border-gold/30 shadow-2xl">
        <div>
          <div className="inline-flex items-center space-x-2 text-gold text-[11px] font-semibold tracking-wider uppercase mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Console — PAC Road, Shyam Nagar</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            Hestiia Restaurant Management
          </h1>
          <p className="text-xs text-beige mt-1">
            Real-time control over kitchen orders, dining inquiries, online billing and digital menu.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 flex-wrap">
          <Link
            to="/admin/menu"
            className="px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-dark text-charcoal-950 font-bold text-xs uppercase tracking-wider shadow-gold-sm flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Dishes</span>
          </Link>
          <Link
            to="/admin/orders?orderStatus=pending"
            className="px-4 py-2.5 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold text-warmwhite text-xs font-semibold flex items-center space-x-1.5 transition-all"
          >
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Pending Orders ({metrics.pendingOrdersCount})</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Today's Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Today's Orders</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {metrics.todayOrdersCount}
          </div>
          <div className="text-[11px] text-beige-muted mt-1">Orders placed today</div>
        </div>

        {/* Card 2: Pending Orders */}
        <Link
          to="/admin/orders?orderStatus=pending"
          className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-amber-600/30 hover:border-amber-500/60 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-medium text-amber-300">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-600/30 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-amber-300">
            {metrics.pendingOrdersCount}
          </div>
          <div className="text-[11px] text-amber-400/80 mt-1 flex items-center space-x-1">
            <span>Awaiting kitchen accept</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: Active Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Active Kitchen</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-purple-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-purple-300">
            {metrics.activeOrdersCount}
          </div>
          <div className="text-[11px] text-beige-muted mt-1">Preparing or out for delivery</div>
        </div>

        {/* Card 4: Verified Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-emerald-600/30 hover:border-emerald-500/60 transition-all shadow-sm">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-medium text-emerald-300">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-600/30 text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-emerald-300">
            ₹{metrics.todayRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Verified payments only</div>
        </div>

        {/* Card 5: Total Customers */}
        <Link
          to="/admin/customers"
          className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm"
        >
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Customers</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {metrics.totalCustomers}
          </div>
          <div className="text-[11px] text-beige-muted mt-1">Unique dining patrons</div>
        </Link>

        {/* Card 6: Completed Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm">
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Completed Orders</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {metrics.completedOrdersCount}
          </div>
          <div className="text-[11px] text-beige-muted mt-1">Delivered or served</div>
        </div>

        {/* Card 7: Pending Table Bookings */}
        <Link
          to="/admin/bookings"
          className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Table Inquiries</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {metrics.pendingBookingsCount}
          </div>
          <div className="text-[11px] text-gold mt-1 flex items-center space-x-1">
            <span>Pending confirmation</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 8: Pending Party Inquiries */}
        <Link
          to="/admin/party-inquiries"
          className="p-4 sm:p-5 rounded-2xl bg-charcoal-card border border-charcoal-border hover:border-gold/30 transition-all shadow-sm group"
        >
          <div className="flex items-center justify-between text-beige-muted mb-2">
            <span className="text-xs font-medium text-beige">Party & Banquets</span>
            <div className="p-2 rounded-xl bg-charcoal border border-charcoal-border text-gold">
              <PartyPopper className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl sm:text-3xl font-bold text-warmwhite">
            {metrics.pendingPartiesCount}
          </div>
          <div className="text-[11px] text-gold mt-1 flex items-center space-x-1">
            <span>Pending coordinator</span>
            <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Unavailable Dishes Alert Banner if any dish is 86'd */}
      {metrics.unavailableDishesCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <span>
              <strong>{metrics.unavailableDishesCount} dish(es)</strong> are currently marked as unavailable / 86'd on the digital menu.
            </span>
          </div>
          <Link
            to="/admin/menu?available=false"
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold border border-amber-500/40 transition-colors"
          >
            Review Dishes
          </Link>
        </div>
      )}

      {/* Visual Charts: Sales Trend & Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Sales Trend Area Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-warmwhite">7-Day Sales & Volume Trend</h3>
              <p className="text-xs text-beige">Daily verified order revenue (INR)</p>
            </div>
            <Link
              to="/admin/reports"
              className="text-xs text-gold hover:text-gold-light flex items-center space-x-1 font-medium"
            >
              <span>Full Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D6A45B" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#D6A45B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#8D8173" fontSize={11} tickLine={false} />
                <YAxis stroke="#8D8173" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#191715', borderColor: '#D6A45B', borderRadius: '12px', fontSize: '12px' }}
                  labelStyle={{ color: '#F7F1E8', fontWeight: 'bold' }}
                  itemStyle={{ color: '#D6A45B' }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#D6A45B"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#goldGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Order Status Distribution Pie Chart */}
        <div className="p-5 sm:p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-warmwhite">Order Status Mix</h3>
            <p className="text-xs text-beige mb-3">Live distribution across active queue</p>
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {statusDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#191715', borderColor: '#2C2621', borderRadius: '12px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-charcoal-border/80 text-[11px]">
            {statusDistribution.map((item: any) => (
              <div key={item.name} className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-beige truncate">{item.name}:</span>
                <span className="text-warmwhite font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dual Section: Recent Orders & Popular Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-warmwhite">Recent Dining & Delivery Orders</h3>
              <p className="text-xs text-beige">Latest transactions from customer portal</p>
            </div>
            <Link
              to="/admin/orders"
              className="text-xs text-gold hover:text-gold-light flex items-center space-x-1 font-medium"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-charcoal-border text-beige-muted uppercase tracking-wider text-[10px]">
                  <th className="pb-3 font-medium">Order #</th>
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-border/50">
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-charcoal/60 transition-colors">
                    <td className="py-3 font-semibold text-warmwhite">
                      <Link to={`/admin/orders/${order.id}`} className="hover:text-gold transition-colors">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3">
                      <div className="text-warmwhite font-medium">{order.customerName}</div>
                      <div className="text-[10px] text-beige-muted">{order.customerPhone}</div>
                    </td>
                    <td className="py-3 text-beige max-w-[160px] truncate">
                      {order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 font-serif font-bold text-warmwhite">
                      ₹{order.grandTotal}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={order.orderStatus} type="order" />
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="px-2.5 py-1 rounded-lg bg-charcoal border border-charcoal-border hover:border-gold/40 text-[11px] text-gold font-medium transition-all"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Dishes Leaderboard (1 Col) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-charcoal-card border border-charcoal-border shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg font-semibold text-warmwhite">Top Selling Delicacies</h3>
                <p className="text-xs text-beige">Ranked by volume ordered</p>
              </div>
              <Link to="/admin/menu" className="text-xs text-gold hover:text-gold-light font-medium">
                Menu
              </Link>
            </div>

            <div className="space-y-3">
              {popularItems.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center space-x-3 p-2.5 rounded-2xl bg-charcoal/60 border border-charcoal-border hover:border-gold/20 transition-all"
                >
                  <span className="w-6 h-6 rounded-full bg-charcoal border border-charcoal-border text-gold font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-charcoal flex-shrink-0 border border-charcoal-border">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-warmwhite truncate">{item.name}</div>
                    <div className="text-[10px] text-beige-muted">{item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-gold">{item.quantity} sold</div>
                    <div className="text-[10px] text-beige-muted">₹{item.revenue}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-charcoal-border/80">
            <Link
              to="/admin/reports"
              className="w-full py-2 px-3 rounded-xl bg-charcoal border border-charcoal-border hover:border-gold/30 text-beige hover:text-warmwhite text-xs font-medium flex items-center justify-center space-x-1 transition-all"
            >
              <span>Download Sales Spreadsheets</span>
              <ExternalLink className="w-3.5 h-3.5 text-gold" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
