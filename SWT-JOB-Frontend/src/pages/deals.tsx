import { useEffect } from 'react';
import { useRouter } from 'next/router';
import DealsPage from '../features/DealsPage';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import useDevice from '../hooks/useDevice';

export default function DealsRoute() {
  const isMobile = useDevice();
  const router = useRouter();

  useEffect(() => {
    if (router.query.section === 'market') {
      void router.replace('/deals/market');
    }
  }, [router.query.section, router]);

  const content = <DealsPage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
