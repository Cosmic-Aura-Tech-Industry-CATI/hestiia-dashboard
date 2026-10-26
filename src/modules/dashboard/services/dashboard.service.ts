import { ApiClient } from '../../../services/apiClient';
import { Order, TableBooking, PartyInquiry } from '../../../types';

export interface DashboardOverviewResponse {
  success: boolean;
  metrics: {
    todayOrdersCount: number;
    pendingOrdersCount: number;
    activeOrdersCount: number;
    completedOrdersCount: number;
    todayRevenue: number;
    totalVerifiedRevenue: number;
    totalCustomers: number;
    totalDishesCount: number;
    unavailableDishesCount: number;
    pendingBookingsCount: number;
    pendingPartiesCount: number;
  };
  salesTrend: Array<{ date: string; revenue: number; orders: number }>;
  statusDistribution: Array<{ name: string; count: number; color: string }>;
  popularItems: Array<{ name: string; category: string; quantity: number; revenue: number; image?: string }>;
  recentOrders: Order[];
  recentBookings: TableBooking[];
  recentParties: PartyInquiry[];
  settings: {
    currencySymbol: string;
    timezone: string;
    orderAcceptance: boolean;
  };
}

export const dashboardService = {
  getOverview: async () => {
    return ApiClient.get<DashboardOverviewResponse>('/admin/dashboard/overview');
  },
};
