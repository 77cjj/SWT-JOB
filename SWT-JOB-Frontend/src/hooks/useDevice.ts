import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export default function useDevice() {
  // 保持 SSR 与客户端首次渲染一致，避免 hydration mismatch
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const update = () => setIsMobile(mediaQuery.matches);

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  return isMobile;
}

