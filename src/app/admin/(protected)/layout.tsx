import React from 'react';
import { ToastProvider } from '@/components/common/ToastContext';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <AdminLayout>{children}</AdminLayout>
    </ToastProvider>
  );
}
