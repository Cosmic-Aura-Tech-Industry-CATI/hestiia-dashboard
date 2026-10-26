import { ApiClient } from '../../../services/apiClient';
import { Payment } from '../../../types';

export interface PaymentsQueryParams {
  search?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  page?: number;
  limit?: number;
}

export const paymentsService = {
  getAll: async (params?: PaymentsQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params?.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; payments: Payment[]; total: number; page: number; totalPages: number }>(
      `/admin/payments?${query.toString()}`
    );
  },

  recordCollection: async (payload: { paymentId?: string; orderNumber: string; collectedBy?: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/payments/record-collection', payload);
  },
};
