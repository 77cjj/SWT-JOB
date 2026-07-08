import useDevice from '../hooks/useDevice';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import MarketplacePage from '../features/MarketplacePage';

export default function MarketPage() {
  const isMobile = useDevice();

  const content = <MarketplacePage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
