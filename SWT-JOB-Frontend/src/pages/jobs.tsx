import useDevice from '../hooks/useDevice';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import HistoricalJobsPage from '../features/HistoricalJobsPage';

export default function JobsPage() {
  const isMobile = useDevice();

  const content = <HistoricalJobsPage />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
