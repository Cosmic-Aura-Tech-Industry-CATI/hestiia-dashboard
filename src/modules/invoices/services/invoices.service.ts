import { ApiClient } from '../../../services/apiClient';
import { Invoice, RestaurantSettings } from '../../../types';

export interface InvoicesQueryParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const invoicesService = {
  getAll: async (params?: InvoicesQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; invoices: Invoice[]; total: number; page: number; totalPages: number }>(
      `/admin/invoices?${query.toString()}`
    );
  },

  getByIdentifier: async (identifier: string) => {
    return ApiClient.get<{ success: boolean; invoice: Invoice; restaurant: RestaurantSettings }>(
      `/admin/invoices/${identifier}`
    );
  },
};
