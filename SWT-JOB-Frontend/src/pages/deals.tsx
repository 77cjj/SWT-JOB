import DealsPage from '../features/DealsPage';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import useDevice from '../hooks/useDevice';

export default function DealsRoute() {
  const isMobile = useDevice();
  const content = <DealsPage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
