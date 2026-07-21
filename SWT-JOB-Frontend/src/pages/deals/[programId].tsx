import DealDetailPage from '../../features/DealDetailPage';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';

export default function DealDetailRoute() {
  const isMobile = useDevice();
  const content = <DealDetailPage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-4xl">{content}</DesktopLayout>
  );
}
