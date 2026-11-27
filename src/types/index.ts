export type UserRole = 'ADMIN' | 'STAFF' | 'SUPERADMIN' | 'MANAGER' | 'superadmin' | 'manager' | 'staff' | 'admin';
export type UserStatus = 'ACTIVE' | 'INACTIVE';

export interface AdminUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  username: string;
  role: UserRole;
  status?: UserStatus;
  active?: boolean;
  tokenVersion?: number;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodCategory {
  id: string;
  _id?: string;
  name: string;
  slug?: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface FoodItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  fullDescription: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  isVeg: boolean;
  isSignature?: boolean;
  spiceLevel: 1 | 2 | 3;
  preparationTime: string;
  ingredients: string[];
  chefNote?: string;
  available: boolean;
  displayOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  dishId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
  image?: string;
}

export interface OrderStatusHistoryItem {
  status: string;
  timestamp: string;
  actor: string;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryAddress?: string;
  fulfillmentType: 'dine-in' | 'pickup' | 'delivery';
  items: OrderItem[];
  subtotal: number;
  subtotalInPaise?: number;
  taxAmount: number;
  taxInPaise?: number;
  deliveryCharge: number;
  deliveryInPaise?: number;
  discountAmount: number;
  discountInPaise?: number;
  grandTotal: number;
  grandTotalInPaise?: number;
  paymentMethod: 'online' | 'cod' | 'upi';
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'awaiting_verification';
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'out_for_delivery' | 'completed' | 'cancelled';
  cancellationReason?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  idempotencyKey?: string;
  notes?: string;
  statusHistory: OrderStatusHistoryItem[];
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerStatsSummary {
  totalCustomers: number;
  repeatCustomers: number;
  newCustomers: number;
  totalRevenueFromCustomers: number;
  averageSpendPerCustomer: number;
  totalOrdersPlaced: number;
}

export interface Payment {
  id: string;
  paymentReference: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  paymentMethod: 'online' | 'cod' | 'upi';
  paymentStatus: 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded' | 'awaiting_verification';
  transactionDate: string;
  gatewayTransactionReference?: string;
  collectedBy?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  deliveryCharge: number;
  discountAmount: number;
  grandTotal: number;
  paymentMethod: string;
  paymentStatus: string;
  issuedAt: string;
}

export interface TableBooking {
  id: string;
  _id?: string;
  bookingRef?: string;
  customerName: string;
  phone: string;
  email?: string;
  date: string;
  time: string;
  guests: string;
  occasion: string;
  specialRequests?: string;
  status: 'new' | 'contacted' | 'confirmed' | 'rescheduled' | 'rejected' | 'completed' | 'cancelled';
  allocatedTable?: string;
  confirmedAt?: string;
  confirmationMethod?: 'on-screen' | 'whatsapp' | 'call';
  holdPolicy?: string;
  staffNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PartyInquiry {
  id: string;
  _id?: string;
  customerName: string;
  phone: string;
  email?: string;
  eventType: 'birthday' | 'anniversary' | 'corporate' | 'family_gathering' | 'other';
  preferredDate: string;
  guestCount: number;
  budgetRange?: string;
  specialRequirements?: string;
  status: 'new' | 'contacted' | 'quoted' | 'confirmed' | 'cancelled';
  staffNotes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Promotion {
  id: string;
  _id?: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  serves: string;
  badge: string;
  items: string[];
  image: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export type MediaSource = 'official' | 'customer';
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'removed';
export type PublicationStatus = 'draft' | 'published' | 'archived';
export type MediaVisibility = 'public' | 'private';

export interface GallerySection {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  slug: string;
  displayOrder: number;
  isActive: boolean;
  isPublic: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GalleryMedia {
  id: string;
  _id?: string;
  title?: string;
  caption?: string;
  description?: string;
  altText?: string;
  imageUrl: string;
  publicId: string;
  storageProvider: 'cloudinary' | 'local';
  mimeType: string;
  fileSize?: number;
  width?: number;
  height?: number;
  format?: string;
  uploaderType: 'admin' | 'customer';
  uploadedByAdmin?: string;
  sectionId?: string;
  mediaSource: MediaSource;
  moderationStatus: ModerationStatus;
  publicationStatus: PublicationStatus;
  visibility: MediaVisibility;
  displayOrder: number;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MediaModerationRecord {
  id: string;
  _id?: string;
  mediaId: string;
  reviewedBy: string;
  action: 'approved' | 'rejected' | 'removed';
  reason?: string;
  reviewedAt: string;
}

export interface ReviewItem {
  id: string;
  _id?: string;
  customerName: string;
  rating: number;
  comment: string;
  dishName?: string;
  source: 'website' | 'google' | 'direct';
  isApproved: boolean;
  staffReply?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RestaurantSettings {
  restaurantName: string;
  tagline: string;
  eyebrow: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  taxRatePercent: number;
  deliveryFee: number;
  minOrderValue: number;
  orderAcceptanceEnabled: boolean;
  tableReservationEnabled: boolean;
  invoicePrefix: string;
  gstin?: string;
  zomatoRating: string;
  socialInstagram: string;
  socialFacebook: string;
}

export * from './analytics';

export interface AuditLogEntry {
  id: string;
  _id?: string;
  action: string;
  user: string;
  details: string;
  ip?: string;
  timestamp: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditStats {
  totalLogs: number;
  uniqueUsersCount: number;
  actionBreakdown: Record<string, number>;
  recentActions: AuditLogEntry[];
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  search?: string;
  action?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
}

export type OfferDiscountType = 'percentage' | 'fixed' | 'free_shipping';
export type OfferFulfillmentType = 'delivery' | 'dine-in' | 'pickup';

export interface Offer {
  id: string;
  _id?: string;
  code: string;
  title: string;
  description?: string;
  discountType: OfferDiscountType;
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderValue: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  usedCount: number;
  perUserLimit: number;
  applicableFulfillment: OfferFulfillmentType[];
  displayOnBanner: boolean;
  bannerText?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OfferCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface OfferValidationResult {
  success?: boolean;
  valid: boolean;
  code: string;
  discountType: OfferDiscountType;
  discountValue: number;
  discountPaise: number;
  discountAmount: number;
  message: string;
  offer?: Partial<Offer>;
}

export interface ProcessedUploadResult {
  success?: boolean;
  url: string;
  filename: string;
  size: number;
  provider: 'cloudinary' | 'local';
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  mimeType?: string;
  originalName?: string;
  message?: string;
}

export interface MultipleUploadResult {
  success: boolean;
  count: number;
  files: ProcessedUploadResult[];
  message?: string;
}

export interface UploadStorageStats {
  success?: boolean;
  provider: 'cloudinary' | 'local' | 'hybrid';
  isCloudinaryConfigured: boolean;
  localFileCount: number;
  localTotalBytes: number;
  localTotalMegabytes: number;
  uploadsDirectory: string;
  allowedMimeTypes: string[];
  maxFileSizeBytes: number;
  maxFileSizeMB: number;
}

export interface DeleteUploadResult {
  success?: boolean;
  deleted: boolean;
  filename: string;
  provider: 'cloudinary' | 'local' | 'both';
  message: string;
}

export interface TaxReportResponse {
  success?: boolean;
  period: string;
  startDate: string;
  endDate: string;
  grossSales: number;
  exemptOrDiscount: number;
  taxableSales: number;
  cgstAmount: number;
  sgstAmount: number;
  totalGst: number;
  paidOrdersCount: number;
}

export interface ReportsModuleStatus {
  success?: boolean;
  module: string;
  status: string;
  database: string;
  timestamp: string;
}

export type NotificationChannel = 'in_app' | 'email' | 'sms' | 'push';
export type NotificationRecipientType = 'customer' | 'staff' | 'admin';

export interface NotificationItem {
  id: string;
  _id?: string;
  recipientType: NotificationRecipientType;
  recipientId?: string;
  title: string;
  message: string;
  channel: NotificationChannel;
  isRead: boolean;
  readAt?: string;
  metadata?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNotificationDTO {
  recipientType?: NotificationRecipientType;
  recipientId?: string;
  title: string;
  message: string;
  channel?: NotificationChannel;
  metadata?: Record<string, any>;
}

export interface NotificationQuery {
  recipientId?: string;
  recipientType?: NotificationRecipientType;
  isRead?: boolean | string;
  channel?: NotificationChannel;
  limit?: number;
  skip?: number;
}

export type ContactStatus = 'new' | 'in_progress' | 'responded' | 'archived';

export type ContactSubject =
  | 'general'
  | 'feedback'
  | 'complaint'
  | 'catering'
  | 'events'
  | 'partnership'
  | 'careers'
  | 'other';

export interface ContactInquiry {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: ContactStatus;
  responseNotes?: string;
  respondedAt?: string;
  respondedBy?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactStats {
  total: number;
  new: number;
  in_progress: number;
  responded: number;
  archived: number;
  recentWeekCount: number;
}

export type DeliveryTrackingStatus =
  | 'unassigned'
  | 'assigned'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryLocation {
  lat: number;
  lng: number;
  updatedAt?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  pincodes: string[];
  minOrderValue: number;
  deliveryFee: number;
  estimatedMinutes: number;
  isActive: boolean;
}

export interface DeliveryAssignment {
  id: string;
  _id?: string;
  orderNumber: string;
  riderName: string;
  riderPhone: string;
  vehicleNumber?: string;
  trackingStatus: DeliveryTrackingStatus;
  currentLocation?: DeliveryLocation;
  destinationAddress: string;
  customerName: string;
  customerPhone: string;
  estimatedArrival?: string;
  deliveredAt?: string;
  deliveryNotes?: string;
  otp?: string;
  assignedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}



