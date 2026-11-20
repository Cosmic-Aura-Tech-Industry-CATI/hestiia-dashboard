import { Suspense } from 'react';
import { MenuManagement } from '@/views/MenuManagement';
import { LoadingState } from '@/components/common/LoadingState';

export default function MenuPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading food menu..." />}>
      <MenuManagement />
    </Suspense>
  );
}
