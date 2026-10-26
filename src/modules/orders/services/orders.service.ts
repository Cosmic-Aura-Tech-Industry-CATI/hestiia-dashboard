import { ApiClient } from '../../../services/apiClient';
import { Order, Payment, Invoice } from '../../../types';

export interface OrdersQueryParams {
  search?: string;
  orderStatus?: string;
  paymentStatus?: string;
  fulfillmentType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const ordersService = {
  getAll: async (params?: OrdersQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.orderStatus) query.set('orderStatus', params.orderStatus);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.fulfillmentType) query.set('fulfillmentType', params.fulfillmentType);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; orders: Order[]; total: number; page: number; totalPages: number }>(
      `/admin/orders/admin/all?${query.toString()}`
    );
  },

  getById: async (id: string) => {
    return ApiClient.get<{ success: boolean; order: Order; payment?: Payment; invoice?: Invoice }>(
      `/admin/orders/admin/${id}`
    );
  },

  updateStatus: async (id: string, status: string, note?: string) => {
    return ApiClient.patch<{ success: boolean; order: Order; message: string }>(
      `/admin/orders/admin/${id}/status`,
      { status, note }
    );
  },

  updatePayment: async (id: string, paymentStatus: string, collectedBy?: string) => {
    return ApiClient.patch<{ success: boolean; order: Order; message: string }>(
      `/admin/orders/admin/${id}/payment`,
      { paymentStatus, collectedBy }
    );
  },
};
