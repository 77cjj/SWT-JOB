import MarketplacePage from '../../features/MarketplacePage';
import DesktopLayout from '../../layout/desktop/Layout';
import MobileLayout from '../../layout/mobile/Layout';
import useDevice from '../../hooks/useDevice';

export default function DealsMarketRoute() {
  const isMobile = useDevice();
  const content = <MarketplacePage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
