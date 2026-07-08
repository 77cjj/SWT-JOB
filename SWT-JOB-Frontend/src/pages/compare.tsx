import useDevice from '../hooks/useDevice';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import HomeExperience from '../features/HomeExperience';

export default function ComparePage() {
  const isMobile = useDevice();

  const content = <HomeExperience />;

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
