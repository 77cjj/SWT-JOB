import HomeExperience from '../features/HomeExperience'
import DesktopLayout from '../layout/desktop/Layout'
import MobileLayout from '../layout/mobile/Layout'
import useDevice from '../hooks/useDevice'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function IndexPage() {
  const isMobile = useDevice()
  const router = useRouter()

  useEffect(() => {
    router.prefetch('/docs').catch(() => null)
    router.prefetch('/docs/intro').catch(() => null)
  }, [router])

  const content = <HomeExperience />

  return isMobile ? (
    <MobileLayout>{content}</MobileLayout>
  ) : (
    <DesktopLayout maxWidthClassName="max-w-7xl">{content}</DesktopLayout>
  )
}

