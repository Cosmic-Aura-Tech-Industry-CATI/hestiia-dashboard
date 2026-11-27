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
  GalleryMedia,
  GallerySection,
  MediaModerationRecord,
  PublicationStatus,
  ReviewItem,
  RestaurantSettings,
  DateFilterQuery,
  ResolvedDateRange,
  OverviewMetrics,
  RevenueAnalytics,
  OrderAnalytics,
  ProductPerformanceAnalytics,
  CustomerAnalytics,
  PaymentAnalytics,
  LiveDashboardData,
  AuditLogEntry,
  AuditStats,
  AuditLogQuery,
  Offer,
  OfferCounts,
  OfferValidationResult,
  ProcessedUploadResult,
  MultipleUploadResult,
  UploadStorageStats,
  DeleteUploadResult,
  TaxReportResponse,
  ReportsModuleStatus,
  NotificationItem,
  CreateNotificationDTO,
  NotificationQuery,
  NotificationRecipientType,
} from '../types';
import { ApiClient, ApiError, getAuthToken } from './apiClient';

export { ApiError, ApiClient };

function buildQueryString(query?: Record<string, any>): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const adminApi = {
  // Auth (Unified Admin & Staff Portal)
  login: async (credentials: { username?: string; email?: string; identifier?: string; password: string }) => {
    return ApiClient.post<{
      success: boolean;
      requireOtp?: boolean;
      otpSessionId?: string;
      email?: string;
      maskedEmail?: string;
      expiresInSeconds?: number;
      resendCooldownSeconds?: number;
      devOtp?: string;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      user?: AdminUser;
      message: string;
    }>('/auth/login', credentials);
  },
  verifyOtp: async (data: { email?: string; otpSessionId?: string; otp: string }) => {
    return ApiClient.post<{
      success: boolean;
      token?: string;
      accessToken?: string;
      refreshToken?: string;
      user: AdminUser;
      message: string;
    }>('/auth/verify-otp', data);
  },
  resendOtp: async (data: { email?: string; username?: string; otpSessionId?: string }) => {
    return ApiClient.post<{
      success: boolean;
      email?: string;
      maskedEmail?: string;
      resendCooldownSeconds?: number;
      expiresInSeconds?: number;
      devOtp?: string;
      message: string;
    }>('/auth/resend-otp', data);
  },
  refreshToken: async (data?: { refreshToken?: string }) => {
    return ApiClient.post<{
      success: boolean;
      token: string;
      accessToken: string;
      refreshToken: string;
      user: AdminUser;
    }>('/auth/refresh', data);
  },
  forgotPassword: async (data: { email?: string; username?: string; emailOrUsername?: string }) => {
    return ApiClient.post<{
      success: boolean;
      email?: string;
      resetSessionId?: string;
      maskedEmail?: string;
      expiresInSeconds?: number;
      devOtp?: string;
      message: string;
    }>('/auth/forgot-password', data);
  },
  resetPassword: async (data: { email: string; otp: string; newPassword: string; resetSessionId?: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/auth/reset-password', data);
  },
  getMe: async () => {
    return ApiClient.get<{ success: boolean; user: AdminUser }>('/auth/me');
  },
  logout: async () => {
    return ApiClient.post<{ success: boolean; message: string }>('/auth/logout');
  },
  changePassword: async (passwords: { currentPassword: string; newPassword: string }) => {
    return ApiClient.post<{ success: boolean; message: string }>('/admin/auth/change-password', passwords);
  },
  getUsers: async (query?: { page?: number; limit?: number; role?: string; status?: string }) => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.role) params.append('role', query.role);
    if (query?.status) params.append('status', query.status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return ApiClient.get<{
      success: boolean;
      users: AdminUser[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    }>(`/admin/auth/users${qs}`);
  },
  getUserById: async (id: string) => {
    return ApiClient.get<{ success: boolean; user: AdminUser }>(`/admin/auth/users/${id}`);
  },
  createUser: async (userData: {
    name: string;
    email: string;
    username?: string;
    password: string;
    role: 'ADMIN' | 'STAFF' | string;
    status?: 'ACTIVE' | 'INACTIVE';
  }) => {
    const roleToSend = userData.role?.toUpperCase() === 'STAFF' ? 'STAFF' : 'ADMIN';
    return ApiClient.post<{ success: boolean; user: AdminUser; message: string }>('/admin/auth/users', {
      ...userData,
      role: roleToSend,
    });
  },
  updateUser: async (id: string, userData: { name?: string; email?: string }) => {
    return ApiClient.patch<{ success: boolean; user: AdminUser; message: string }>(`/admin/auth/users/${id}`, userData);
  },
  updateUserRole: async (id: string, role: 'ADMIN' | 'STAFF' | string) => {
    const roleToSend = role?.toUpperCase() === 'STAFF' ? 'STAFF' : 'ADMIN';
    return ApiClient.patch<{ success: boolean; user: AdminUser; message: string }>(`/admin/auth/users/${id}/role`, { role: roleToSend });
  },
  updateUserStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE') => {
    return ApiClient.patch<{ success: boolean; user: AdminUser; message: string }>(`/admin/auth/users/${id}/status`, { status });
  },
  deleteUser: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/auth/users/${id}`);
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
  getLiveOrders: async () => {
    return ApiClient.get<{ success: boolean; count: number; liveOrders: Order[] }>('/admin/dashboard/live');
  },
  getSalesTrend: async (days = 7) => {
    return ApiClient.get<{ success: boolean; days: number; count: number; trend: Array<{ date: string; revenue: number; orders: number }> }>(
      `/admin/dashboard/sales-trend?days=${days}`
    );
  },
  getPopularItems: async (limit = 10) => {
    return ApiClient.get<{ success: boolean; limit: number; count: number; popularItems: any[] }>(
      `/admin/dashboard/popular-items?limit=${limit}`
    );
  },

  // Food Menu
  getAllDishes: async (params?: { category?: string; available?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.available) query.set('available', params.available);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    const res = await ApiClient.get<{ success: boolean; dishes: FoodItem[]; total: number; page: number; totalPages: number }>(
      `/admin/menu/admin${qs ? `?${qs}` : ''}`
    );
    if (res.success && Array.isArray(res.dishes)) {
      res.dishes = res.dishes.map((d) => ({ ...d, id: d.id || (d as any)._id || '' }));
    }
    return res;
  },
  getDishById: async (id: string) => {
    const res = await ApiClient.get<{ success: boolean; dish: FoodItem }>(`/admin/menu/admin/${id}`);
    if (res.dish) {
      res.dish = { ...res.dish, id: res.dish.id || (res.dish as any)._id || id };
    }
    return res;
  },
  createDish: async (dish: Partial<FoodItem>) => {
    const res = await ApiClient.post<{ success: boolean; dish: FoodItem; message: string }>('/admin/menu/admin', dish);
    if (res.dish) {
      res.dish = { ...res.dish, id: res.dish.id || (res.dish as any)._id || '' };
    }
    return res;
  },
  updateDish: async (id: string, updates: Partial<FoodItem>) => {
    const res = await ApiClient.put<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}`, updates);
    if (res.dish) {
      res.dish = { ...res.dish, id: res.dish.id || (res.dish as any)._id || id };
    }
    return res;
  },
  toggleDishAvailability: async (id: string, available?: boolean) => {
    const res = await ApiClient.patch<{ success: boolean; dish: FoodItem; message: string }>(`/admin/menu/admin/${id}/availability`, { available });
    if (res.dish) {
      res.dish = { ...res.dish, id: res.dish.id || (res.dish as any)._id || id };
    }
    return res;
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
  cancelOrder: async (id: string, reason: string) => {
    return ApiClient.post<{ success: boolean; order: Order; message: string }>(`/admin/orders/${id}/cancel`, { reason });
  },
  createOrder: async (orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryAddress?: string;
    fulfillmentType: 'dine-in' | 'pickup' | 'delivery';
    items: Array<{ dishId: string; name: string; price: number; quantity: number }>;
    paymentMethod: 'online' | 'cod' | 'upi';
    notes?: string;
  }) => {
    return ApiClient.post<{ success: boolean; order: Order; invoice?: Invoice; payment?: Payment; message: string }>('/orders', orderData);
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
    const qs = query.toString();
    return ApiClient.get<{ success: boolean; bookings: TableBooking[]; total: number; page: number; totalPages: number }>(
      `/admin/bookings/admin${qs ? `?${qs}` : ''}`
    );
  },
  getBookingById: async (id: string) => {
    return ApiClient.get<{ success: boolean; booking: TableBooking }>(`/admin/bookings/admin/${id}`);
  },
  createBooking: async (data: {
    customerName: string;
    phone: string;
    email?: string;
    date: string;
    time: string;
    guests: string;
    occasion?: string;
    specialRequests?: string;
  }) => {
    return ApiClient.post<{
      success: boolean;
      bookingId: string;
      bookingRef: string;
      booking: TableBooking;
      message: string;
    }>('/bookings', data);
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
  deleteBooking: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string; id?: string; bookingRef?: string }>(`/admin/bookings/admin/${id}`);
  },

  // Party & Event Inquiries
  getPartyInquiries: async (params?: { search?: string; status?: string; eventType?: string; page?: number; limit?: number }) => {
    const qs = buildQueryString(params);
    return ApiClient.get<{ success: boolean; inquiries: PartyInquiry[]; total: number; page: number; totalPages: number }>(
      `/admin/party-inquiries/admin${qs}`
    );
  },
  getPartyInquiryById: async (id: string) => {
    return ApiClient.get<{ success: boolean; inquiry: PartyInquiry }>(`/admin/party-inquiries/admin/${id}`);
  },
  createPartyInquiry: async (data: {
    customerName: string;
    phone: string;
    email?: string;
    eventType: PartyInquiry['eventType'];
    preferredDate: string;
    guestCount: number;
    budgetRange?: string;
    specialRequirements?: string;
  }) => {
    return ApiClient.post<{ success: boolean; inquiryId: string; inquiry: PartyInquiry; message: string }>('/party', data);
  },
  updatePartyStatus: async (id: string, status: string, staffNotes?: string, followUpDate?: string) => {
    return ApiClient.patch<{ success: boolean; inquiry: PartyInquiry; message: string }>(`/admin/party-inquiries/admin/${id}/status`, {
      status,
      staffNotes,
      followUpDate,
    });
  },
  deletePartyInquiry: async (id: string) => {
    return ApiClient.delete<{ success: boolean; id?: string; message: string }>(`/admin/party-inquiries/admin/${id}`);
  },

  // Promotions & Offers
  getPromotions: async () => {
    const res = await ApiClient.get<{ success: boolean; promotions: Promotion[] }>('/admin/promotions/admin/all');
    if (res.success && Array.isArray(res.promotions)) {
      res.promotions = res.promotions.map((p) => ({ ...p, id: p.id || p._id || '' }));
    }
    return res;
  },
  createPromotion: async (promo: Partial<Promotion>) => {
    const res = await ApiClient.post<{ success: boolean; promotion: Promotion; message: string }>('/admin/promotions/admin', promo);
    if (res.promotion) {
      res.promotion = { ...res.promotion, id: res.promotion.id || res.promotion._id || '' };
    }
    return res;
  },
  updatePromotion: async (id: string, updates: Partial<Promotion>) => {
    const res = await ApiClient.put<{ success: boolean; promotion: Promotion; message: string }>(`/admin/promotions/admin/${id}`, updates);
    if (res.promotion) {
      res.promotion = { ...res.promotion, id: res.promotion.id || res.promotion._id || '' };
    }
    return res;
  },
  deletePromotion: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/promotions/admin/${id}`);
  },

  // Offers & Coupon Codes
  getOffers: async (params?: { search?: string; isActive?: string; page?: number; limit?: number }) => {
    const qs = buildQueryString(params);
    const res = await ApiClient.get<{
      success: boolean;
      offers: Offer[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
      counts: OfferCounts;
    }>(`/admin/offers/admin/all${qs}`);
    if (res.success && Array.isArray(res.offers)) {
      res.offers = res.offers.map((o) => ({ ...o, id: o.id || o._id || o.code }));
    }
    return res;
  },
  createOffer: async (offer: Partial<Offer>) => {
    const res = await ApiClient.post<{ success: boolean; offer: Offer; message: string }>('/admin/offers', offer);
    if (res.offer) {
      res.offer = { ...res.offer, id: res.offer.id || res.offer._id || res.offer.code };
    }
    return res;
  },
  updateOffer: async (id: string, updates: Partial<Offer>) => {
    const res = await ApiClient.patch<{ success: boolean; offer: Offer; message: string }>(`/admin/offers/${id}`, updates);
    if (res.offer) {
      res.offer = { ...res.offer, id: res.offer.id || res.offer._id || res.offer.code };
    }
    return res;
  },
  deleteOffer: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/offers/${id}`);
  },
  validateOffer: async (payload: { code: string; subtotal: number; fulfillmentType: string }) => {
    return ApiClient.post<OfferValidationResult>('/offers/validate', payload);
  },

  // Gallery Management (Official Photos, Sections, Customer Moderation)
  getGalleryPhotos: async (params?: {
    section?: string;
    publicationStatus?: string;
    mediaSource?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = buildQueryString(params);
    const res = await ApiClient.get<{
      success: boolean;
      photos: GalleryMedia[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/gallery/photos${qs}`);
    if (res.success && Array.isArray(res.photos)) {
      res.photos = res.photos.map((p) => ({ ...p, id: p.id || p._id || '' }));
    }
    return res;
  },
  getGalleryPhotoById: async (id: string) => {
    const res = await ApiClient.get<{ success: boolean; photo: GalleryMedia }>(`/admin/gallery/photos/${id}`);
    if (res.photo) {
      res.photo = { ...res.photo, id: res.photo.id || res.photo._id || '' };
    }
    return res;
  },
  uploadGalleryPhoto: async (formData: FormData) => {
    const res = await ApiClient.post<{ success: boolean; photo: GalleryMedia; message: string }>(
      '/admin/gallery/photos',
      formData
    );
    if (res.photo) {
      res.photo = { ...res.photo, id: res.photo.id || res.photo._id || '' };
    }
    return res;
  },
  updateGalleryPhoto: async (id: string, updates: Partial<GalleryMedia>) => {
    const res = await ApiClient.put<{ success: boolean; photo: GalleryMedia; message: string }>(
      `/admin/gallery/photos/${id}`,
      updates
    );
    if (res.photo) {
      res.photo = { ...res.photo, id: res.photo.id || res.photo._id || '' };
    }
    return res;
  },
  updateGalleryPhotoStatus: async (id: string, status: PublicationStatus) => {
    const res = await ApiClient.patch<{ success: boolean; photo: GalleryMedia; message: string }>(
      `/admin/gallery/photos/${id}/status`,
      { status }
    );
    if (res.photo) {
      res.photo = { ...res.photo, id: res.photo.id || res.photo._id || '' };
    }
    return res;
  },
  deleteGalleryPhoto: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/gallery/photos/${id}`);
  },

  // Gallery Sections
  getGallerySections: async () => {
    const res = await ApiClient.get<{ success: boolean; sections: GallerySection[] }>('/admin/gallery/sections');
    if (res.success && Array.isArray(res.sections)) {
      res.sections = res.sections.map((s) => ({ ...s, id: s.id || s._id || '' }));
    }
    return res;
  },
  createGallerySection: async (data: Partial<GallerySection>) => {
    const res = await ApiClient.post<{ success: boolean; section: GallerySection; message: string }>(
      '/admin/gallery/sections',
      data
    );
    if (res.section) {
      res.section = { ...res.section, id: res.section.id || res.section._id || '' };
    }
    return res;
  },
  updateGallerySection: async (id: string, updates: Partial<GallerySection>) => {
    const res = await ApiClient.put<{ success: boolean; section: GallerySection; message: string }>(
      `/admin/gallery/sections/${id}`,
      updates
    );
    if (res.section) {
      res.section = { ...res.section, id: res.section.id || res.section._id || '' };
    }
    return res;
  },
  deleteGallerySection: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/gallery/sections/${id}`);
  },

  // Customer Gallery Uploads & Moderation
  getCustomerUploads: async (params?: { moderationStatus?: string; page?: number; limit?: number }) => {
    const qs = buildQueryString(params);
    const res = await ApiClient.get<{
      success: boolean;
      submissions: GalleryMedia[];
      total: number;
      page: number;
      limit: number;
    }>(`/admin/gallery/customer-uploads${qs}`);
    if (res.success && Array.isArray(res.submissions)) {
      res.submissions = res.submissions.map((s) => ({ ...s, id: s.id || s._id || '' }));
    }
    return res;
  },
  getCustomerUploadById: async (id: string) => {
    const res = await ApiClient.get<{
      success: boolean;
      submission: GalleryMedia;
      moderationHistory: MediaModerationRecord[];
    }>(`/admin/gallery/customer-uploads/${id}`);
    if (res.submission) {
      res.submission = { ...res.submission, id: res.submission.id || res.submission._id || '' };
    }
    return res;
  },
  moderateCustomerUpload: async (
    id: string,
    payload: { action: 'approved' | 'rejected' | 'removed'; reason?: string }
  ) => {
    const res = await ApiClient.patch<{
      success: boolean;
      media: GalleryMedia;
      moderation: MediaModerationRecord;
      message: string;
    }>(`/admin/gallery/customer-uploads/${id}/moderate`, payload);
    if (res.media) {
      res.media = { ...res.media, id: res.media.id || res.media._id || '' };
    }
    return res;
  },
  deleteCustomerUpload: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/gallery/customer-uploads/${id}`);
  },

  // Reviews & Feedback
  getReviews: async (params?: { status?: string; rating?: string; search?: string; page?: number; limit?: number }) => {
    const qs = buildQueryString(params);
    const res = await ApiClient.get<{
      success: boolean;
      reviews:
        | ReviewItem[]
        | {
            total: number;
            page: number;
            totalPages: number;
            reviews: ReviewItem[];
          };
    }>(`/admin/reviews/admin/all${qs}`);

    const rawList = Array.isArray(res.reviews) ? res.reviews : res.reviews?.reviews || [];
    const normalized = rawList.map((r) => ({ ...r, id: r.id || r._id || '' }));
    const meta = Array.isArray(res.reviews)
      ? { total: normalized.length, page: params?.page || 1, totalPages: 1 }
      : {
          total: res.reviews?.total ?? normalized.length,
          page: res.reviews?.page ?? (params?.page || 1),
          totalPages: res.reviews?.totalPages ?? 1,
        };

    return {
      success: res.success,
      reviews: normalized,
      ...meta,
    };
  },
  toggleReviewApproval: async (id: string, isApproved?: boolean) => {
    const res = await ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(
      `/admin/reviews/admin/${id}/approve`,
      { isApproved }
    );
    if (res.review) {
      res.review = { ...res.review, id: res.review.id || res.review._id || id };
    }
    return res;
  },
  replyReview: async (id: string, staffReply: string) => {
    const res = await ApiClient.patch<{ success: boolean; review: ReviewItem; message: string }>(
      `/admin/reviews/admin/${id}/reply`,
      { staffReply }
    );
    if (res.review) {
      res.review = { ...res.review, id: res.review.id || res.review._id || id };
    }
    return res;
  },
  deleteReview: async (id: string) => {
    return ApiClient.delete<{ success: boolean; message: string }>(`/admin/reviews/admin/${id}`);
  },

  // Restaurant Settings
  getSettings: async () => {
    return ApiClient.get<{ success: boolean; settings: RestaurantSettings }>('/admin/settings/admin');
  },
  getPublicSettings: async () => {
    return ApiClient.get<{ success: boolean; settings: RestaurantSettings }>('/settings');
  },
  updateSettings: async (settings: Partial<RestaurantSettings>) => {
    return ApiClient.put<{ success: boolean; settings: RestaurantSettings; message: string }>('/admin/settings/admin', settings);
  },

  // Reports, GST Tax & CSV Exports
  getTaxReport: async (params?: { period?: string; startDate?: string; endDate?: string }) => {
    const qs = buildQueryString(params);
    return ApiClient.get<TaxReportResponse & { success: boolean }>(`/admin/reports/tax${qs}`);
  },
  getReportsStatus: async () => {
    return ApiClient.get<ReportsModuleStatus & { success: boolean }>('/admin/reports/status');
  },
  downloadReportCsv: async (
    type: 'orders' | 'customers' | 'tax' | 'menu-performance',
    params?: { period?: string; startDate?: string; endDate?: string }
  ) => {
    const token = getAuthToken();
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
    const qs = buildQueryString(params);
    const res = await fetch(`${baseUrl}/admin/reports/export/${type}.csv${qs}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      throw new Error(`Failed to export ${type} CSV (${res.status})`);
    }
    return res.blob();
  },

  // 6 Canonical BI Services
  getAnalyticsOverview: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; metrics: OverviewMetrics }>(
      `/admin/analytics/overview${qs}`
    );
  },
  getAnalyticsRevenue: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; revenue: RevenueAnalytics }>(
      `/admin/analytics/revenue${qs}`
    );
  },
  getAnalyticsOrders: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; orders: OrderAnalytics }>(
      `/admin/analytics/orders${qs}`
    );
  },
  getAnalyticsProducts: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; products: ProductPerformanceAnalytics }>(
      `/admin/analytics/products${qs}`
    );
  },
  getAnalyticsCustomers: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; customers: CustomerAnalytics }>(
      `/admin/analytics/customers${qs}`
    );
  },
  getAnalyticsPayments: async (query?: DateFilterQuery) => {
    const qs = buildQueryString(query);
    return ApiClient.get<{ success: boolean; dateRange: ResolvedDateRange; payments: PaymentAnalytics }>(
      `/admin/analytics/payments${qs}`
    );
  },

  // Audit Trail & Compliance Ledger
  getAuditLogs: async (query?: AuditLogQuery) => {
    const qs = buildQueryString(query);
    const res = await ApiClient.get<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      logs: AuditLogEntry[];
    }>(`/admin/audit${qs}`);
    if (res.success && Array.isArray(res.logs)) {
      res.logs = res.logs.map((l, idx) => ({
        ...l,
        id: l.id || l._id || `${l.action}-${l.timestamp}-${idx}`,
      }));
    }
    return res;
  },
  getAuditStats: async () => {
    const res = await ApiClient.get<{
      success: boolean;
      stats: AuditStats;
    }>('/admin/audit/stats');
    if (res.success && res.stats && Array.isArray(res.stats.recentActions)) {
      res.stats.recentActions = res.stats.recentActions.map((l, idx) => ({
        ...l,
        id: l.id || l._id || `${l.action}-${l.timestamp}-${idx}`,
      }));
    }
    return res;
  },
  purgeAuditLogs: async (daysToKeep = 90) => {
    return ApiClient.delete<{
      success: boolean;
      message: string;
      deletedCount: number;
      retainedAfter?: string;
    }>(`/admin/audit/purge?daysToKeep=${daysToKeep}`);
  },

  // Image Upload & Storage Management
  uploadImage: async (file: File, folder?: string) => {
    const formData = new FormData();
    formData.append('image', file);
    if (folder) {
      formData.append('folder', folder);
    }
    return ApiClient.post<ProcessedUploadResult & { success: boolean }>('/admin/upload', formData);
  },
  uploadMultipleImages: async (files: File[], folder?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('images', f));
    if (folder) {
      formData.append('folder', folder);
    }
    return ApiClient.post<MultipleUploadResult>('/admin/upload/multiple', formData);
  },
  getUploadStatus: async () => {
    return ApiClient.get<{ success: boolean; status?: string; provider?: string }>('/admin/upload/status');
  },
  getUploadStats: async () => {
    return ApiClient.get<UploadStorageStats & { success: boolean }>('/admin/upload/stats');
  },
  deleteUploadedFile: async (filenameOrPublicId: string) => {
    return ApiClient.delete<DeleteUploadResult & { success: boolean }>(
      `/admin/upload/${encodeURIComponent(filenameOrPublicId)}`
    );
  },

  // In-App Notifications
  getNotifications: async (query?: NotificationQuery) => {
    const qs = buildQueryString(query);
    const res = await ApiClient.get<{
      success: boolean;
      notifications: NotificationItem[];
      total: number;
      unreadCount: number;
    }>(`/admin/notifications${qs}`);
    if (res.success && Array.isArray(res.notifications)) {
      res.notifications = res.notifications.map((n) => ({
        ...n,
        id: n.id || n._id || '',
      }));
    }
    return res;
  },
  createNotification: async (dto: CreateNotificationDTO) => {
    const res = await ApiClient.post<{
      success: boolean;
      notification: NotificationItem;
      message: string;
    }>('/admin/notifications', dto);
    if (res.notification) {
      res.notification = { ...res.notification, id: res.notification.id || res.notification._id || '' };
    }
    return res;
  },
  markNotificationAsRead: async (id: string) => {
    const res = await ApiClient.patch<{
      success: boolean;
      notification: NotificationItem;
      message: string;
    }>(`/admin/notifications/${id}/read`, {});
    if (res.notification) {
      res.notification = { ...res.notification, id: res.notification.id || res.notification._id || id };
    }
    return res;
  },
  markAllNotificationsAsRead: async (
    recipientType: NotificationRecipientType = 'admin',
    recipientId?: string
  ) => {
    return ApiClient.patch<{
      success: boolean;
      modifiedCount: number;
      message: string;
    }>('/admin/notifications/read-all', { recipientType, recipientId });
  },
  getNotificationsStatus: async () => {
    return ApiClient.get<{
      success: boolean;
      module: string;
      status: string;
      timestamp: string;
    }>('/admin/notifications/status');
  },
};
