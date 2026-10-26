import { ApiClient } from '../../../services/apiClient';
import { Customer, Order } from '../../../types';

export interface CustomersQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
}

export const customersService = {
  getAll: async (params?: CustomersQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    return ApiClient.get<{ success: boolean; customers: Customer[]; total: number; page: number; totalPages: number }>(
      `/admin/customers?${query.toString()}`
    );
  },

  getById: async (id: string) => {
    return ApiClient.get<{ success: boolean; customer: Customer; orders: Order[] }>(`/admin/customers/${id}`);
  },
};
