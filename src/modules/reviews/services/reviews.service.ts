import { ApiClient } from '../../../services/apiClient';
import { ReviewItem } from '../../../types';

export interface ReviewsQueryParams {
  status?: string;
  rating?: string;
  search?: string;
}

export const reviewsService = {
  getAll: async (params?: ReviewsQueryParams) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.rating) query.set('rating', params.rating);
    if (params?.search) query.set('search', params.search);
    return ApiClient.get<{ success: boolean; reviews: ReviewItem[] }>(`/admin/reviews/admin/all?${query.toString()}`);
  },

  toggleApproval: async (id: string, isApproved?: boolean) => {
    return ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(
      `/admin/reviews/admin/${id}/approve`,
      { isApproved }
    );
  },

  reply: async (id: string, staffReply: string) => {
    return ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(
      `/admin/reviews/admin/${id}/reply`,
      { staffReply }
    );
  },

  delete: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/reviews/admin/${id}`);
  },
};
