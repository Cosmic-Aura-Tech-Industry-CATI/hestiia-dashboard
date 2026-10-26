import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from '../components/common/ToastContext';
import { AdminLayout } from '../components/layout/AdminLayout';
import { LoadingState } from '../components/common/LoadingState';

// Lazy-loaded Pages for Route Code-Splitting
const AdminLogin = lazy(() => import('../pages/AdminLogin').then((m) => ({ default: m.AdminLogin })));
const DashboardOverview = lazy(() => import('../pages/DashboardOverview').then((m) => ({ default: m.DashboardOverview })));
const OrdersManagement = lazy(() => import('../pages/OrdersManagement').then((m) => ({ default: m.OrdersManagement })));
const OrderDetails = lazy(() => import('../pages/OrderDetails').then((m) => ({ default: m.OrderDetails })));
const MenuManagement = lazy(() => import('../pages/MenuManagement').then((m) => ({ default: m.MenuManagement })));
const CategoryManagement = lazy(() => import('../pages/CategoryManagement').then((m) => ({ default: m.CategoryManagement })));
const CustomersManagement = lazy(() => import('../pages/CustomersManagement').then((m) => ({ default: m.CustomersManagement })));
const PaymentsManagement = lazy(() => import('../pages/PaymentsManagement').then((m) => ({ default: m.PaymentsManagement })));
const TableBookings = lazy(() => import('../pages/TableBookings').then((m) => ({ default: m.TableBookings })));
const PartyInquiries = lazy(() => import('../pages/PartyInquiries').then((m) => ({ default: m.PartyInquiries })));
const WebsiteContent = lazy(() => import('../pages/WebsiteContent').then((m) => ({ default: m.WebsiteContent })));
const PromotionsManagement = lazy(() => import('../pages/PromotionsManagement').then((m) => ({ default: m.PromotionsManagement })));
const GalleryManagement = lazy(() => import('../pages/GalleryManagement').then((m) => ({ default: m.GalleryManagement })));
const ReviewsManagement = lazy(() => import('../pages/ReviewsManagement').then((m) => ({ default: m.ReviewsManagement })));
const Reports = lazy(() => import('../pages/Reports').then((m) => ({ default: m.Reports })));
const RestaurantSettings = lazy(() => import('../pages/RestaurantSettings').then((m) => ({ default: m.RestaurantSettings })));
const AdminProfile = lazy(() => import('../pages/AdminProfile').then((m) => ({ default: m.AdminProfile })));

const SuspenseLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingState message="Loading module..." />}>{children}</Suspense>
);

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Auth routes */}
      <Route
        path="/login"
        element={
          <SuspenseLoader>
            <AdminLogin />
          </SuspenseLoader>
        }
      />
      <Route
        path="/admin/login"
        element={
          <SuspenseLoader>
            <AdminLogin />
          </SuspenseLoader>
        }
      />

      {/* Admin Dashboard Protected Routes (Both / and /admin/* namespaces) */}
      <Route
        element={
          <ToastProvider>
            <AdminLayout />
          </ToastProvider>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <SuspenseLoader>
              <DashboardOverview />
            </SuspenseLoader>
          }
        />
        <Route
          path="orders"
          element={
            <SuspenseLoader>
              <OrdersManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="orders/:id"
          element={
            <SuspenseLoader>
              <OrderDetails />
            </SuspenseLoader>
          }
        />
        <Route
          path="menu"
          element={
            <SuspenseLoader>
              <MenuManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="categories"
          element={
            <SuspenseLoader>
              <CategoryManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="customers"
          element={
            <SuspenseLoader>
              <CustomersManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="payments"
          element={
            <SuspenseLoader>
              <PaymentsManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="bookings"
          element={
            <SuspenseLoader>
              <TableBookings />
            </SuspenseLoader>
          }
        />
        <Route
          path="party-inquiries"
          element={
            <SuspenseLoader>
              <PartyInquiries />
            </SuspenseLoader>
          }
        />
        <Route
          path="website-content"
          element={
            <SuspenseLoader>
              <WebsiteContent />
            </SuspenseLoader>
          }
        />
        <Route
          path="promotions"
          element={
            <SuspenseLoader>
              <PromotionsManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="gallery"
          element={
            <SuspenseLoader>
              <GalleryManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="reviews"
          element={
            <SuspenseLoader>
              <ReviewsManagement />
            </SuspenseLoader>
          }
        />
        <Route
          path="reports"
          element={
            <SuspenseLoader>
              <Reports />
            </SuspenseLoader>
          }
        />
        <Route
          path="settings"
          element={
            <SuspenseLoader>
              <RestaurantSettings />
            </SuspenseLoader>
          }
        />
        <Route
          path="profile"
          element={
            <SuspenseLoader>
              <AdminProfile />
            </SuspenseLoader>
          }
        />

        {/* Backward compatible /admin/ prefix routes */}
        <Route path="admin" element={<Navigate to="/dashboard" replace />} />
        <Route path="admin/dashboard" element={<Navigate to="/dashboard" replace />} />
        <Route path="admin/orders" element={<Navigate to="/orders" replace />} />
        <Route path="admin/orders/:id" element={<Navigate to="/orders/:id" replace />} />
        <Route path="admin/menu" element={<Navigate to="/menu" replace />} />
        <Route path="admin/categories" element={<Navigate to="/categories" replace />} />
        <Route path="admin/customers" element={<Navigate to="/customers" replace />} />
        <Route path="admin/payments" element={<Navigate to="/payments" replace />} />
        <Route path="admin/bookings" element={<Navigate to="/bookings" replace />} />
        <Route path="admin/party-inquiries" element={<Navigate to="/party-inquiries" replace />} />
        <Route path="admin/website-content" element={<Navigate to="/website-content" replace />} />
        <Route path="admin/promotions" element={<Navigate to="/promotions" replace />} />
        <Route path="admin/gallery" element={<Navigate to="/gallery" replace />} />
        <Route path="admin/reviews" element={<Navigate to="/reviews" replace />} />
        <Route path="admin/reports" element={<Navigate to="/reports" replace />} />
        <Route path="admin/settings" element={<Navigate to="/settings" replace />} />
        <Route path="admin/profile" element={<Navigate to="/profile" replace />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
