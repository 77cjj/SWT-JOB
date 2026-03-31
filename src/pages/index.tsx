import HomeExperience from '../features/HomeExperience'
import DesktopLayout from '../layout/desktop/Layout'
import MobileLayout from '../layout/mobile/Layout'
import useDevice from '../hooks/useDevice'

export default function IndexPage() {
  const isMobile = useDevice()

  const content = <HomeExperience />

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  )
}

