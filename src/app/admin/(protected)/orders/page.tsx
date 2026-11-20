import { Suspense } from 'react';
import { OrdersManagement } from '@/views/OrdersManagement';
import { LoadingState } from '@/components/common/LoadingState';

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading kitchen and delivery orders..." />}>
      <OrdersManagement />
    </Suspense>
  );
}
