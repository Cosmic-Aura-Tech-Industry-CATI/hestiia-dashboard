import {
  AdminUser,
  FoodCategory,
  FoodItem,
  Order,
  Customer,
  Payment,
  Invoice,
  TableBooking,
  PartyInquiry,
  Promotion,
  GalleryPhoto,
  ReviewItem,
  RestaurantSettings,
} from '../types';
import { ApiClient, ApiError } from './apiClient';

export { ApiError, ApiClient };

export const adminApi = {
  // Auth
  login: async (credentials: { username: string; password: string }) => {
    return ApiClient.post<{ success: boolean; token: string; user: AdminUser; message: string }>('/admin/auth/login', credentials);
  },
  getMe: async () => {
    return ApiClient.get<{ success: boolean; user: AdminUser }>('/admin/auth/me');
  },
  logout: async () => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/auth/logout');
  },
  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/auth/change-password', passwords);
  },
  getUsers: async () => {
    return ApiClient.get<{ success: boolean; users: AdminUser[] }>('/admin/auth/users');
  },
  createUser: async (userData: any) => {
    return ApiClient.post<{ success: boolean; user: AdminUser; message: string }>('/admin/auth/users', userData);
  },

  // Dashboard Overview
  getDashboardOverview: async () => {
    return ApiClient.get<{
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
    }>('/admin/dashboard/overview');
  },

  // Food Menu
  getAllDishes: async (params?: { category?: string; available?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.available) query.set('available', params.available);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    query.set('limit', String(params?.limit || 500));
    return ApiClient.get<{ success: boolean; dishes: FoodItem[]; total: number; page: number; totalPages: number }>(
      `/admin/menu/admin/all?${query.toString()}`
    );
  },
  createDish: async (dish: Partial<FoodItem>) => {
    return ApiClient.post<{ success: boolean; dish: FoodItem; message: string }>('/admin/menu/admin', dish);
  },
  updateDish: async (id: string, updates: Partial<FoodItem>) => {
    return ApiClient.put<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}`, updates);
  },
  toggleDishAvailability: async (id: string, available?: boolean) => {
    return ApiClient.patch<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}/availability`, { available });
  },
  deleteDish: async (id: string) => {
    return ApiClient.delete<{ success: boolean; archived?: boolean; message: string }>(`/admin/menu/admin/${id}`);
  },

  // Categories
  getAllCategories: async () => {
    return ApiClient.get<{ success: boolean; categories: FoodCategory[] }>('/admin/categories/admin/all');
  },
  createCategory: async (category: Partial<FoodCategory>) => {
    return ApiClient.post<{ success: boolean; category: FoodCategory; message: string }>('/admin/categories/admin', category);
  },
  updateCategory: async (id: string, updates: Partial<FoodCategory>) => {
    return ApiClient.put<{ success: boolean; category: FoodCategory; message: string }>(`/admin/categories/admin/${id}`, updates);
  },
  deleteCategory: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/categories/admin/${id}`);
  },

  // Orders
  getOrders: async (params?: {
    search?: string;
    orderStatus?: string;
    paymentStatus?: string;
    fulfillmentType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
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
  getOrderDetails: async (id: string) => {
    return ApiClient.get<{ success: boolean; order: Order; payment?: Payment; invoice?: Invoice }>(`/admin/orders/admin/${id}`);
  },
  updateOrderStatus: async (id: string, status: string, note?: string) => {
    return ApiClient.patch<{ success: boolean; order: Order; message: string }>(`/admin/orders/admin/${id}/status`, { status, note });
  },
  updateOrderPayment: async (id: string, paymentStatus: string, collectedBy?: string) => {
    return ApiClient.patch<{ success: boolean; order: Order; message: string }>(`/admin/orders/admin/${id}/payment`, { paymentStatus, collectedBy });
  },

  // Customers
  getCustomers: async (params?: { search?: string; page?: number; limit?: number; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    return ApiClient.get<{ success: boolean; customers: Customer[]; total: number; page: number; totalPages: number }>(
      `/admin/customers?${query.toString()}`
    );
  },
  getCustomerDetails: async (id: string) => {
    return ApiClient.get<{ success: boolean; customer: Customer; orders: Order[] }>(`/admin/customers/${id}`);
  },

  // Payments & Invoices
  getPayments: async (params?: { search?: string; paymentStatus?: string; paymentMethod?: string; page?: number; limit?: number }) => {
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
  recordPaymentCollection: async (payload: { paymentId?: string; orderNumber: string; collectedBy?: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/payments/record-collection', payload);
  },
  getInvoices: async (params?: { search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return ApiClient.get<{ success: boolean; invoices: Invoice[]; total: number; page: number; totalPages: number }>(
      `/admin/invoices?${query.toString()}`
    );
  },
  getInvoiceDetails: async (identifier: string) => {
    return ApiClient.get<{ success: boolean; invoice: Invoice; restaurant: RestaurantSettings }>(`/admin/invoices/${identifier}`);
  },

  // Table Bookings
  getBookings: async (params?: { search?: string; status?: string; date?: string; page?: number; limit?: number }) => {
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
  updateBookingStatus: async (
    id: string,
    statusOrPayload: string | { status?: string; staffNotes?: string; allocatedTable?: string; confirmationMethod?: 'on-screen' | 'whatsapp' | 'call' },
    staffNotes?: string
  ) => {
    const body = typeof statusOrPayload === 'string'
      ? { status: statusOrPayload, staffNotes }
      : statusOrPayload;
    return ApiClient.patch<{ success: boolean; booking: TableBooking; message: string }>(`/admin/bookings/admin/${id}/status`, body);
  },

  // Party & Event Inquiries
  getPartyInquiries: async (params?: { search?: string; status?: string; eventType?: string; page?: number; limit?: number }) => {
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
  updatePartyStatus: async (id: string, status: string, staffNotes?: string, followUpDate?: string) => {
    return ApiClient.patch<{ success: boolean; inquiry: PartyInquiry; message: string }>(`/admin/party-inquiries/admin/${id}/status`, {
      status,
      staffNotes,
      followUpDate,
    });
  },

  // Promotions & Offers
  getPromotions: async () => {
    return ApiClient.get<{ success: boolean; promotions: Promotion[] }>('/admin/promotions/admin/all');
  },
  createPromotion: async (promo: Partial<Promotion>) => {
    return ApiClient.post<{ success: boolean; promotion: Promotion; message: string }>('/admin/promotions/admin', promo);
  },
  updatePromotion: async (id: string, updates: Partial<Promotion>) => {
    return ApiClient.put<{ success: boolean; promotion: Promotion; message: string }>(`/admin/promotions/admin/${id}`, updates);
  },
  deletePromotion: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/promotions/admin/${id}`);
  },

  // Ambience Gallery
  getGallery: async () => {
    return ApiClient.get<{ success: boolean; gallery: GalleryPhoto[] }>('/admin/gallery/admin/all');
  },
  addGalleryPhoto: async (photo: Partial<GalleryPhoto>) => {
    return ApiClient.post<{ success: boolean; photo: GalleryPhoto; message: string }>('/admin/gallery/admin', photo);
  },
  updateGalleryPhoto: async (id: string, updates: Partial<GalleryPhoto>) => {
    return ApiClient.put<{ success: boolean; photo: GalleryPhoto; message: string }>(`/admin/gallery/admin/${id}`, updates);
  },
  deleteGalleryPhoto: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/gallery/admin/${id}`);
  },

  // Reviews & Feedback
  getReviews: async (params?: { status?: string; rating?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.rating) query.set('rating', params.rating);
    if (params?.search) query.set('search', params.search);
    return ApiClient.get<{ success: boolean; reviews: ReviewItem[] }>(`/admin/reviews/admin/all?${query.toString()}`);
  },
  toggleReviewApproval: async (id: string, isApproved?: boolean) => {
    return ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(`/admin/reviews/admin/${id}/approve`, { isApproved });
  },
  replyReview: async (id: string, staffReply: string) => {
    return ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(`/admin/reviews/admin/${id}/reply`, { staffReply });
  },
  deleteReview: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/reviews/admin/${id}`);
  },

  // Restaurant Settings
  getSettings: async () => {
    return ApiClient.get<{ success: boolean; settings: RestaurantSettings }>('/admin/settings/admin');
  },
  updateSettings: async (settings: Partial<RestaurantSettings>) => {
    return ApiClient.put<{ success: boolean; settings: RestaurantSettings; message: string }>('/admin/settings/admin', settings);
  },

  // Reports
  getAnalyticsReport: async (period: '7days' | '30days' | '90days' = '30days') => {
    return ApiClient.get<{
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
    }>(`/admin/reports/analytics?period=${period}`);
  },

  // Image Upload
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return ApiClient.post<{ success: boolean; url: string; filename: string; message: string }>('/admin/upload', formData);
  },
};
