import { ApiClient } from '../../../services/apiClient';

export interface AnalyticsReportResponse {
  success: boolean;
  period: string;
  totalOrders: number;
  paidOrdersCount: number;
  totalRevenue: number;
  totalTax: number;
  totalDeliveryFee: number;
  averageOrderValue: number;
  fulfillmentBreakdown: { delivery: number; dineIn: number; pickup: number };
  paymentBreakdown: { online: number; upi: number; cod: number };
  topDishes: Array<{ name: string; quantity: number; revenue: number }>;
}

export const reportsService = {
  getAnalytics: async (period: '7days' | '30days' | '90days' = '30days') => {
    return ApiClient.get<AnalyticsReportResponse>(`/admin/reports/analytics?period=${period}`);
  },
};
