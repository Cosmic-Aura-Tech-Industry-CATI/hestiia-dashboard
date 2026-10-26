import { ApiClient } from '../../../services/apiClient';
import { TableBooking } from '../../../types';

export interface BookingsQueryParams {
  search?: string;
  status?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export const bookingsService = {
  getAll: async (params?: BookingsQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.date) query.set('date', params.date);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; bookings: TableBooking[]; total: number; page: number; totalPages: number }>(
      `/admin/bookings/admin/all?${query.toString()}`
    );
  },

  updateStatus: async (id: string, status: string, staffNotes?: string) => {
    return ApiClient.patch<{ success: boolean; booking: TableBooking; message: string }>(
      `/admin/bookings/admin/${id}/status`,
      { status, staffNotes }
    );
  },
};
