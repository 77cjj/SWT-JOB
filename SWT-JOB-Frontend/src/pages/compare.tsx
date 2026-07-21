import useDevice from '../hooks/useDevice';
import DesktopLayout from '../layout/desktop/Layout';
import MobileLayout from '../layout/mobile/Layout';
import HomeExperience from '../features/HomeExperience';

export default function ComparePage() {
  const isMobile = useDevice();

  const content = <HomeExperience />;

  return isMobile ? (
    <MobileLayout mainClassName="min-h-0 flex-1 overflow-y-auto px-4 py-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      {content}
    </MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  );
}
