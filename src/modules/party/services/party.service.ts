import { ApiClient } from '../../../services/apiClient';
import { PartyInquiry } from '../../../types';

export interface PartyQueryParams {
  search?: string;
  status?: string;
  eventType?: string;
  page?: number;
  limit?: number;
}

export const partyService = {
  getAll: async (params?: PartyQueryParams) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.eventType) query.set('eventType', params.eventType);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; inquiries: PartyInquiry[]; total: number; page: number; totalPages: number }>(
      `/admin/party-inquiries/admin/all?${query.toString()}`
    );
  },

  updateStatus: async (id: string, status: string, staffNotes?: string, followUpDate?: string) => {
    return ApiClient.patch<{ success: boolean; inquiry: PartyInquiry; message: string }>(
      `/admin/party-inquiries/admin/${id}/status`,
      { status, staffNotes, followUpDate }
    );
  },
};
